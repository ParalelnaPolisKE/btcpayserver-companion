import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAvailablePlugins, getPluginManifest } from "@/lib/plugins";
import PluginPageClient from "./plugin-page-client";

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
      title: "App Not Found - BTCPayServer Companion",
    };
  }

  return {
    title: `${manifest.name} - BTCPayServer Companion`,
    description: manifest.description,
  };
}

// Generate static params for all known plugins
export async function generateStaticParams() {
  const plugins = await getAvailablePlugins();
  return plugins.map((plugin) => ({
    appId: plugin.id,
  }));
}

export default async function PluginPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const manifest = await getPluginManifest(appId);

  if (!manifest) {
    notFound();
  }

  return <PluginPageClient appId={appId} manifest={manifest} />;
}
