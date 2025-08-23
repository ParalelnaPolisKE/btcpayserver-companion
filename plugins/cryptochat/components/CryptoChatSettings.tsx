'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import { getCryptoChatSettings, saveCryptoChatSettings, DEFAULT_SETTINGS } from '../utils/store';
import type { CryptoChatSettings } from '../utils/store';

export default function CryptoChatSettings() {
  const [settings, setSettings] = useState<CryptoChatSettings>(DEFAULT_SETTINGS);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(getCryptoChatSettings());
  }, []);

  if (!mounted) {
    return null; // Prevent SSR issues
  }

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      saveCryptoChatSettings(settings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (settings.provider === 'openai') {
      if (!settings.openaiApiKey) {
        setSaveMessage('Please enter an API key first');
        return;
      }

      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${settings.openaiApiKey}`,
          },
        });

        if (response.ok) {
          setSaveMessage('✅ API key is valid!');
        } else {
          setSaveMessage('❌ Invalid API key');
        }
      } catch (error) {
        setSaveMessage('❌ Failed to test API key');
      }
    } else {
      // Test Ollama connection
      try {
        const response = await fetch(`${settings.ollamaUrl || 'http://localhost:11434'}/api/tags`);
        
        if (response.ok) {
          const data = await response.json();
          const models = data.models || [];
          const modelNames = models.map((m: any) => m.name).join(', ');
          setSaveMessage(`✅ Connected! Available models: ${modelNames || 'none'}`);
        } else {
          setSaveMessage('❌ Failed to connect to Ollama');
        }
      } catch (error) {
        setSaveMessage('❌ Cannot reach Ollama server. Make sure it\'s running.');
      }
    }
    
    setTimeout(() => setSaveMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Configuration</CardTitle>
          <CardDescription>
            Choose your AI provider and configure settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select
              value={settings.provider || 'openai'}
              onValueChange={(value) => setSettings({ ...settings, provider: value as any })}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (Cloud)</SelectItem>
                <SelectItem value="ollama">Ollama (Local)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.provider === 'openai' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="api-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={settings.openaiApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button variant="outline" onClick={testConnection}>
                    Test
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-model">Model</Label>
                <Select
                  value={settings.openaiModel || 'gpt-3.5-turbo'}
                  onValueChange={(value) => setSettings({ ...settings, openaiModel: value })}
                >
                  <SelectTrigger id="openai-model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Cheap)</SelectItem>
                    <SelectItem value="gpt-4">GPT-4 (Powerful)</SelectItem>
                    <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo (Latest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="ollama-url">Ollama Server URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="ollama-url"
                    type="url"
                    placeholder="http://localhost:11434"
                    value={settings.ollamaUrl || 'http://localhost:11434'}
                    onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={testConnection}>
                    Test
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  URL of your local Ollama server
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ollama-model">Model</Label>
                <Input
                  id="ollama-model"
                  type="text"
                  placeholder="llama2, mistral, codellama, etc."
                  value={settings.ollamaModel || 'llama2'}
                  onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Run `ollama list` to see available models
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure Ollama is running locally. Install from{' '}
                  <a
                    href="https://ollama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    ollama.ai
                  </a>
                  {' '}and run `ollama serve` to start the server.
                </AlertDescription>
              </Alert>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="temperature">
              Temperature: {settings.temperature || 0.7}
            </Label>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[settings.temperature || 0.7]}
              onValueChange={([value]) => setSettings({ ...settings, temperature: value })}
            />
            <p className="text-sm text-muted-foreground">
              Lower values make responses more focused and deterministic
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              min={100}
              max={4000}
              value={settings.maxTokens || 1000}
              onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">
              Maximum length of the response
            </p>
          </div>
        </CardContent>
      </Card>

      {!settings.openaiApiKey && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            CryptoChat requires an OpenAI API key to function. The plugin will use mock responses until configured.
          </AlertDescription>
        </Alert>
      )}

      {saveMessage && (
        <Alert className={saveMessage.includes('✅') ? 'border-green-500' : saveMessage.includes('❌') ? 'border-red-500' : ''}>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}