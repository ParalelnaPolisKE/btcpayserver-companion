import PluginPageClient from './plugin-page-client';
import { getAvailablePlugins, getPluginManifest } from '@/app/actions/plugins';
import { notFound } from 'next/navigation';

// Generate static params for all known plugins
export async function generateStaticParams() {
  const plugins = await getAvailablePlugins();
  return plugins.map((plugin) => ({
    appId: plugin.id,
  }));
}

export default async function PluginPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const manifest = await getPluginManifest(appId);
  
  if (!manifest) {
    notFound();
  }
  
  return <PluginPageClient appId={appId} manifest={manifest} />;
}