export interface BTCPayPermission {
  permission: string;
  description: string;
  required: boolean;
}

export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  homepage?: string;
  license?: string;
  main?: string; // Entry point file
  icon?: string; // Icon name or path
  routes?: {
    main: string;
    settings?: string;
    [key: string]: string | undefined;
  };
  requiredPermissions?: BTCPayPermission[];
  dependencies?: Record<string, string>;
  isPaid: boolean;
  price?: number;
  category?: string;
  tags?: string[];
  screenshots?: string[];
  minAppVersion?: string;
}

export interface PluginConfig {
  enabled: boolean;
  installedAt: Date;
  lastUpdated?: Date;
  settings?: Record<string, any>;
}

export interface InstalledPlugin {
  id?: number;
  pluginId: string;
  manifest: PluginManifest;
  config: PluginConfig;
  source: "builtin" | "uploaded" | "marketplace";
  installedPath?: string;
}
