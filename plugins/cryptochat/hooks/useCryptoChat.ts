"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatService } from "../services/chat-service";
import { DataIngestionService } from "../services/data-ingestion";
import { VectorService } from "../services/vector-service";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  sources?: Array<{ type: string; id: string; excerpt: string }>;
}

export function useCryptoChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vectorServiceRef = useRef<VectorService | null>(null);
  const dataIngestionRef = useRef<DataIngestionService | null>(null);
  const chatServiceRef = useRef<ChatService | null>(null);

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === "undefined") return;

    const initializeChat = async () => {
      try {
        if (!vectorServiceRef.current) {
          vectorServiceRef.current = new VectorService();
          dataIngestionRef.current = new DataIngestionService(
            vectorServiceRef.current,
          );
          chatServiceRef.current = new ChatService(vectorServiceRef.current);
        }

        await vectorServiceRef.current.initialize();
        setIsInitialized(true);

        // Add welcome message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `👋 Welcome to CryptoChat! I can help you query and analyze your BTCPayServer data. 

You can ask me questions like:
• "Show me recent invoices"
• "What's my total revenue this month?"
• "Find invoices from customer X"
• "Analyze payment trends"

Would you like me to index your BTCPayServer data first?`,
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        console.error("Failed to initialize CryptoChat:", err);
        setError("Failed to initialize chat system");
      }
    };

    initializeChat();
  }, []);

  const indexData = useCallback(async (btcPayData: any) => {
    if (!dataIngestionRef.current) return;

    setIsIndexing(true);
    setError(null);

    try {
      await dataIngestionRef.current.ingestAllData(btcPayData);

      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          role: "system",
          content:
            "✅ Successfully indexed BTCPayServer data. You can now ask questions about your invoices, payments, and store information.",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Failed to index data:", err);
      setError("Failed to index BTCPayServer data");
    } finally {
      setIsIndexing(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chatServiceRef.current) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await chatServiceRef.current.chat(content, messages);

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.content,
          timestamp: new Date(),
          sources: response.sources,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Failed to process your message");

        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              "❌ Sorry, I encountered an error processing your request. Please try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages],
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "🔄 Chat cleared. How can I help you with your BTCPayServer data?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    isIndexing,
    sendMessage,
    clearMessages,
    indexData,
    isInitialized,
    error,
  };
}
