// Client-side plugin management for static export
// This is a mock implementation for static export - in production with Tauri,
// these operations would use Tauri's filesystem API

import { AvailablePlugin } from '@/app/actions/plugins';

// Mock storage for client-side plugin management
const STORAGE_KEY = 'bps-companion-plugins';

export async function getAvailablePluginsClient(): Promise<AvailablePlugin[]> {
  // In a Tauri app, this would use Tauri's filesystem API
  // For now, return the default plugins that are bundled with the app
  return [
    {
      id: 'event-checkin',
      name: 'Event Check-in',
      version: '1.0.0',
      description: 'Check-in system for events with QR code scanning',
      author: 'BTCPayServer Companion',
      icon: 'qr-code',
      route: '/apps/event-checkin',
      settingsRoute: '/apps/event-checkin/settings',
      routes: {
        main: '/apps/event-checkin',
        settings: '/apps/event-checkin/settings'
      },
      isPaid: false,
      category: 'Events',
      tags: ['events', 'qr-code', 'check-in']
    },
    {
      id: 'financial-analysis',
      name: 'Financial Analysis',
      version: '1.0.0',
      description: 'Analyze your BTCPay Server transactions and generate financial reports',
      author: 'BTCPayServer Companion',
      icon: 'trending-up',
      route: '/apps/financial-analysis',
      settingsRoute: '/apps/financial-analysis/settings',
      routes: {
        main: '/apps/financial-analysis',
        settings: '/apps/financial-analysis/settings'
      },
      isPaid: false,
      category: 'Analytics',
      tags: ['analytics', 'finance', 'reports']
    }
  ];
}

export async function removePluginFolderClient(pluginId: string): Promise<{ success: boolean; message: string }> {
  // In a Tauri app, this would use Tauri's filesystem API
  // For now, this is a no-op for bundled plugins
  return {
    success: false,
    message: 'Cannot remove bundled plugins in static export mode'
  };
}

export async function getPluginManifestClient(pluginId: string): Promise<AvailablePlugin | null> {
  const plugins = await getAvailablePluginsClient();
  return plugins.find(p => p.id === pluginId) || null;
}