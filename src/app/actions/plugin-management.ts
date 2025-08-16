'use server';

import { PluginExtractor } from '@/services/plugin-extractor';
import { revalidatePath } from 'next/cache';

export interface PluginRemovalResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Completely removes a plugin from the system (files + database entry)
 * This is a server action that handles the filesystem cleanup
 */
export async function removePluginCompletely(pluginId: string): Promise<PluginRemovalResult> {
  try {
    // Use the PluginExtractor to remove plugin files
    const extractor = new PluginExtractor();
    const result = await extractor.removePlugin(pluginId);
    
    if (!result.success) {
      return {
        success: false,
        message: result.message,
        error: result.message
      };
    }
    
    // Revalidate the apps page to reflect the removal
    revalidatePath('/apps');
    revalidatePath(`/apps/${pluginId}`);
    
    return {
      success: true,
      message: `Plugin "${result.manifest?.name || pluginId}" has been completely removed`
    };
  } catch (error) {
    console.error('Failed to remove plugin:', error);
    return {
      success: false,
      message: 'Failed to remove plugin',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Checks if a plugin can be uninstalled based on its source
 */
export async function canUninstallPlugin(pluginId: string, source: string): Promise<boolean> {
  // Built-in plugins cannot be uninstalled
  if (source === 'builtin') {
    return false;
  }
  
  // Uploaded and marketplace plugins can be uninstalled
  return true;
}