'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { BTCPayClient } from '@/services/btcpay-client';
import { clientEnv } from '@/lib/env';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  
  useEffect(() => {
    // Load API key from localStorage on mount
    const storedKey = localStorage.getItem('btcpay_api_key') || '';
    setApiKey(storedKey);
  }, []);
  
  const handleSave = () => {
    if (apiKey) {
      localStorage.setItem('btcpay_api_key', apiKey);
    } else {
      localStorage.removeItem('btcpay_api_key');
    }
    setTestStatus('idle');
    setTestMessage('API key saved successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setTestMessage('');
    }, 3000);
  };
  
  const handleTest = async () => {
    if (!apiKey) {
      setTestStatus('error');
      setTestMessage('Please enter an API key first');
      return;
    }
    
    setTestStatus('testing');
    setTestMessage('Testing connection...');
    
    try {
      const client = new BTCPayClient({
        serverUrl: clientEnv.btcpayUrl,
        apiKey: apiKey,
        storeId: clientEnv.storeId,
      });
      
      // Try to get store info to test the connection
      const storeInfo = await client.getStoreInfo();
      
      if (storeInfo) {
        setTestStatus('success');
        setTestMessage(`Successfully connected to store: ${storeInfo.name}`);
      } else {
        setTestStatus('error');
        setTestMessage('Failed to retrieve store information');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  };
  
  const getStatusIcon = () => {
    switch (testStatus) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <InfoIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getStatusClass = () => {
    switch (testStatus) {
      case 'success':
        return 'border-green-500 text-green-700 dark:text-green-400';
      case 'error':
        return 'border-destructive text-destructive';
      default:
        return '';
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>BTCPay Server Configuration</CardTitle>
          <CardDescription>
            Configure your BTCPay Server connection settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serverUrl">Server URL</Label>
            <Input
              id="serverUrl"
              value={clientEnv.btcpayUrl}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              The server URL is configured via environment variables
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your BTCPay Server API key"
            />
            <p className="text-sm text-muted-foreground">
              Your API key is stored locally and never sent to any external servers
            </p>
          </div>
          
          {testMessage && (
            <Alert className={getStatusClass()}>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <AlertDescription>{testMessage}</AlertDescription>
              </div>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Save Settings
            </Button>
            <Button 
              onClick={handleTest} 
              variant="secondary"
              disabled={testStatus === 'testing'}
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            PPKE BTCPay Companion v0.1.0
          </p>
          <p className="text-sm text-muted-foreground">
            A companion app for BTCPay Server financial analysis and event check-ins
          </p>
        </CardContent>
      </Card>
    </div>
  );
}