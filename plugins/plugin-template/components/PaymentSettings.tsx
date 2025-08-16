/**
 * Settings Component for Payment Analytics Plugin
 * Demonstrates settings management with IndexedDB persistence
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Using native radio inputs instead of external dependencies
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import { usePluginSettings } from '../hooks/usePluginSettings';
import { DEFAULT_SETTINGS } from '../utils/constants';
import type { PluginSettings, TimePeriod } from '../types';

export default function PaymentSettings() {
  const { settings, updateSettings, resetSettings, isLoading } = usePluginSettings();
  const [localSettings, setLocalSettings] = useState<PluginSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof PluginSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await updateSettings(localSettings);
      setIsDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      await resetSettings();
      setLocalSettings(DEFAULT_SETTINGS);
      setIsDirty(false);
      setSaveStatus('idle');
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Payment Analytics Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how the payment analytics plugin behaves
        </p>
      </div>

      <div className="space-y-4">
        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>
              Customize how data is displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTimePeriod">Default Time Period</Label>
              <Select
                value={localSettings.defaultTimePeriod}
                onValueChange={(value) => handleChange('defaultTimePeriod', value as TimePeriod)}
              >
                <SelectTrigger id="defaultTimePeriod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayCurrency">Display Currency</Label>
              <Select
                value={localSettings.displayCurrency}
                onValueChange={(value) => handleChange('displayCurrency', value)}
              >
                <SelectTrigger id="displayCurrency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chart Type</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="line"
                    name="chartType"
                    value="line"
                    checked={localSettings.chartType === 'line'}
                    onChange={(e) => handleChange('chartType', e.target.value)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="line">Line Chart</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="bar"
                    name="chartType"
                    value="bar"
                    checked={localSettings.chartType === 'bar'}
                    onChange={(e) => handleChange('chartType', e.target.value)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="bar">Bar Chart</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="area"
                    name="chartType"
                    value="area"
                    checked={localSettings.chartType === 'area'}
                    onChange={(e) => handleChange('chartType', e.target.value)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="area">Area Chart</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Behavior Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Behavior Settings</CardTitle>
            <CardDescription>
              Configure plugin behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
              <Input
                id="refreshInterval"
                type="number"
                min="10"
                max="3600"
                value={localSettings.refreshInterval}
                onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                How often to refresh data (10-3600 seconds)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showNotifications">Show Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Display notifications for new payments
                </p>
              </div>
              <Switch
                id="showNotifications"
                checked={localSettings.showNotifications}
                onCheckedChange={(checked) => handleChange('showNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Settings</CardTitle>
            <CardDescription>
              Customize the appearance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="light"
                  name="theme"
                  value="light"
                  checked={localSettings.theme === 'light'}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="dark"
                  name="theme"
                  value="dark"
                  checked={localSettings.theme === 'dark'}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="dark">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="auto"
                  name="theme"
                  value="auto"
                  checked={localSettings.theme === 'auto'}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="auto">Auto (follow system)</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Status Alert */}
      {saveStatus === 'saved' && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to save settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleReset}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={!isDirty || saveStatus === 'saving'}
        >
          <Save className="mr-2 h-4 w-4" />
          {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}