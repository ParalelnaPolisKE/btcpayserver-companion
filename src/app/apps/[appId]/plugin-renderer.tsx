'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { usePlugins } from '@/contexts/plugins-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPluginComponent } from '@/lib/plugin-registry';

interface PluginRendererProps {
  pluginId: string;
  manifest: any;
  route: string;
}

export default function PluginRenderer({ pluginId, manifest, route }: PluginRendererProps) {
  const { isPluginEnabled } = usePlugins();
  
  // Get the plugin component from the registry
  const PluginComponent = getPluginComponent(pluginId);
  
  // Check if plugin is enabled
  if (!isPluginEnabled(pluginId)) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">{manifest.name}</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground mb-4">
              This app is currently disabled.
            </p>
            <div className="text-center">
              <Link href="/apps">
                <Button>Go to Apps</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!PluginComponent) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">{manifest.name}</h1>
        <Alert>
          <AlertDescription>Plugin component not found</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Render the plugin component with the route
  return <PluginComponent route={route} />;
}