'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Settings, Save, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { checkInDB } from './lib/indexeddb';
import Link from 'next/link';

interface EventCheckInSettings {
  eventId?: string;
  eventName?: string;
  btcpayUrl?: string;
  storeId?: string;
  apiKey?: string;
  allowManualEntry?: boolean;
  requireConfirmation?: boolean;
  soundEnabled?: boolean;
}

export default function EventCheckInSettings() {
  const [settings, setSettings] = useState<EventCheckInSettings>({
    allowManualEntry: true,
    requireConfirmation: false,
    soundEnabled: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('event-checkin-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    // Try to get BTCPay settings from parent app
    const btcpayUrl = localStorage.getItem('btcpayUrl');
    const storeId = localStorage.getItem('storeId');
    
    if (btcpayUrl && storeId) {
      setSettings(prev => ({
        ...prev,
        btcpayUrl,
        storeId
      }));
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('event-checkin-settings', JSON.stringify(settings));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    try {
      await checkInDB.clearAllCheckIns();
      toast.success('All check-in data cleared');
      setClearDialogOpen(false);
    } catch (error) {
      toast.error('Failed to clear data');
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/apps/event-checkin">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event Check-In
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Event Check-In Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your event check-in system settings
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Configuration</CardTitle>
            <CardDescription>
              Set up your event details for tracking check-ins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventId">Event ID</Label>
              <Input
                id="eventId"
                value={settings.eventId || ''}
                onChange={(e) => setSettings({ ...settings, eventId: e.target.value })}
                placeholder="e.g., EVT-0001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={settings.eventName || ''}
                onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
                placeholder="e.g., Bitcoin Conference 2024"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>BTCPay Server Configuration</CardTitle>
            <CardDescription>
              Connection settings for BTCPay Server API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="btcpayUrl">BTCPay Server URL</Label>
              <Input
                id="btcpayUrl"
                value={settings.btcpayUrl || ''}
                onChange={(e) => setSettings({ ...settings, btcpayUrl: e.target.value })}
                placeholder="https://your-btcpay.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeId">Store ID</Label>
              <Input
                id="storeId"
                value={settings.storeId || ''}
                onChange={(e) => setSettings({ ...settings, storeId: e.target.value })}
                placeholder="Your store ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input
                id="apiKey"
                type="password"
                value={settings.apiKey || ''}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Your BTCPay API key"
              />
              <p className="text-xs text-muted-foreground">
                If provided, check-ins will be synced to BTCPay Server
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check-In Options</CardTitle>
            <CardDescription>
              Configure check-in behavior and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowManualEntry">Allow Manual Entry</Label>
                <p className="text-sm text-muted-foreground">
                  Enable manual ticket ID entry alongside QR scanning
                </p>
              </div>
              <Switch
                id="allowManualEntry"
                checked={settings.allowManualEntry}
                onCheckedChange={(checked) => setSettings({ ...settings, allowManualEntry: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireConfirmation">Require Confirmation</Label>
                <p className="text-sm text-muted-foreground">
                  Show confirmation dialog before check-in
                </p>
              </div>
              <Switch
                id="requireConfirmation"
                checked={settings.requireConfirmation}
                onCheckedChange={(checked) => setSettings({ ...settings, requireConfirmation: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="soundEnabled">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound on successful check-in
                </p>
              </div>
              <Switch
                id="soundEnabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage stored check-in data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setClearDialogOpen(true)}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Check-In Data
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Check-In Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all locally stored check-in records. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}