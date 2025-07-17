'use client';

import { useState } from 'react';
import { QRScanner } from '@/components/check-in/qr-scanner';
import { ManualInput } from '@/components/check-in/manual-input';
import { TicketDisplay } from '@/components/check-in/ticket-display';
import { useCheckIn } from '@/hooks/use-check-in-server';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Keyboard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { clientEnv } from '@/lib/env';

interface CheckInClientProps {
  isUsingMockData: boolean;
}

export default function CheckInClient({ isUsingMockData }: CheckInClientProps) {
  const [scanMode, setScanMode] = useState<'qr' | 'manual'>('qr');
  const { ticket, checkInStatus, isLoading, handleTicketScan, reset } = useCheckIn({
    eventId: clientEnv.eventId,
  });

  const handleReset = () => {
    reset();
    setScanMode('qr');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-12 w-48 mb-8 mx-auto" />
          <Card className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (ticket) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Event Check-In</h1>
        <TicketDisplay
          ticket={ticket}
          checkInStatus={checkInStatus || undefined}
          onReset={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Event Check-In</h1>
      
      {isUsingMockData && (
        <Alert className="max-w-md mx-auto mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Using mock data. To connect to BTCPayServer, set BTCPAYSERVER_API_KEY in your environment.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={scanMode} onValueChange={(v) => setScanMode(v as 'qr' | 'manual')} className="max-w-md mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Scan QR Code
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="qr" className="mt-6">
          <QRScanner
            onScan={handleTicketScan}
            isEnabled={scanMode === 'qr' && !ticket}
          />
        </TabsContent>
        
        <TabsContent value="manual" className="mt-6">
          <ManualInput
            onSubmit={handleTicketScan}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {checkInStatus && !ticket && (
        <Card className="max-w-md mx-auto mt-6 p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-400 text-center">
            {checkInStatus.message}
          </p>
        </Card>
      )}
    </div>
  );
}