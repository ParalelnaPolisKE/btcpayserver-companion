'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface ManualInputProps {
  onSubmit: (ticketNumber: string) => void;
  isLoading?: boolean;
}

export function ManualInput({ onSubmit, isLoading }: ManualInputProps) {
  const [ticketNumber, setTicketNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketNumber.trim()) {
      onSubmit(ticketNumber.trim());
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Manual Check-in</CardTitle>
        <CardDescription>
          Enter the ticket number to check in manually
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="EVT-0001-241225-12345"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !ticketNumber.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Check In
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}