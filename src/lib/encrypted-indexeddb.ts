import { getCryptoService, type CryptoService } from "./crypto";
import {
  getDatabaseInstance,
  type Settings,
  type InstalledPlugin,
  type Store,
} from "./indexeddb";

/**
 * Encrypted wrapper for IndexedDB operations
 * Handles encryption/decryption of sensitive fields transparently
 */
export class EncryptedIndexedDBService {
  private crypto: CryptoService;
  private db: ReturnType<typeof getDatabaseInstance>;

  constructor() {
    this.crypto = getCryptoService();
    this.db = getDatabaseInstance();
  }

  // Settings methods with encryption
  async getSecureSetting(key: string): Promise<any> {
    const value = await this.db.getSetting(key);
    
    // List of settings that should be decrypted
    const encryptedSettings = ["apiKey", "serverUrl", "webhookSecret"];
    
    if (encryptedSettings.includes(key) && value && this.crypto.isEncrypted(value)) {
      return this.crypto.decrypt(value);
    }
    
    return value;
  }

  async setSecureSetting(key: string, value: any): Promise<void> {
    // List of settings that should be encrypted
    const encryptedSettings = ["apiKey", "serverUrl", "webhookSecret"];
    
    let finalValue = value;
    if (encryptedSettings.includes(key) && value !== null && value !== undefined) {
      finalValue = this.crypto.encrypt(value);
    }
    
    await this.db.setSetting(key, finalValue);
  }

  // Store methods with selective encryption
  async getStores(): Promise<Store[]> {
    const stores = await this.db.getStores();
    
    // Decrypt sensitive fields in stores
    return stores.map(store => {
      if (store.posFilter && this.crypto.isEncrypted(store.posFilter)) {
        return {
          ...store,
          posFilter: this.crypto.decrypt(store.posFilter),
        };
      }
      return store;
    });
  }

  async addStore(store: Omit<Store, "id">): Promise<number> {
    // Encrypt sensitive fields before storing
    const encryptedStore = { ...store };
    
    if (store.posFilter) {
      encryptedStore.posFilter = this.crypto.encrypt(store.posFilter);
    }
    
    return await this.db.addStore(encryptedStore);
  }

  async updateStore(id: number, updates: Partial<Store>): Promise<void> {
    const encryptedUpdates = { ...updates };
    
    if (updates.posFilter !== undefined) {
      encryptedUpdates.posFilter = updates.posFilter 
        ? this.crypto.encrypt(updates.posFilter)
        : undefined;
    }
    
    await this.db.updateStore(id, encryptedUpdates);
  }

  // Plugin methods with encrypted settings
  async getInstalledPlugins(): Promise<InstalledPlugin[]> {
    const plugins = await this.db.getInstalledPlugins();
    
    // Decrypt plugin settings that contain sensitive data
    return plugins.map(plugin => {
      const decryptedPlugin = { ...plugin };
      
      // Check if plugin settings contain encrypted fields
      if (plugin.config?.settings) {
        const settings = { ...plugin.config.settings };
        
        // Decrypt known sensitive fields
        if (settings.apiKey && this.crypto.isEncrypted(settings.apiKey)) {
          settings.apiKey = this.crypto.decrypt(settings.apiKey);
        }
        if (settings.secret && this.crypto.isEncrypted(settings.secret)) {
          settings.secret = this.crypto.decrypt(settings.secret);
        }
        if (settings.webhookSecret && this.crypto.isEncrypted(settings.webhookSecret)) {
          settings.webhookSecret = this.crypto.decrypt(settings.webhookSecret);
        }
        
        decryptedPlugin.config = {
          ...plugin.config,
          settings,
        };
      }
      
      return decryptedPlugin;
    });
  }

  async getPlugin(pluginId: string): Promise<InstalledPlugin | null> {
    const plugin = await this.db.getPlugin(pluginId);
    
    if (!plugin) return null;
    
    // Decrypt plugin settings
    const decryptedPlugin = { ...plugin };
    
    if (plugin.config?.settings) {
      const settings = { ...plugin.config.settings };
      
      // Decrypt known sensitive fields
      if (settings.apiKey && this.crypto.isEncrypted(settings.apiKey)) {
        settings.apiKey = this.crypto.decrypt(settings.apiKey);
      }
      if (settings.secret && this.crypto.isEncrypted(settings.secret)) {
        settings.secret = this.crypto.decrypt(settings.secret);
      }
      if (settings.webhookSecret && this.crypto.isEncrypted(settings.webhookSecret)) {
        settings.webhookSecret = this.crypto.decrypt(settings.webhookSecret);
      }
      
      decryptedPlugin.config = {
        ...plugin.config,
        settings,
      };
    }
    
    return decryptedPlugin;
  }

  async updatePluginSettings(
    pluginId: string,
    settings: Record<string, any>
  ): Promise<void> {
    // Get existing plugin to merge settings
    const existingPlugin = await this.db.getPlugin(pluginId);
    if (!existingPlugin) {
      throw new Error("Plugin not found");
    }
    
    const encryptedSettings = { ...settings };
    
    // Encrypt sensitive fields in settings
    if (settings.apiKey !== undefined) {
      encryptedSettings.apiKey = settings.apiKey 
        ? this.crypto.encrypt(settings.apiKey)
        : null;
    }
    if (settings.secret !== undefined) {
      encryptedSettings.secret = settings.secret
        ? this.crypto.encrypt(settings.secret)
        : null;
    }
    if (settings.webhookSecret !== undefined) {
      encryptedSettings.webhookSecret = settings.webhookSecret
        ? this.crypto.encrypt(settings.webhookSecret)
        : null;
    }
    
    await this.db.updatePluginSettings(pluginId, encryptedSettings);
  }

  // Proxy all other methods to the original database
  async init() {
    return await this.db.init();
  }

  async deleteStore(id: number) {
    return await this.db.deleteStore(id);
  }

  async reorderStores(storeIds: number[]) {
    return await this.db.reorderStores(storeIds);
  }

  async getSetting(key: string) {
    // Use secure version for consistency
    return await this.getSecureSetting(key);
  }

  async setSetting(key: string, value: any) {
    // Use secure version for consistency
    return await this.setSecureSetting(key, value);
  }

  async getExpenseCategories() {
    return await this.db.getExpenseCategories();
  }

  async addExpenseCategory(category: Parameters<typeof this.db.addExpenseCategory>[0]) {
    return await this.db.addExpenseCategory(category);
  }

  async updateExpenseCategory(id: number, updates: Parameters<typeof this.db.updateExpenseCategory>[1]) {
    return await this.db.updateExpenseCategory(id, updates);
  }

  async deleteExpenseCategory(id: number) {
    return await this.db.deleteExpenseCategory(id);
  }

  async getExpenseItems(categoryId?: number) {
    return await this.db.getExpenseItems(categoryId);
  }

  async addExpenseItem(item: Parameters<typeof this.db.addExpenseItem>[0]) {
    return await this.db.addExpenseItem(item);
  }

  async updateExpenseItem(id: number, updates: Parameters<typeof this.db.updateExpenseItem>[1]) {
    return await this.db.updateExpenseItem(id, updates);
  }

  async deleteExpenseItem(id: number) {
    return await this.db.deleteExpenseItem(id);
  }

  async installPlugin(
    manifest: Parameters<typeof this.db.installPlugin>[0],
    source: Parameters<typeof this.db.installPlugin>[1]
  ) {
    return await this.db.installPlugin(manifest, source);
  }

  async updatePluginConfig(
    pluginId: string,
    config: Parameters<typeof this.db.updatePluginConfig>[1]
  ) {
    return await this.db.updatePluginConfig(pluginId, config);
  }

  async uninstallPlugin(pluginId: string) {
    return await this.db.uninstallPlugin(pluginId);
  }

  async cleanupInvalidPlugins() {
    return await this.db.cleanupInvalidPlugins();
  }

  async initializeDefaultStores() {
    return await this.db.initializeDefaultStores();
  }

  async initializeDefaultExpenses() {
    return await this.db.initializeDefaultExpenses();
  }
}

// Create singleton instance
let encryptedDbInstance: EncryptedIndexedDBService | null = null;

export const getEncryptedDatabase = (): EncryptedIndexedDBService => {
  if (!encryptedDbInstance) {
    encryptedDbInstance = new EncryptedIndexedDBService();
  }
  return encryptedDbInstance;
};

// Export for backwards compatibility
export { type Store, type Settings, type InstalledPlugin, type ExpenseCategory, type ExpenseItem } from "./indexeddb";