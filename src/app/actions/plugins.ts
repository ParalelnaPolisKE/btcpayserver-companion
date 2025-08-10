// Plugin utilities - used by API routes and server components

import fs from 'fs/promises';
import path from 'path';
import { PluginManifest } from '@/types/plugin';

export interface AvailablePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  route: string;
  settingsRoute?: string;
  routes?: {
    main?: string;
    settings?: string;
  };
  isPaid: boolean;
  price?: number;
  requiredPermissions?: Array<{
    permission: string;
    description: string;
    required: boolean;
  }>;
  category?: string;
  tags?: string[];
}

export async function getPluginManifest(pluginId: string): Promise<AvailablePlugin | null> {
  const plugins = await getAvailablePlugins();
  return plugins.find(p => p.id === pluginId) || null;
}

export async function getAvailablePlugins(): Promise<AvailablePlugin[]> {
  const pluginsDir = path.join(process.cwd(), 'plugins');
  const plugins: AvailablePlugin[] = [];

  try {
    const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(pluginsDir, entry.name);
        const manifestPath = path.join(pluginPath, 'manifest.json');
        
        try {
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest: PluginManifest = JSON.parse(manifestContent);
          
          plugins.push({
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description || '',
            author: manifest.author || 'Unknown',
            icon: manifest.icon,
            route: `/apps/${manifest.id}`,
            settingsRoute: manifest.routes?.settings ? `/apps/${manifest.id}/settings` : undefined,
            routes: manifest.routes,
            isPaid: manifest.isPaid || false,
            price: manifest.price,
            requiredPermissions: manifest.requiredPermissions,
            category: manifest.category,
            tags: manifest.tags,
          });
        } catch (error) {
          console.error(`Failed to load plugin manifest from ${pluginPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to read plugins directory:', error);
  }
  
  return plugins;
}

export async function removePluginFolder(pluginId: string): Promise<{ success: boolean; message: string }> {
  try {
    const pluginsDir = path.join(process.cwd(), 'plugins');
    const pluginPath = path.join(pluginsDir, pluginId);
    
    // Check if the plugin folder exists
    try {
      await fs.access(pluginPath);
    } catch {
      return {
        success: false,
        message: `Plugin folder "${pluginId}" not found`,
      };
    }
    
    // Remove the plugin folder
    await fs.rm(pluginPath, { recursive: true, force: true });
    
    // Note: Revalidation should be handled by the calling code
    
    return {
      success: true,
      message: `Plugin "${pluginId}" removed successfully`,
    };
  } catch (error) {
    console.error('Failed to remove plugin folder:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remove plugin',
    };
  }
}

export async function uploadPluginServerAction(formData: FormData): Promise<{ success: boolean; message: string; plugin?: AvailablePlugin }> {
  // This server action can be used for server-side plugin uploads
  // Currently, it's not used as we handle uploads via the API route
  try {
    const { PluginExtractor } = await import('@/services/plugin-extractor');
    const file = formData.get('file') as File;
    
    if (!file) {
      return { success: false, message: 'No file provided' };
    }
    
    if (!file.name.endsWith('.zip')) {
      return { success: false, message: 'File must be a ZIP archive' };
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const extractor = new PluginExtractor();
    const result = await extractor.extractPlugin(buffer, file.name);
    
    if (result.success) {
      // Note: Revalidation should be handled by the calling code
      return {
        success: true,
        message: result.message,
        plugin: result.manifest ? {
          id: result.manifest.id,
          name: result.manifest.name,
          version: result.manifest.version,
          description: result.manifest.description || '',
          author: result.manifest.author || 'Unknown',
          icon: result.manifest.icon,
          route: `/apps/${result.manifest.id}`,
          settingsRoute: result.manifest.routes?.settings ? `/apps/${result.manifest.id}/settings` : undefined,
          routes: result.manifest.routes,
          isPaid: result.manifest.isPaid || false,
          price: result.manifest.price,
          requiredPermissions: result.manifest.requiredPermissions,
          category: result.manifest.category,
          tags: result.manifest.tags,
        } : undefined,
      };
    }
    
    return {
      success: false,
      message: result.message,
    };
  } catch (error) {
    console.error('Failed to upload plugin:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload plugin',
    };
  }
}