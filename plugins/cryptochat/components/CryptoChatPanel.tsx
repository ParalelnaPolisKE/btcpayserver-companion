"use client";

import {
  AlertCircle,
  Database,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchInvoices } from "@/lib/btcpay-client-wrapper";
import { useCryptoChat } from "../hooks/useCryptoChat";
import { getCryptoChatSettings } from "../utils/store";
import MarkdownRenderer from "./MarkdownRenderer";

interface CryptoChatPanelProps {
  invoices?: any[];
}

export default function CryptoChatPanel({
  invoices: initialInvoices = [],
}: CryptoChatPanelProps) {
  const [input, setInput] = useState("");
  const [invoices, setInvoices] = useState(initialInvoices);
  const [isFetchingInvoices, setIsFetchingInvoices] = useState(false);
  const [providerStatus, setProviderStatus] = useState<{
    provider: string;
    configured: boolean;
  }>({ provider: "openai", configured: false });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isIndexing,
    sendMessage,
    clearMessages,
    indexData,
    isInitialized,
    error,
  } = useCryptoChat();

  useEffect(() => {
    // Check provider configuration on client side only
    if (typeof window !== "undefined") {
      const settings = getCryptoChatSettings();
      const provider = settings.provider || "openai";
      const configured =
        provider === "openai" ? !!settings.openaiApiKey : !!settings.ollamaUrl;

      setProviderStatus({ provider, configured });
    }

    // Fetch invoices on mount if not already provided
    if (initialInvoices.length === 0) {
      fetchLatestInvoices();
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchLatestInvoices = async () => {
    setIsFetchingInvoices(true);
    try {
      const result = await fetchInvoices({ take: 100 });

      if (result.success && result.invoices) {
        setInvoices(result.invoices);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setIsFetchingInvoices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);

    // Refocus input after sending
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleIndexData = async () => {
    // Fetch latest invoices first if we don't have any
    if (invoices.length === 0) {
      await fetchLatestInvoices();
    }

    // Then index the data
    if (invoices.length > 0) {
      await indexData({ invoices });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              CryptoChat
              {!providerStatus.configured && (
                <Badge variant="outline" className="ml-2">
                  Mock Mode
                </Badge>
              )}
              {providerStatus.provider === "ollama" &&
                providerStatus.configured && (
                  <Badge variant="secondary" className="ml-2">
                    Ollama
                  </Badge>
                )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLatestInvoices}
                disabled={isFetchingInvoices}
                title="Fetch latest invoices from BTCPayServer"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetchingInvoices ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleIndexData}
                disabled={isIndexing || isFetchingInvoices}
                title={
                  invoices.length === 0
                    ? "Fetch invoices first"
                    : "Index invoices for AI search"
                }
              >
                {isIndexing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Indexing...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Index Data ({invoices.length})
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {error && (
            <Alert className="mx-4 mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!providerStatus.configured && (
            <Alert className="mx-4 mb-2">
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Running in mock mode. Configure your{" "}
                {providerStatus.provider === "ollama"
                  ? "Ollama server"
                  : "OpenAI API key"}{" "}
                in settings for full functionality.
              </AlertDescription>
            </Alert>
          )}

          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.role === "system"
                          ? "bg-muted"
                          : "bg-secondary"
                    }`}
                  >
                    {message.role === "user" ? (
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    ) : (
                      <MarkdownRenderer className="whitespace-pre-wrap prose-sm max-w-none">
                        {message.content}
                      </MarkdownRenderer>
                    )}

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <div className="text-xs opacity-70 mb-1">Sources:</div>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              {source.type}: {source.id.substring(0, 8)}...
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isInitialized
                    ? "Ask about your BTCPayServer data..."
                    : "Initializing..."
                }
                disabled={!isInitialized || isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!isInitialized || isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
