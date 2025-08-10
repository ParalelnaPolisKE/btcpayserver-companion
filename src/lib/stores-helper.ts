import { STORES as DEFAULT_STORES } from './stores';
import { getDatabaseInstance, Store } from './indexeddb';

// Server-side or initial load: use default stores
// Client-side after initialization: use IndexedDB stores

export async function getActiveStores(): Promise<Store[]> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side: return default stores
    return DEFAULT_STORES.map((store, index) => ({
      ...store,
      id: index + 1,
      isActive: true,
      order: index
    }));
  }

  try {
    // Client-side: try to get stores from IndexedDB
    const db = getDatabaseInstance();
    await db.init();
    await db.initializeDefaultStores();
    const stores = await db.getStores();
    
    // Filter only active stores
    const activeStores = stores.filter(s => s.isActive !== false);
    
    // If no stores in IndexedDB, return defaults
    if (activeStores.length === 0) {
      return DEFAULT_STORES.map((store, index) => ({
        ...store,
        id: index + 1,
        isActive: true,
        order: index
      }));
    }
    
    return activeStores;
  } catch (error) {
    console.error('Failed to get stores from IndexedDB, using defaults:', error);
    // Fallback to default stores
    return DEFAULT_STORES.map((store, index) => ({
      ...store,
      id: index + 1,
      isActive: true,
      order: index
    }));
  }
}

export async function getStoreById(storeId: string): Promise<Store | null> {
  const stores = await getActiveStores();
  return stores.find(s => s.storeId === storeId) || null;
}