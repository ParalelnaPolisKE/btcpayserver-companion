'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { InfoIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BTCPayClient } from '@/services/btcpay-client';
import { clientEnv } from '@/lib/env';
import { toast } from 'sonner';

export default function SettingsClient() {
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  
  useEffect(() => {
    // Load API key from localStorage on mount
    const storedKey = localStorage.getItem('btcpay_api_key') || '';
    setApiKey(storedKey);
  }, []);
  
  const handleSaveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('btcpay_api_key', apiKey);
    } else {
      localStorage.removeItem('btcpay_api_key');
    }
    setTestStatus('idle');
    toast.success('API key saved successfully!');
  };
  
  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('');
    
    try {
      const client = new BTCPayClient({
        serverUrl: clientEnv.btcpayUrl,
        apiKey: apiKey,
        storeId: clientEnv.storeId
      });
      
      const result = await client.verifyConnection();
      
      if (result) {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage('Connection failed');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-6">
        {/* BTCPay Server Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>BTCPay Server Configuration</CardTitle>
            <CardDescription>
              Configure your BTCPay Server connection for all apps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your BTCPay Server API key"
              />
              <p className="text-sm text-muted-foreground">
                Get your API key from BTCPay Server → Account → API Keys
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Server URL</Label>
              <Input 
                value={clientEnv.btcpayUrl} 
                disabled 
                placeholder="https://btcpay.example.com"
              />
              <p className="text-sm text-muted-foreground">
                Configure the server URL in your environment variables
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSaveApiKey} disabled={!apiKey}>
                Save API Key
              </Button>
              <Button 
                onClick={handleTest} 
                variant="outline" 
                disabled={!apiKey || testStatus === 'testing'}
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
            
            {testMessage && (
              <Alert className={testStatus === 'success' ? 'border-green-500' : testStatus === 'error' ? 'border-red-500' : ''}>
                {testStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {testStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                {testStatus === 'idle' && <InfoIcon className="h-4 w-4" />}
                <AlertDescription>{testMessage}</AlertDescription>
              </Alert>
            )}
            
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                This API key will be used by all installed apps. Each app will display the specific permissions it requires.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure general application preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select defaultValue="system">
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color theme
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for important events
                </p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-refresh">Auto Refresh</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically refresh data every 5 minutes
                </p>
              </div>
              <Switch id="auto-refresh" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>
              BTCPayServer Companion application information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-sm text-muted-foreground">1.0.0</p>
              </div>
              <div>
                <p className="text-sm font-medium">Build</p>
                <p className="text-sm text-muted-foreground">Production</p>
              </div>
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  BTCPayServer Companion is an open-source application for managing your BTCPay Server data.
                  Visit the Apps section to explore and install additional features.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}