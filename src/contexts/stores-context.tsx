'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDatabaseInstance, Store } from '@/lib/indexeddb';
import { ALL_STORES_ID } from '@/lib/stores';

interface StoresContextType {
  stores: Store[];
  isLoading: boolean;
  error: string | null;
  addStore: (store: Omit<Store, 'id'>) => Promise<void>;
  updateStore: (id: number, updates: Partial<Store>) => Promise<void>;
  deleteStore: (id: number) => Promise<void>;
  reorderStores: (storeIds: number[]) => Promise<void>;
  refreshStores: () => Promise<void>;
  getStoreSelectOptions: () => Array<{ label: string; value: string }>;
}

const StoresContext = createContext<StoresContextType | undefined>(undefined);

export function StoresProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const db = getDatabaseInstance();
      await db.init();
      await db.initializeDefaultStores();
      const loadedStores = await db.getStores();
      // Filter only active stores
      const activeStores = loadedStores.filter(s => s.isActive !== false);
      setStores(activeStores);
    } catch (err) {
      console.error('Failed to load stores:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const addStore = async (store: Omit<Store, 'id'>) => {
    try {
      const db = getDatabaseInstance();
      await db.addStore(store);
      await loadStores();
    } catch (err) {
      console.error('Failed to add store:', err);
      throw err;
    }
  };

  const updateStore = async (id: number, updates: Partial<Store>) => {
    try {
      const db = getDatabaseInstance();
      await db.updateStore(id, updates);
      await loadStores();
    } catch (err) {
      console.error('Failed to update store:', err);
      throw err;
    }
  };

  const deleteStore = async (id: number) => {
    try {
      const db = getDatabaseInstance();
      await db.deleteStore(id);
      await loadStores();
    } catch (err) {
      console.error('Failed to delete store:', err);
      throw err;
    }
  };

  const reorderStores = async (storeIds: number[]) => {
    try {
      const db = getDatabaseInstance();
      await db.reorderStores(storeIds);
      await loadStores();
    } catch (err) {
      console.error('Failed to reorder stores:', err);
      throw err;
    }
  };

  const getStoreSelectOptions = useCallback(() => {
    const options = stores.map(store => ({
      label: store.label,
      value: store.storeId
    }));
    
    // Add "All Stores" option if there are multiple stores
    if (stores.length > 1) {
      options.unshift({
        label: "All Stores",
        value: ALL_STORES_ID
      });
    }
    
    return options;
  }, [stores]);

  const value: StoresContextType = {
    stores,
    isLoading,
    error,
    addStore,
    updateStore,
    deleteStore,
    reorderStores,
    refreshStores: loadStores,
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
  if (context === undefined) {
    throw new Error('useStores must be used within a StoresProvider');
  }
  return context;
}