import type { PluginConfig, PluginManifest } from "@/types/plugin";

export interface Store {
  id?: number;
  label: string;
  storeId: string;
  posFilter?: string;
  isActive?: boolean;
  order?: number;
}

export interface Settings {
  id?: number;
  key: string;
  value: any;
}

export interface InstalledPlugin {
  id?: number;
  pluginId: string;
  manifest: PluginManifest;
  config: PluginConfig;
  source: "builtin" | "uploaded" | "marketplace";
  installedPath?: string;
}

export interface ExpenseCategory {
  id?: number;
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface ExpenseItem {
  id?: number;
  categoryId: number;
  name: string;
  amount: number;
  currency?: string;
  isRecurring?: boolean;
  frequency?: "monthly" | "quarterly" | "yearly";
  applyVat?: boolean;
  vatRate?: number;
  notes?: string;
  isActive?: boolean;
}

class IndexedDBService {
  private dbName = "BTCPayCompanion";
  private version = 3; // Increment version for plugins support
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores object store
        if (!db.objectStoreNames.contains("stores")) {
          const storesStore = db.createObjectStore("stores", {
            keyPath: "id",
            autoIncrement: true,
          });
          storesStore.createIndex("storeId", "storeId", { unique: true });
          storesStore.createIndex("order", "order", { unique: false });
        }

        // Create settings object store
        if (!db.objectStoreNames.contains("settings")) {
          const settingsStore = db.createObjectStore("settings", {
            keyPath: "id",
            autoIncrement: true,
          });
          settingsStore.createIndex("key", "key", { unique: true });
        }

        // Create expense categories object store
        if (!db.objectStoreNames.contains("expenseCategories")) {
          const categoriesStore = db.createObjectStore("expenseCategories", {
            keyPath: "id",
            autoIncrement: true,
          });
          categoriesStore.createIndex("order", "order", { unique: false });
        }

        // Create expense items object store
        if (!db.objectStoreNames.contains("expenseItems")) {
          const itemsStore = db.createObjectStore("expenseItems", {
            keyPath: "id",
            autoIncrement: true,
          });
          itemsStore.createIndex("categoryId", "categoryId", { unique: false });
        }

        // Create plugins object store
        if (!db.objectStoreNames.contains("plugins")) {
          const pluginsStore = db.createObjectStore("plugins", {
            keyPath: "id",
            autoIncrement: true,
          });
          pluginsStore.createIndex("pluginId", "pluginId", { unique: true });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  // Stores methods
  async getStores(): Promise<Store[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["stores"], "readonly");
      const store = transaction.objectStore("stores");
      const request = store.getAll();

      request.onsuccess = () => {
        const stores = request.result as Store[];
        // Sort by order or by id if order is not set
        stores.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (a.id || 0) - (b.id || 0);
        });
        resolve(stores);
      };

      request.onerror = () => {
        reject(new Error("Failed to get stores"));
      };
    });
  }

  async addStore(store: Omit<Store, "id">): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["stores"], "readwrite");
      const objectStore = transaction.objectStore("stores");

      // Set order to be the last if not provided
      if (store.order === undefined) {
        objectStore.getAll().onsuccess = (event) => {
          const stores = (event.target as IDBRequest).result as Store[];
          const maxOrder = stores.reduce(
            (max, s) => Math.max(max, s.order || 0),
            0,
          );

          const storeWithOrder = {
            ...store,
            order: maxOrder + 1,
            isActive: true,
          };
          const addRequest = objectStore.add(storeWithOrder);

          addRequest.onsuccess = () => {
            resolve(addRequest.result as number);
          };

          addRequest.onerror = () => {
            reject(new Error("Failed to add store"));
          };
        };
      } else {
        const addRequest = objectStore.add({ ...store, isActive: true });

        addRequest.onsuccess = () => {
          resolve(addRequest.result as number);
        };

        addRequest.onerror = () => {
          reject(new Error("Failed to add store"));
        };
      }
    });
  }

  async updateStore(id: number, updates: Partial<Store>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["stores"], "readwrite");
      const store = transaction.objectStore("stores");

      // First get the existing store
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingStore = getRequest.result;
        if (!existingStore) {
          reject(new Error("Store not found"));
          return;
        }

        const updatedStore = { ...existingStore, ...updates, id };
        const putRequest = store.put(updatedStore);

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          reject(new Error("Failed to update store"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to get store"));
      };
    });
  }

  async deleteStore(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["stores"], "readwrite");
      const store = transaction.objectStore("stores");
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete store"));
      };
    });
  }

  async reorderStores(storeIds: number[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(["stores"], "readwrite");
    const store = transaction.objectStore("stores");

    // Update order for each store
    const promises = storeIds.map((id, index) => {
      return new Promise<void>((resolve, reject) => {
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const storeData = getRequest.result;
          if (storeData) {
            storeData.order = index;
            const putRequest = store.put(storeData);

            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () =>
              reject(new Error("Failed to update order"));
          } else {
            resolve();
          }
        };

        getRequest.onerror = () => reject(new Error("Failed to get store"));
      });
    });

    await Promise.all(promises);
  }

  // Settings methods
  async getSetting(key: string): Promise<any> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readonly");
      const store = transaction.objectStore("settings");
      const index = store.index("key");
      const request = index.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value);
      };

      request.onerror = () => {
        reject(new Error("Failed to get setting"));
      };
    });
  }

  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readwrite");
      const store = transaction.objectStore("settings");
      const index = store.index("key");

      // Check if setting exists
      const getRequest = index.get(key);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        let request: IDBRequest;

        if (existing) {
          // Update existing
          request = store.put({ ...existing, value });
        } else {
          // Add new
          request = store.add({ key, value });
        }

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error("Failed to set setting"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to check existing setting"));
      };
    });
  }

  // Expense Categories methods
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenseCategories"], "readonly");
      const store = transaction.objectStore("expenseCategories");
      const request = store.getAll();

      request.onsuccess = () => {
        const categories = request.result as ExpenseCategory[];
        categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        resolve(categories);
      };

      request.onerror = () => {
        reject(new Error("Failed to get expense categories"));
      };
    });
  }

  async addExpenseCategory(
    category: Omit<ExpenseCategory, "id">,
  ): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenseCategories"], "readwrite");
      const store = transaction.objectStore("expenseCategories");

      if (category.order === undefined) {
        store.getAll().onsuccess = (event) => {
          const categories = (event.target as IDBRequest)
            .result as ExpenseCategory[];
          const maxOrder = categories.reduce(
            (max, c) => Math.max(max, c.order || 0),
            0,
          );

          const categoryWithOrder = {
            ...category,
            order: maxOrder + 1,
            isActive: true,
          };
          const addRequest = store.add(categoryWithOrder);

          addRequest.onsuccess = () => {
            resolve(addRequest.result as number);
          };

          addRequest.onerror = () => {
            reject(new Error("Failed to add expense category"));
          };
        };
      } else {
        const addRequest = store.add({ ...category, isActive: true });

        addRequest.onsuccess = () => {
          resolve(addRequest.result as number);
        };

        addRequest.onerror = () => {
          reject(new Error("Failed to add expense category"));
        };
      }
    });
  }

  async updateExpenseCategory(
    id: number,
    updates: Partial<ExpenseCategory>,
  ): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenseCategories"], "readwrite");
      const store = transaction.objectStore("expenseCategories");

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error("Category not found"));
          return;
        }

        const updated = { ...existing, ...updates, id };
        const putRequest = store.put(updated);

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          reject(new Error("Failed to update expense category"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to get expense category"));
      };
    });
  }

  async deleteExpenseCategory(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        ["expenseCategories", "expenseItems"],
        "readwrite",
      );
      const categoryStore = transaction.objectStore("expenseCategories");
      const itemsStore = transaction.objectStore("expenseItems");

      // Delete all items in this category first
      const itemsIndex = itemsStore.index("categoryId");
      const itemsRequest = itemsIndex.getAll(id);

      itemsRequest.onsuccess = () => {
        const items = itemsRequest.result;
        items.forEach((item) => {
          itemsStore.delete(item.id);
        });

        // Then delete the category
        const deleteRequest = categoryStore.delete(id);

        deleteRequest.onsuccess = () => {
          resolve();
        };

        deleteRequest.onerror = () => {
          reject(new Error("Failed to delete expense category"));
        };
      };

      itemsRequest.onerror = () => {
        reject(new Error("Failed to get expense items"));
      };
    });
  }

  // Expense Items methods
  async getExpenseItems(categoryId?: number): Promise<ExpenseItem[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenseItems"], "readonly");
      const store = transaction.objectStore("expenseItems");

      let request: IDBRequest;
      if (categoryId !== undefined) {
        const index = store.index("categoryId");
        request = index.getAll(categoryId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const items = request.result as ExpenseItem[];
        resolve(items.filter((item) => item.isActive !== false));
      };

      request.onerror = () => {
        reject(new Error("Failed to get expense items"));
      };
    });
  }

  async addExpenseItem(item: Omit<ExpenseItem, "id">): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenseItems"], "readwrite");
      const store = transaction.objectStore("expenseItems");

      const itemWithDefaults = {
        ...item,
        isActive: true,
        currency: item.currency || "EUR",
        isRecurring: item.isRecurring !== false,
        frequency: item.frequency || "monthly",
      };

      const request = store.add(itemWithDefaults);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(new Error("Failed to add expense item"));
      };
    });
  }

  async updateExpenseItem(
    id: number,
    updates: Partial<ExpenseItem>,
  ): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenseItems"], "readwrite");
      const store = transaction.objectStore("expenseItems");

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error("Expense item not found"));
          return;
        }

        const updated = { ...existing, ...updates, id };
        const putRequest = store.put(updated);

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          reject(new Error("Failed to update expense item"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to get expense item"));
      };
    });
  }

  async deleteExpenseItem(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenseItems"], "readwrite");
      const store = transaction.objectStore("expenseItems");
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete expense item"));
      };
    });
  }

  // Initialize with default stores if empty
  async initializeDefaultStores(): Promise<void> {
    // Stores are now managed by plugins that need them
    // No default stores are initialized globally
  }

  // Plugin methods
  async getInstalledPlugins(): Promise<InstalledPlugin[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["plugins"], "readonly");
      const store = transaction.objectStore("plugins");
      const request = store.getAll();

      request.onsuccess = () => {
        const plugins = request.result as InstalledPlugin[];
        // Filter out invalid plugins and remove duplicates
        const validPlugins = plugins.filter(p => p.pluginId && p.manifest);
        const uniquePlugins = validPlugins.filter((plugin, index, self) => 
          index === self.findIndex(p => p.pluginId === plugin.pluginId)
        );
        
        if (uniquePlugins.length !== plugins.length) {
          console.warn(`Filtered out ${plugins.length - uniquePlugins.length} invalid or duplicate plugins`);
        }
        
        resolve(uniquePlugins);
      };

      request.onerror = () => {
        reject(new Error("Failed to get installed plugins"));
      };
    });
  }

  async getPlugin(pluginId: string): Promise<InstalledPlugin | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["plugins"], "readonly");
      const store = transaction.objectStore("plugins");
      const index = store.index("pluginId");
      const request = index.get(pluginId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error("Failed to get plugin"));
      };
    });
  }

  async installPlugin(
    manifest: PluginManifest,
    source: "builtin" | "uploaded" | "marketplace" = "builtin",
  ): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["plugins"], "readwrite");
      const store = transaction.objectStore("plugins");

      const plugin: Omit<InstalledPlugin, "id"> = {
        pluginId: manifest.id,
        manifest,
        config: {
          enabled: true,
          installedAt: new Date(),
          settings: {},
        },
        source,
        installedPath:
          source === "builtin"
            ? `/plugins/${manifest.id}`
            : `/.plugins/${manifest.id}`,
      };

      const request = store.add(plugin);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(new Error("Failed to install plugin"));
      };
    });
  }

  async updatePluginConfig(
    pluginId: string,
    config: Partial<PluginConfig>,
  ): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["plugins"], "readwrite");
      const store = transaction.objectStore("plugins");
      const index = store.index("pluginId");

      const getRequest = index.get(pluginId);

      getRequest.onsuccess = () => {
        const plugin = getRequest.result;
        if (!plugin) {
          reject(new Error("Plugin not found"));
          return;
        }

        plugin.config = { ...plugin.config, ...config };
        plugin.config.lastUpdated = new Date();

        const putRequest = store.put(plugin);

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          reject(new Error("Failed to update plugin config"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to get plugin"));
      };
    });
  }

  async updatePluginSettings(
    pluginId: string,
    settings: Record<string, any>,
  ): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["plugins"], "readwrite");
      const store = transaction.objectStore("plugins");
      const index = store.index("pluginId");

      const getRequest = index.get(pluginId);

      getRequest.onsuccess = () => {
        const plugin = getRequest.result;
        if (!plugin) {
          reject(new Error("Plugin not found"));
          return;
        }

        plugin.config.settings = { ...plugin.config.settings, ...settings };
        plugin.config.lastUpdated = new Date();

        const putRequest = store.put(plugin);

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          reject(new Error("Failed to update plugin settings"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to get plugin"));
      };
    });
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["plugins"], "readwrite");
      const store = transaction.objectStore("plugins");
      const index = store.index("pluginId");

      const getRequest = index.get(pluginId);

      getRequest.onsuccess = () => {
        const plugin = getRequest.result as InstalledPlugin;
        if (!plugin) {
          reject(new Error("Plugin not found"));
          return;
        }

        // Prevent uninstalling built-in plugins
        if (plugin.source === "builtin") {
          reject(new Error("Cannot uninstall built-in plugins"));
          return;
        }

        const deleteRequest = store.delete(plugin.id!);

        deleteRequest.onsuccess = () => {
          resolve();
        };

        deleteRequest.onerror = () => {
          reject(new Error("Failed to uninstall plugin"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to get plugin"));
      };
    });
  }

  // Initialize with default expenses if empty
  async initializeDefaultExpenses(): Promise<void> {
    const categories = await this.getExpenseCategories();
    if (categories.length === 0) {
      // Add default category
      const operationalCategoryId = await this.addExpenseCategory({
        name: "Operational Expenses",
        description: "Monthly operational costs",
        order: 0,
        isActive: true,
      });

      // Add default expense items from the original hardcoded expenses
      const defaultExpenses = [
        { name: "Rent", amount: 700, applyVat: false },
        { name: "Electricity", amount: 232.12, applyVat: false },
        { name: "Gas", amount: 61.85, applyVat: false },
        { name: "ANTIK Internet", amount: 41.48, applyVat: false },
      ];

      for (const expense of defaultExpenses) {
        await this.addExpenseItem({
          categoryId: operationalCategoryId,
          name: expense.name,
          amount: expense.amount,
          currency: "EUR",
          isRecurring: true,
          frequency: "monthly",
          applyVat: expense.applyVat,
          vatRate: undefined, // User should configure VAT in settings
          isActive: true,
        });
      }

      // Don't set a default VAT rate - user should configure it in settings
    }
  }

  async cleanupInvalidPlugins(): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["plugins"], "readwrite");
      const store = transaction.objectStore("plugins");
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        const plugins = getAllRequest.result as InstalledPlugin[];
        const seen = new Set<string>();
        let removedCount = 0;
        
        plugins.forEach(plugin => {
          // Remove if missing pluginId, manifest, or is a duplicate
          if (!plugin.pluginId || !plugin.manifest || seen.has(plugin.pluginId)) {
            if (plugin.id) {
              store.delete(plugin.id);
              removedCount++;
            }
          } else {
            seen.add(plugin.pluginId);
          }
        });
        
        transaction.oncomplete = () => {
          console.log(`Cleaned up ${removedCount} invalid/duplicate plugins`);
          resolve(removedCount);
        };
        
        transaction.onerror = () => {
          reject(new Error("Failed to cleanup plugins"));
        };
      };
      
      getAllRequest.onerror = () => {
        reject(new Error("Failed to get plugins for cleanup"));
      };
    });
  }
}

// Create singleton instance
let dbInstance: IndexedDBService | null = null;

export const getDatabaseInstance = (): IndexedDBService => {
  if (!dbInstance) {
    dbInstance = new IndexedDBService();
  }
  return dbInstance;
};
