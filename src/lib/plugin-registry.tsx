'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Map of known plugin IDs to their import paths
// This is client-side so we can't dynamically scan the filesystem
// Instead, we use a convention-based approach where all plugins follow the same structure
const PLUGIN_BASE_PATH = '@bps-companion/plugins';

// Get a plugin component by ID with dynamic import
export function getPluginComponent(pluginId: string): React.ComponentType<any> | null {
  // Use convention: all plugins have components/FinancialAnalysisApp.tsx as their main component
  // or they export a default component from index.tsx
  try {
    const Component = dynamic(
      () => import(`${PLUGIN_BASE_PATH}/${pluginId}/index`).then(mod => mod.default || mod.FinancialAnalysisApp),
      {
        ssr: false
      }
    );
    return Component;
  } catch (error) {
    console.error(`Failed to load plugin component for ${pluginId}:`, error);
    return null;
  }
}

// Get a plugin settings component by ID with dynamic import
export function getPluginSettingsComponent(pluginId: string): React.ComponentType<any> | null {
  try {
    const Component = dynamic(
      () => import(`${PLUGIN_BASE_PATH}/${pluginId}/index`).then(mod => mod.FinancialAnalysisSettings),
      {
        ssr: false
      }
    );
    return Component;
  } catch (error) {
    console.error(`Failed to load plugin settings component for ${pluginId}:`, error);
    return null;
  }
}