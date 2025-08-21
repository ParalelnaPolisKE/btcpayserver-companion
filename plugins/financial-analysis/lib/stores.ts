export interface POSFilter {
  id: string;
  name: string;
  filter: string; // The actual filter value (e.g., "membership", "donation")
  description?: string;
}

export interface Store {
  storeId: string;
  storeName: string;
  posFilters: POSFilter[]; // Multiple POS filters
  isActive: boolean;
  createdAt: Date;
}

export const ALL_STORES_ID = "all-stores";

export interface StoresConfig {
  stores: Store[];
  defaultStoreId?: string;
}

// Default store configuration
export const defaultStoresConfig: StoresConfig = {
  stores: [],
  defaultStoreId: undefined,
};
