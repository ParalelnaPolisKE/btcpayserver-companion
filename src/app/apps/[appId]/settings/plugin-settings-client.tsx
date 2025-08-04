'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

interface PluginSettingsClientProps {
  appId: string;
}

export default function PluginSettingsClient({ appId }: PluginSettingsClientProps) {
  const PluginSettingsComponent = useMemo(() => {
    return dynamic(
      () => import(`@/plugins/${appId}/index`).then(mod => {
        // Try to get the settings component
        return mod.FinancialAnalysisSettings || mod.SettingsComponent || mod.Settings;
      }),
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