'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

interface PluginSettingsClientProps {
  appId: string;
}

export default function PluginSettingsClient({ appId }: PluginSettingsClientProps) {
  const PluginSettingsComponent = useMemo(() => {
    return dynamic(
      async () => {
        try {
          // First try to import a dedicated settings file
          const settingsModule = await import(`@bps-companion/plugins/${appId}/settings`);
          return settingsModule.default || settingsModule.Settings || settingsModule.SettingsComponent;
        } catch (error) {
          // If no dedicated settings file, try the main index file
          try {
            const indexModule = await import(`@bps-companion/plugins/${appId}/index`);
            return indexModule.FinancialAnalysisSettings || indexModule.SettingsComponent || indexModule.Settings || indexModule.default;
          } catch (indexError) {
            // Return a default component if nothing is found
            return () => (
              <div className="container mx-auto py-8">
                <p className="text-muted-foreground">No settings available for {appId}</p>
              </div>
            );
          }
        }
      },
      {
        ssr: false,
        loading: () => (
          <div className="container mx-auto py-8">
            <p className="text-muted-foreground">Loading {appId} settings...</p>
          </div>
        ),
      }
    );
  }, [appId]);
  
  return <PluginSettingsComponent />;
}