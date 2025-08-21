"use client";

import { Keyboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ManualInputProps {
  onSubmit: (ticketId: string) => void;
  isProcessing: boolean;
}

export default function ManualInput({
  onSubmit,
  isProcessing,
}: ManualInputProps) {
  const [ticketId, setTicketId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketId.trim()) {
      onSubmit(ticketId.trim());
      setTicketId("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Manual Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter ticket ID or invoice ID"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              disabled={isProcessing}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: Invoice ID (e.g., 6yfYp4vg1N9W8w)
            </p>
          </div>
          <Button
            type="submit"
            disabled={!ticketId.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Check In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
