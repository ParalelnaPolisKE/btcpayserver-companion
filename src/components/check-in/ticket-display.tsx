'use client';

import { Ticket } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, User, Mail, Calendar, Hash } from 'lucide-react';
import QRCode from 'react-qr-code';

interface TicketDisplayProps {
  ticket: Ticket;
  onReset?: () => void;
  checkInStatus?: {
    success: boolean;
    message: string;
  };
}

export function TicketDisplay({ ticket, onReset, checkInStatus }: TicketDisplayProps) {
  const isUsed = !!ticket.usedAt;
  const isPaid = ticket.paymentStatus === 'Paid';

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ticket Details</CardTitle>
          <Badge 
            variant={isUsed ? 'secondary' : isPaid ? 'default' : 'destructive'}
            className="ml-2"
          >
            {isUsed ? 'Used' : ticket.paymentStatus}
          </Badge>
        </div>
        <CardDescription>{ticket.eventName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checkInStatus && (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg ${
              checkInStatus.success
                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {checkInStatus.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{checkInStatus.message}</span>
          </div>
        )}

        <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <QRCode
            value={ticket.ticketNumber}
            size={150}
            level="M"
            bgColor="transparent"
            fgColor="currentColor"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Ticket Number:</span>
            <span className="font-mono font-medium">{ticket.ticketNumber}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{ticket.customerName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{ticket.customerEmail}</span>
          </div>

          {ticket.usedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Used at:</span>
              <span className="font-medium">
                {new Date(ticket.usedAt).toLocaleString()}
              </span>
            </div>
          )}

          {ticket.transactionNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Transaction:</span>
              <span className="font-mono text-xs">{ticket.transactionNumber}</span>
            </div>
          )}
        </div>

        {onReset && (
          <Button onClick={onReset} className="w-full" variant="outline">
            Scan Another Ticket
          </Button>
        )}
      </CardContent>
    </Card>
  );
}