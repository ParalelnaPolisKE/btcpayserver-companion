import fs from "node:fs/promises";
import path from "node:path";
import type { PluginManifest } from "@/types/plugin";

const PLUGINS_DIR = path.join(process.cwd(), "plugins");
const INSTALLED_PLUGINS_DIR = path.join(process.cwd(), ".plugins"); // For uploaded plugins

export interface LoadedPlugin {
  manifest: PluginManifest;
  component: any;
  path: string;
}

/**
 * Load all available plugins from the plugins directory
 */
export async function loadAvailablePlugins(): Promise<PluginManifest[]> {
  const plugins: PluginManifest[] = [];

  try {
    // Load built-in plugins
    const builtInPlugins = await loadPluginsFromDirectory(PLUGINS_DIR);
    plugins.push(...builtInPlugins);

    // Load installed plugins (uploaded by users)
    try {
      const installedPlugins = await loadPluginsFromDirectory(
        INSTALLED_PLUGINS_DIR,
      );
      plugins.push(...installedPlugins);
    } catch (_error) {
      // Directory might not exist yet
      console.log("No installed plugins directory found");
    }

    return plugins;
  } catch (error) {
    console.error("Failed to load plugins:", error);
    return [];
  }
}

/**
 * Load plugins from a specific directory
 */
async function loadPluginsFromDirectory(
  dir: string,
): Promise<PluginManifest[]> {
  const plugins: PluginManifest[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(dir, entry.name);
        const manifestPath = path.join(pluginPath, "manifest.json");

        try {
          const manifestContent = await fs.readFile(manifestPath, "utf-8");
          const manifest = JSON.parse(manifestContent) as PluginManifest;
          plugins.push(manifest);
        } catch (error) {
          console.error(`Failed to load plugin from ${pluginPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to read directory ${dir}:`, error);
  }

  return plugins;
}

/**
 * Load a specific plugin by ID
 */
export async function loadPlugin(
  pluginId: string,
): Promise<LoadedPlugin | null> {
  // Try built-in plugins first
  let pluginPath = path.join(PLUGINS_DIR, pluginId);
  let manifestPath = path.join(pluginPath, "manifest.json");

  try {
    await fs.access(manifestPath);
  } catch {
    // Try installed plugins
    pluginPath = path.join(INSTALLED_PLUGINS_DIR, pluginId);
    manifestPath = path.join(pluginPath, "manifest.json");

    try {
      await fs.access(manifestPath);
    } catch {
      console.error(`Plugin ${pluginId} not found`);
      return null;
    }
  }

  try {
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestContent) as PluginManifest;

    // Dynamic import of the plugin component
    const _componentPath = path.join(pluginPath, manifest.main || "index.tsx");

    return {
      manifest,
      component: null, // Will be loaded dynamically on client
      path: pluginPath,
    };
  } catch (error) {
    console.error(`Failed to load plugin ${pluginId}:`, error);
    return null;
  }
}

/**
 * Install a plugin from a zip file
 */
export async function installPluginFromZip(
  zipBuffer: Buffer,
): Promise<PluginManifest> {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(zipBuffer);

  // Extract manifest first to get plugin ID
  const manifestEntry = zip.getEntry("manifest.json");
  if (!manifestEntry) {
    throw new Error("No manifest.json found in plugin zip");
  }

  const manifestContent = zip.readAsText(manifestEntry);
  const manifest = JSON.parse(manifestContent) as PluginManifest;

  // Create plugin directory
  const pluginPath = path.join(INSTALLED_PLUGINS_DIR, manifest.id);
  await fs.mkdir(pluginPath, { recursive: true });

  // Extract all files
  zip.extractAllTo(pluginPath, true);

  return manifest;
}

/**
 * Uninstall a plugin
 */
export async function uninstallPlugin(pluginId: string): Promise<void> {
  // Only allow uninstalling user-installed plugins
  const pluginPath = path.join(INSTALLED_PLUGINS_DIR, pluginId);

  try {
    await fs.rm(pluginPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to uninstall plugin ${pluginId}:`, error);
    throw error;
  }
}

/**
 * Get plugin component path for dynamic import
 */
export function getPluginComponentPath(
  pluginId: string,
  isInstalled = false,
): string {
  const baseDir = isInstalled ? "/.plugins" : "/plugins";
  return `${baseDir}/${pluginId}/index`;
}
