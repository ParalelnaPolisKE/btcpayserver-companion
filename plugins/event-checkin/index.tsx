'use client';

import { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';
import QRScanner from './components/qr-scanner';
import ManualInput from './components/manual-input';
import TicketDisplay from './components/ticket-display';
import StatsDisplay from './components/stats-display';
import { checkInService, CheckInResult } from './services/check-in';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EventCheckInApp() {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    // Load settings
    const savedSettings = localStorage.getItem('event-checkin-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      
      // Initialize check-in service
      if (parsed.btcpayUrl && parsed.storeId) {
        checkInService.init(parsed.btcpayUrl, parsed.storeId, parsed.apiKey);
      }
    } else {
      // Try to get BTCPay settings from parent app
      const btcpayUrl = localStorage.getItem('btcpayUrl');
      const storeId = localStorage.getItem('storeId');
      
      if (btcpayUrl && storeId) {
        checkInService.init(btcpayUrl, storeId);
        setSettings({ btcpayUrl, storeId });
      }
    }
    
    // Load stats
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const eventId = settings.eventId;
      const stats = await checkInService.getCheckInStats(eventId);
      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const playSound = () => {
    if (settings.soundEnabled !== false) {
      // Simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  };

  const handleCheckIn = async (ticketId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setLastResult(null);
    
    try {
      const result = await checkInService.checkInTicket(ticketId, settings.eventId);
      setLastResult(result);
      
      if (result.success) {
        playSound();
        toast.success(result.message);
        await loadStats();
      } else if (result.alreadyCheckedIn) {
        toast.warning(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check-in failed';
      toast.error(errorMessage);
      setLastResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = async (ticketId: string) => {
    try {
      const result = await checkInService.undoCheckIn(ticketId);
      if (result.success) {
        toast.success('Check-in undone');
        setLastResult(null);
        await loadStats();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to undo check-in');
    }
  };

  const handleScan = (data: string) => {
    // Extract ticket ID from QR data
    // Could be a URL or just the ID
    let ticketId = data;
    
    // If it's a URL, try to extract the ID
    if (data.includes('/')) {
      const parts = data.split('/');
      ticketId = parts[parts.length - 1];
    }
    
    handleCheckIn(ticketId);
  };

  const toggleScanning = () => {
    setIsScanning(!isScanning);
  };

  const clearResult = () => {
    setLastResult(null);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <QrCode className="h-8 w-8" />
          Event Check-In
        </h1>
        {settings.eventName && (
          <p className="text-lg text-muted-foreground">{settings.eventName}</p>
        )}
      </div>

      <div className="space-y-6">
        <StatsDisplay total={stats.total} today={stats.today} />

        {lastResult && (
          <TicketDisplay
            result={lastResult}
            onUndo={handleUndo}
            onClear={clearResult}
          />
        )}

        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
            <TabsTrigger value="manual" disabled={settings.allowManualEntry === false}>
              Manual Entry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scanner" className="mt-4">
            <QRScanner
              onScan={handleScan}
              isScanning={isScanning}
              onToggleScanning={toggleScanning}
            />
          </TabsContent>
          
          <TabsContent value="manual" className="mt-4">
            <ManualInput
              onSubmit={handleCheckIn}
              isProcessing={isProcessing}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}