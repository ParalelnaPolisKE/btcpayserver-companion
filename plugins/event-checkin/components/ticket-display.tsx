"use client";

import { format } from "date-fns";
import { AlertCircle, CheckCircle, Undo2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CheckInResult } from "../services/check-in";

interface TicketDisplayProps {
  result: CheckInResult | null;
  onUndo?: (ticketId: string) => void;
  onClear: () => void;
}

export default function TicketDisplay({
  result,
  onUndo,
  onClear,
}: TicketDisplayProps) {
  if (!result) return null;

  const getStatusIcon = () => {
    if (result.success) {
      return <CheckCircle className="h-12 w-12 text-green-500" />;
    }
    if (result.alreadyCheckedIn) {
      return <AlertCircle className="h-12 w-12 text-yellow-500" />;
    }
    return <XCircle className="h-12 w-12 text-red-500" />;
  };

  const getStatusColor = () => {
    if (result.success) return "bg-green-50 border-green-200";
    if (result.alreadyCheckedIn) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <Card className={`${getStatusColor()} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon()}
            <span className="text-xl">
              {result.success
                ? "Check-In Successful"
                : result.alreadyCheckedIn
                  ? "Already Checked In"
                  : "Check-In Failed"}
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-lg font-medium">{result.message}</div>

        {result.invoice && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Invoice ID:</span>
                <p className="font-mono font-medium">{result.invoice.id}</p>
              </div>
              {result.invoice.orderId && (
                <div>
                  <span className="text-muted-foreground">Order ID:</span>
                  <p className="font-mono font-medium">
                    {result.invoice.orderId}
                  </p>
                </div>
              )}
              {result.invoice.status && (
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-1">
                    <Badge
                      variant={
                        result.invoice.status === "Settled"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {result.invoice.status}
                    </Badge>
                  </div>
                </div>
              )}
              {result.invoice.amount && (
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-medium">
                    {result.invoice.amount} {result.invoice.currency}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {result.checkedInAt && (
          <div className="pt-2 border-t">
            <span className="text-muted-foreground">Checked in at:</span>
            <p className="font-medium">
              {format(new Date(result.checkedInAt), "PPpp")}
            </p>
          </div>
        )}

        {result.success && result.invoice?.id && onUndo && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => result.invoice?.id && onUndo(result.invoice.id)}
            className="w-full"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Undo Check-In
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
