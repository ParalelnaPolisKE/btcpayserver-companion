"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { AvailablePlugin } from "@/lib/plugins";
import PluginRenderer from "./plugin-renderer";

interface PluginPageClientProps {
  appId: string;
  manifest: AvailablePlugin;
}

function PluginPageContent({ appId, manifest }: PluginPageClientProps) {
  const searchParams = useSearchParams();
  const route = searchParams.get("route") || "/";

  return <PluginRenderer pluginId={appId} manifest={manifest} route={route} />;
}

export default function PluginPageClient({
  appId,
  manifest,
}: PluginPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <PluginPageContent appId={appId} manifest={manifest} />
    </Suspense>
  );
}
