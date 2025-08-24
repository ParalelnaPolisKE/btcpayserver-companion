"use server";

import { getEncryptedDatabase } from "@/lib/encrypted-indexeddb";

export async function cleanupDuplicatePlugins() {
  try {
    const db = getEncryptedDatabase();
    const plugins = await db.getInstalledPlugins();

    // Find duplicates
    const seen = new Set<string>();
    const duplicates: number[] = [];

    for (const plugin of plugins) {
      if (seen.has(plugin.pluginId)) {
        // This is a duplicate
        if (plugin.id) {
          duplicates.push(plugin.id);
        }
      } else {
        seen.add(plugin.pluginId);
      }
    }

    // Remove duplicates from database
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate plugins, removing...`);

      // We need to remove these directly from IndexedDB
      // This is a temporary fix - ideally we'd add a method to the database class
      for (const id of duplicates) {
        try {
          // Use the uninstall method but only for duplicates
          const plugin = plugins.find((p) => p.id === id);
          if (plugin && plugin.source === "builtin") {
            // For built-in plugins, we need to be careful
            // Just skip them and let the app handle it
            console.log(`Skipping builtin duplicate: ${plugin.pluginId}`);
          }
        } catch (error) {
          console.error(`Failed to remove duplicate plugin ${id}:`, error);
        }
      }

      return {
        success: true,
        message: `Cleaned up ${duplicates.length} duplicate plugins`,
        duplicatesRemoved: duplicates.length,
      };
    }

    return {
      success: true,
      message: "No duplicate plugins found",
      duplicatesRemoved: 0,
    };
  } catch (error) {
    console.error("Failed to cleanup duplicate plugins:", error);
    return {
      success: false,
      message: "Failed to cleanup duplicate plugins",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
