'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDB, InstalledPlugin } from '@/lib/indexeddb';
import { PluginManifest, PluginConfig } from '@/types/plugin';

interface PluginsContextType {
  installedPlugins: InstalledPlugin[];
  isLoading: boolean;
  installPlugin: (manifest: PluginManifest) => Promise<void>;
  uninstallPlugin: (pluginId: string) => Promise<void>;
  togglePlugin: (pluginId: string, enabled: boolean) => Promise<void>;
  updatePluginSettings: (pluginId: string, settings: Record<string, any>) => Promise<void>;
  getPlugin: (pluginId: string) => InstalledPlugin | undefined;
  isPluginEnabled: (pluginId: string) => boolean;
  refreshPlugins: () => Promise<void>;
}

const PluginsContext = createContext<PluginsContextType | undefined>(undefined);

export function PluginsProvider({ children }: { children: ReactNode }) {
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlugins = async () => {
    try {
      const db = await getDB();
      const plugins = await db.getInstalledPlugins();
      setInstalledPlugins(plugins);
      
      // Auto-install Financial Analysis plugin if not installed
      const financialAnalysisInstalled = plugins.some(p => p.pluginId === 'financial-analysis');
      if (!financialAnalysisInstalled) {
        const financialAnalysisManifest: PluginManifest = {
          id: 'financial-analysis',
          name: 'Financial Analysis',
          version: '1.0.0',
          description: 'Comprehensive financial analytics dashboard',
          author: 'BTCPay Companion',
          routes: {
            main: '/apps/financial-analysis',
            settings: '/apps/financial-analysis/settings',
          },
          isPaid: false,
          requiredPermissions: [
            {
              permission: 'btcpay.store.canviewinvoices',
              description: 'View invoices to analyze revenue and transactions',
              required: true
            },
            {
              permission: 'btcpay.store.canviewstoresettings',
              description: 'Access store information and settings',
              required: true
            },
            {
              permission: 'btcpay.store.canmodifyinvoices',
              description: 'Update invoice metadata for tracking',
              required: false
            }
          ]
        };
        await db.installPlugin(financialAnalysisManifest, 'builtin');
        const updatedPlugins = await db.getInstalledPlugins();
        setInstalledPlugins(updatedPlugins);
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  const installPlugin = async (manifest: PluginManifest) => {
    try {
      const db = await getDB();
      await db.installPlugin(manifest);
      await loadPlugins();
    } catch (error) {
      console.error('Failed to install plugin:', error);
      throw error;
    }
  };

  const uninstallPlugin = async (pluginId: string) => {
    try {
      const db = await getDB();
      await db.uninstallPlugin(pluginId);
      await loadPlugins();
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
      throw error;
    }
  };

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const db = await getDB();
      const plugin = await db.getPlugin(pluginId);
      if (plugin) {
        await db.updatePluginConfig(pluginId, {
          ...plugin.config,
          enabled,
        });
        await loadPlugins();
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
      throw error;
    }
  };

  const updatePluginSettings = async (pluginId: string, settings: Record<string, any>) => {
    try {
      const db = await getDB();
      await db.updatePluginSettings(pluginId, settings);
      await loadPlugins();
    } catch (error) {
      console.error('Failed to update plugin settings:', error);
      throw error;
    }
  };

  const getPlugin = (pluginId: string): InstalledPlugin | undefined => {
    return installedPlugins.find(p => p.pluginId === pluginId);
  };

  const isPluginEnabled = (pluginId: string): boolean => {
    const plugin = getPlugin(pluginId);
    return plugin?.config.enabled || false;
  };

  return (
    <PluginsContext.Provider
      value={{
        installedPlugins,
        isLoading,
        installPlugin,
        uninstallPlugin,
        togglePlugin,
        updatePluginSettings,
        getPlugin,
        isPluginEnabled,
        refreshPlugins: loadPlugins,
      }}
    >
      {children}
    </PluginsContext.Provider>
  );
}

export function usePlugins() {
  const context = useContext(PluginsContext);
  if (context === undefined) {
    throw new Error('usePlugins must be used within a PluginsProvider');
  }
  return context;
}