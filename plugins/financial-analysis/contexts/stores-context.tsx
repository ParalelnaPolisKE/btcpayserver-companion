'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Store, StoresConfig, defaultStoresConfig, ALL_STORES_ID } from '../lib/stores';
import { getDatabaseInstance } from '@bps-companion/lib/indexeddb';

interface StoresContextType {
  stores: Store[];
  isLoading: boolean;
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string | null) => void;
  addStore: (store: Omit<Store, 'createdAt'>) => Promise<void>;
  updateStore: (storeId: string, updates: Partial<Store>) => Promise<void>;
  removeStore: (storeId: string) => Promise<void>;
  getStoreById: (storeId: string) => Store | undefined;
  getStoreSelectOptions: () => { value: string; label: string }[];
}

const StoresContext = createContext<StoresContextType | undefined>(undefined);

const STORES_CONFIG_KEY = 'financial_analysis_stores';

export function StoresProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StoresConfig>(defaultStoresConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Load stores from IndexedDB
  useEffect(() => {
    async function loadStores() {
      try {
        const db = await getDatabaseInstance();
        const savedConfig = await db.getSetting(STORES_CONFIG_KEY);
        if (savedConfig) {
          setConfig(savedConfig as StoresConfig);
          setSelectedStoreId(savedConfig.defaultStoreId || ALL_STORES_ID);
        } else {
          setSelectedStoreId(ALL_STORES_ID);
        }
      } catch (error) {
        console.error('Failed to load stores:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStores();
  }, []);

  // Save stores to IndexedDB
  const saveConfig = useCallback(async (newConfig: StoresConfig) => {
    try {
      const db = await getDatabaseInstance();
      await db.setSetting(STORES_CONFIG_KEY, newConfig);
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save stores:', error);
      throw error;
    }
  }, []);

  const addStore = useCallback(async (store: Omit<Store, 'createdAt'>) => {
    const newStore: Store = {
      ...store,
      createdAt: new Date()
    };
    const newConfig = {
      ...config,
      stores: [...config.stores, newStore]
    };
    await saveConfig(newConfig);
  }, [config, saveConfig]);

  const updateStore = useCallback(async (storeId: string, updates: Partial<Store>) => {
    const newConfig = {
      ...config,
      stores: config.stores.map(store => 
        store.storeId === storeId 
          ? { ...store, ...updates }
          : store
      )
    };
    await saveConfig(newConfig);
  }, [config, saveConfig]);

  const removeStore = useCallback(async (storeId: string) => {
    const newConfig = {
      ...config,
      stores: config.stores.filter(store => store.storeId !== storeId),
      defaultStoreId: config.defaultStoreId === storeId ? undefined : config.defaultStoreId
    };
    await saveConfig(newConfig);
    
    // If the removed store was selected, switch to ALL_STORES
    if (selectedStoreId === storeId) {
      setSelectedStoreId(ALL_STORES_ID);
    }
  }, [config, saveConfig, selectedStoreId]);

  const getStoreById = useCallback((storeId: string) => {
    return config.stores.find(store => store.storeId === storeId);
  }, [config.stores]);

  const getStoreSelectOptions = useCallback(() => {
    const options = [
      { value: ALL_STORES_ID, label: 'All Stores' },
      ...config.stores
        .filter(store => store.isActive)
        .map(store => ({
          value: store.storeId,
          label: store.storeName
        }))
    ];
    return options;
  }, [config.stores]);

  const value: StoresContextType = {
    stores: config.stores,
    isLoading,
    selectedStoreId,
    setSelectedStoreId,
    addStore,
    updateStore,
    removeStore,
    getStoreById,
    getStoreSelectOptions
  };

  return (
    <StoresContext.Provider value={value}>
      {children}
    </StoresContext.Provider>
  );
}

export function useStores() {
  const context = useContext(StoresContext);
  if (!context) {
    throw new Error('useStores must be used within a StoresProvider');
  }
  return context;
}