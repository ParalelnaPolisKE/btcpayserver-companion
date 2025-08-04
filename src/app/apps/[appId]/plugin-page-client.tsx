'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PluginRenderer from './plugin-renderer';
import { AvailablePlugin } from '@/app/actions/plugins';

interface PluginPageClientProps {
  appId: string;
  manifest: AvailablePlugin;
}

function PluginPageContent({ appId, manifest }: PluginPageClientProps) {
  const searchParams = useSearchParams();
  const route = searchParams.get('route') || '/';
  
  return (
    <PluginRenderer 
      pluginId={appId}
      manifest={manifest}
      route={route}
    />
  );
}

export default function PluginPageClient({ appId, manifest }: PluginPageClientProps) {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PluginPageContent appId={appId} manifest={manifest} />
    </Suspense>
  );
}