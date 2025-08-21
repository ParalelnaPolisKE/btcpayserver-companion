/**
 * Custom hook for managing plugin settings
 * Uses localStorage for persistent storage without external dependencies
 */

import { useCallback, useEffect, useState } from "react";
import type { PluginSettings } from "../types";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../utils/constants";

/**
 * Storage utility functions
 */
const Storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(`Failed to load ${key} from storage:`, error);
    }
    return defaultValue;
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key} to storage:`, error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from storage:`, error);
    }
  },
};

export function usePluginSettings() {
  const [settings, setSettings] = useState<PluginSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load settings from localStorage
  const loadSettings = useCallback(() => {
    try {
      setIsLoading(true);
      const storedSettings = Storage.get<PluginSettings>(
        STORAGE_KEYS.SETTINGS,
        DEFAULT_SETTINGS,
      );
      setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback(
    async (newSettings: Partial<PluginSettings>) => {
      try {
        const updatedSettings = { ...settings, ...newSettings };
        Storage.set(STORAGE_KEYS.SETTINGS, updatedSettings);
        setSettings(updatedSettings);

        // Emit custom event for other components to react
        window.dispatchEvent(
          new CustomEvent("plugin-settings-updated", {
            detail: updatedSettings,
          }),
        );

        return updatedSettings;
      } catch (err) {
        console.error("Failed to save settings:", err);
        setError(err as Error);
        throw err;
      }
    },
    [settings],
  );

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      Storage.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      setSettings(DEFAULT_SETTINGS);

      // Clear cache as well
      Storage.remove(STORAGE_KEYS.CACHE);

      window.dispatchEvent(new CustomEvent("plugin-settings-reset"));

      return DEFAULT_SETTINGS;
    } catch (err) {
      console.error("Failed to reset settings:", err);
      setError(err as Error);
      throw err;
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Listen for settings updates from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SETTINGS && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setSettings(newSettings);
        } catch (err) {
          console.error("Failed to parse settings from storage event:", err);
        }
      }
    };

    // Listen for custom events from the same tab
    const handleSettingsUpdate = (e: CustomEvent) => {
      setSettings(e.detail);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "plugin-settings-updated" as any,
      handleSettingsUpdate,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "plugin-settings-updated" as any,
        handleSettingsUpdate,
      );
    };
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
    error,
  };
}

/**
 * Hook for managing cached data
 */
export function useCache<T>(key: string, ttl: number = 5 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCacheKey = useCallback(
    (key: string) => `${STORAGE_KEYS.CACHE}_${key}`,
    [],
  );

  const getCache = useCallback((): T | null => {
    try {
      const cacheKey = getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          return data as T;
        }
        // Cache expired, remove it
        localStorage.removeItem(cacheKey);
      }
    } catch (err) {
      console.error("Failed to get cache:", err);
    }
    return null;
  }, [key, ttl, getCacheKey]);

  const setCache = useCallback(
    (value: T) => {
      try {
        const cacheKey = getCacheKey(key);
        const cacheData = {
          data: value,
          timestamp: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        setData(value);
      } catch (err) {
        console.error("Failed to set cache:", err);
      }
    },
    [key, getCacheKey],
  );

  const clearCache = useCallback(() => {
    try {
      const cacheKey = getCacheKey(key);
      localStorage.removeItem(cacheKey);
      setData(null);
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  }, [key, getCacheKey]);

  // Load cached data on mount
  useEffect(() => {
    setIsLoading(true);
    const cached = getCache();
    if (cached) {
      setData(cached);
    }
    setIsLoading(false);
  }, [getCache]);

  return {
    data,
    setCache,
    clearCache,
    isLoading,
  };
}

/**
 * Hook for managing plugin-wide state
 */
export function usePluginState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    // Initialize from session storage
    try {
      const stored = sessionStorage.getItem(`plugin-state-${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error("Failed to parse stored state:", err);
    }
    return defaultValue;
  });

  const updateState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      setState((prev) => {
        const updated =
          typeof newState === "function"
            ? (newState as (prev: T) => T)(prev)
            : newState;

        // Save to session storage
        try {
          sessionStorage.setItem(
            `plugin-state-${key}`,
            JSON.stringify(updated),
          );
        } catch (err) {
          console.error("Failed to save state:", err);
        }

        return updated;
      });
    },
    [key],
  );

  return [state, updateState] as const;
}
