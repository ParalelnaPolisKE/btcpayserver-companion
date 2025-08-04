import { getAvailablePlugins } from '@/app/actions/plugins';
import PluginSettingsClient from './plugin-settings-client';

// Generate static params for all plugins with settings routes
export async function generateStaticParams() {
  const plugins = await getAvailablePlugins();
  return plugins
    .filter(plugin => plugin.settingsRoute)
    .map((plugin) => ({
      appId: plugin.id,
    }));
}

export default async function PluginSettingsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  return <PluginSettingsClient appId={appId} />;
}