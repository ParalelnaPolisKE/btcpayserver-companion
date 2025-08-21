"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { removePluginCompletely } from "@/app/actions/plugin-management";
import { getDatabaseInstance, type InstalledPlugin } from "@/lib/indexeddb";
import type { PluginManifest } from "@/types/plugin";

interface PluginsContextType {
  installedPlugins: InstalledPlugin[];
  isLoading: boolean;
  installPlugin: (manifest: PluginManifest) => Promise<void>;
  uninstallPlugin: (pluginId: string) => Promise<void>;
  togglePlugin: (pluginId: string, enabled: boolean) => Promise<void>;
  updatePluginSettings: (
    pluginId: string,
    settings: Record<string, any>,
  ) => Promise<void>;
  getPlugin: (pluginId: string) => InstalledPlugin | undefined;
  isPluginEnabled: (pluginId: string) => boolean;
  refreshPlugins: () => Promise<void>;
}

const PluginsContext = createContext<PluginsContextType | undefined>(undefined);

export function PluginsProvider({ children }: { children: ReactNode }) {
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadPlugins = async () => {
    try {
      const db = await getDatabaseInstance();
      const plugins = await db.getInstalledPlugins();
      setInstalledPlugins(plugins);

      // Auto-install built-in plugins if not installed
      const builtinPlugins = [
        {
          id: "financial-analysis",
          name: "Financial Analysis",
          version: "1.0.0",
          description: "Comprehensive financial analytics dashboard",
          author: "BTCPayServer Companion",
          routes: {
            main: "/apps/financial-analysis",
            settings: "/apps/financial-analysis/settings",
          },
          isPaid: false,
          requiredPermissions: [
            {
              permission: "btcpay.store.canviewinvoices",
              description: "View invoices to analyze revenue and transactions",
              required: true,
            },
            {
              permission: "btcpay.store.canviewstoresettings",
              description: "Access store information and settings",
              required: true,
            },
            {
              permission: "btcpay.store.canmodifyinvoices",
              description: "Update invoice metadata for tracking",
              required: false,
            },
          ],
        },
        {
          id: "event-checkin",
          name: "Event Check-in",
          version: "1.0.0",
          description: "QR code-based event check-in system",
          author: "BTCPayServer Companion",
          routes: {
            main: "/apps/event-checkin",
          },
          isPaid: false,
          requiredPermissions: [
            {
              permission: "btcpay.store.canviewinvoices",
              description: "View invoices to verify event tickets",
              required: true,
            },
            {
              permission: "btcpay.store.canmodifyinvoices",
              description: "Update invoice metadata for check-in status",
              required: true,
            },
          ],
        },
      ];

      let pluginsUpdated = false;
      for (const builtinPlugin of builtinPlugins) {
        const isInstalled = plugins.some(
          (p) => p.pluginId === builtinPlugin.id,
        );
        if (!isInstalled) {
          await db.installPlugin(builtinPlugin as PluginManifest, "builtin");
          pluginsUpdated = true;
        }
      }

      if (pluginsUpdated) {
        const updatedPlugins = await db.getInstalledPlugins();
        setInstalledPlugins(updatedPlugins);
      }
    } catch (error) {
      console.error("Failed to load plugins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  const installPlugin = async (manifest: PluginManifest) => {
    try {
      const db = await getDatabaseInstance();
      await db.installPlugin(manifest);
      await loadPlugins();
    } catch (error) {
      console.error("Failed to install plugin:", error);
      throw error;
    }
  };

  const uninstallPlugin = async (pluginId: string) => {
    try {
      const db = await getDatabaseInstance();
      const plugin = await db.getPlugin(pluginId);

      if (!plugin) {
        throw new Error("Plugin not found");
      }

      // For uploaded plugins, remove files from filesystem
      if (plugin.source === "uploaded") {
        const result = await removePluginCompletely(pluginId);
        if (!result.success) {
          throw new Error(result.error || "Failed to remove plugin files");
        }
      }

      // Remove from database (will throw error for built-in plugins)
      await db.uninstallPlugin(pluginId);
      await loadPlugins();
    } catch (error) {
      console.error("Failed to uninstall plugin:", error);
      throw error;
    }
  };

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      const db = await getDatabaseInstance();
      const plugin = await db.getPlugin(pluginId);
      if (plugin) {
        await db.updatePluginConfig(pluginId, {
          ...plugin.config,
          enabled,
        });
        await loadPlugins();
      }
    } catch (error) {
      console.error("Failed to toggle plugin:", error);
      throw error;
    }
  };

  const updatePluginSettings = async (
    pluginId: string,
    settings: Record<string, any>,
  ) => {
    try {
      const db = await getDatabaseInstance();
      await db.updatePluginSettings(pluginId, settings);
      await loadPlugins();
    } catch (error) {
      console.error("Failed to update plugin settings:", error);
      throw error;
    }
  };

  const getPlugin = (pluginId: string): InstalledPlugin | undefined => {
    return installedPlugins.find((p) => p.pluginId === pluginId);
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
    throw new Error("usePlugins must be used within a PluginsProvider");
  }
  return context;
}
