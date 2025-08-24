import type { Metadata } from "next";
import { getAvailablePlugins, getPluginManifest } from "@/lib/plugins";
import PluginSettingsClient from "./plugin-settings-client";

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ appId: string }>;
}): Promise<Metadata> {
  const { appId } = await params;
  const manifest = await getPluginManifest(appId);

  if (!manifest) {
    return {
      title: "Settings - BTCPayServer Companion",
    };
  }

  return {
    title: `${manifest.name} Settings - BTCPayServer Companion`,
    description: `Configure settings for ${manifest.name}`,
  };
}

// Generate static params for all plugins with settings routes
export async function generateStaticParams() {
  // Manually add the plugins that have settings pages
  // This is needed because the manifest structure varies
  const pluginsWithSettings = [
    "event-checkin",
    "financial-analysis",
    "cryptochat", // Has settings: true in manifest
    "payment-analytics-template", // Has settings: true in manifest
  ];

  return pluginsWithSettings.map((id) => ({
    appId: id,
  }));
}

export default async function PluginSettingsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return <PluginSettingsClient appId={appId} />;
}
