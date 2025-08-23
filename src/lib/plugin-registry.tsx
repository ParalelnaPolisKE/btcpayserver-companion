"use client";

import type React from "react";
import { lazy } from "react";

// Lazy load plugin components
const FinancialAnalysisApp = lazy(
  () => import("../../plugins/financial-analysis/FinancialAnalysisWrapper"),
);
const FinancialAnalysisSettings = lazy(
  () => import("../../plugins/financial-analysis/FinancialAnalysisSettings"),
);
const EventCheckInApp = lazy(() => import("../../plugins/event-checkin/index"));
const EventCheckInSettings = lazy(
  () => import("../../plugins/event-checkin/settings"),
);
const PluginTemplateApp = lazy(
  () => import("../../plugins/plugin-template/index"),
);
const PluginTemplateSettings = lazy(
  () => import("../../plugins/plugin-template/components/PaymentSettings"),
);
const CryptoChatApp = lazy(
  () => import("../../plugins/cryptochat/index"),
);
const CryptoChatSettings = lazy(
  () => import("../../plugins/cryptochat/components/CryptoChatSettings"),
);

// Map of plugin IDs to their components
const pluginComponents: Record<string, React.ComponentType<any>> = {
  "financial-analysis": FinancialAnalysisApp,
  "event-checkin": EventCheckInApp,
  "payment-analytics-template": PluginTemplateApp,
  "cryptochat": CryptoChatApp,
};

// Map of plugin IDs to their settings components
const pluginSettingsComponents: Record<string, React.ComponentType<any>> = {
  "financial-analysis": FinancialAnalysisSettings,
  "event-checkin": EventCheckInSettings,
  "payment-analytics-template": PluginTemplateSettings,
  "cryptochat": CryptoChatSettings,
};

// Get a plugin component by ID
export function getPluginComponent(
  pluginId: string,
): React.ComponentType<any> | null {
  console.log(`Loading plugin component: ${pluginId}`);
  return pluginComponents[pluginId] || null;
}

// Get a plugin settings component by ID
export function getPluginSettingsComponent(
  pluginId: string,
): React.ComponentType<any> | null {
  console.log(`Loading plugin settings component: ${pluginId}`);
  return pluginSettingsComponents[pluginId] || null;
}
