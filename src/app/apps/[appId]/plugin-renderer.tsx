"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { PluginSandbox } from "@/components/plugins/plugin-sandbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlugins } from "@/contexts/plugins-context";
import { getPluginComponent } from "@/lib/plugin-registry";
import { getSecurityMonitor } from "@/services/plugin-security-monitor";

interface PluginRendererProps {
  pluginId: string;
  manifest: any;
  route: string;
}

export default function PluginRenderer({
  pluginId,
  manifest,
  route,
}: PluginRendererProps) {
  const { isPluginEnabled, getPlugin } = usePlugins();
  const [useSecureSandbox, setUseSecureSandbox] = useState(true);
  const [pluginCode, _setPluginCode] = useState<string>("");
  const monitor = getSecurityMonitor();

  useEffect(() => {
    // Load plugin code for sandbox (in production, this would be fetched securely)
    // For now, we'll use the dynamic import approach for trusted plugins
    const plugin = getPlugin(pluginId);
    if (plugin?.source === "builtin") {
      // Built-in plugins can run without sandbox
      setUseSecureSandbox(false);
    }
  }, [pluginId, getPlugin]);

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

  // Use secure sandbox for untrusted plugins
  if (useSecureSandbox && pluginCode) {
    return (
      <PluginSandbox
        pluginId={pluginId}
        manifest={manifest}
        pluginContent={pluginCode}
        settings={getPlugin(pluginId)?.config.settings}
        onSecurityViolation={(violation) => {
          monitor.recordEvent({
            id: crypto.randomUUID(),
            pluginId,
            timestamp: new Date(),
            type: "violation",
            category:
              violation.type === "access"
                ? "permission"
                : (violation.type as any),
            message: violation.message,
            details: violation.details,
            severity: "high",
          });
        }}
      />
    );
  }

  // Render trusted plugin component directly with Suspense
  return (
    <React.Suspense
      fallback={
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">{manifest.name}</h1>
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Loading plugin...
              </p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PluginComponent route={route} />
    </React.Suspense>
  );
}
