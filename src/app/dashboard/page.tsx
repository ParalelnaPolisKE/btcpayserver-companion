"use client";

import { Code, FileText, Globe, PlayCircle } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { OnboardingSection } from "@/components/dashboard/onboarding-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlugins } from "@/contexts/plugins-context";
import { APP_CONFIG } from "@/lib/app-config";
import {
  calculatePriceChange,
  getBitcoinPriceData,
} from "@/services/bitcoin-price";

// Lazy load dashboard components for better performance
const ServerStatusCard = dynamic(
  () => import("@/components/dashboard/server-status-card"),
  { ssr: false },
);
const InstalledAppsCard = dynamic(
  () => import("@/components/dashboard/installed-apps-card"),
  { ssr: false },
);
const SecurityStatusCard = dynamic(
  () => import("@/components/dashboard/security-status-card"),
  { ssr: false },
);
const BitcoinPriceCard = dynamic(
  () => import("@/components/dashboard/bitcoin-price-card"),
  { ssr: false },
);

// Lazy load tab content components
const TutorialsTab = dynamic(
  () => import("@/components/dashboard/tutorials-tab"),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
  },
);
const AppsGuideTab = dynamic(
  () => import("@/components/dashboard/apps-guide-tab"),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
  },
);
const SecurityTab = dynamic(
  () => import("@/components/dashboard/security-tab"),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
  },
);

/**
 * Dashboard page component
 * Optimized with React.memo and lazy loading for better performance
 * Manages server status, plugin information, and educational content
 */
const DashboardPage = React.memo(() => {
  const { installedPlugins } = usePlugins();
  const [serverStatus, setServerStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");

  // Get Bitcoin price data
  const btcPriceData = useMemo(() => getBitcoinPriceData(), []);
  const priceChange = useMemo(
    () => calculatePriceChange(btcPriceData),
    [btcPriceData],
  );

  /**
   * Checks BTCPayServer connection status
   * Memoized to prevent recreation on every render
   */
  const checkServerConnection = useCallback(async () => {
    try {
      // Security: Only check for existence, not value
      const hasApiKey = Boolean(localStorage.getItem("btcpay_api_key"));
      setServerStatus(hasApiKey ? "connected" : "disconnected");
    } catch (_error) {
      // Fail safely to disconnected state
      setServerStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkServerConnection();
  }, [checkServerConnection]);

  // Calculate enabled plugins count
  const enabledPluginsCount = useMemo(
    () => installedPlugins.filter((p) => p.config.enabled).length,
    [installedPlugins],
  );

  // Get current Bitcoin price
  const currentBtcPrice = useMemo(
    () => btcPriceData[btcPriceData.length - 1]?.price || 0,
    [btcPriceData],
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Badge variant="secondary" className="text-xs">
            v{APP_CONFIG.version}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Welcome to BTCPayServer Companion - Your gateway to enhanced
          BTCPayServer functionality
        </p>
      </div>

      {/* Onboarding Section */}
      <OnboardingSection />

      {/* Server Status & Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ServerStatusCard status={serverStatus} />
        <InstalledAppsCard
          totalPlugins={installedPlugins.length}
          enabledPlugins={enabledPluginsCount}
        />
        <SecurityStatusCard />
        <BitcoinPriceCard
          priceData={btcPriceData}
          currentPrice={currentBtcPrice}
          priceChange={priceChange}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tutorials" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger value="apps">Apps Guide</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="space-y-4">
          <TutorialsTab />
        </TabsContent>

        {/* Apps Guide Tab */}
        <TabsContent value="apps" className="space-y-4">
          <AppsGuideTab />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <SecurityTab />
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>BTCPayServer Quick Links</CardTitle>
          <CardDescription>Frequently accessed resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="justify-start"
            >
              <a
                href="https://btcpayserver.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="mr-2 h-4 w-4" />
                BTCPayServer.org
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="justify-start"
            >
              <a
                href="https://github.com/btcpayserver/btcpayserver"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Code className="mr-2 h-4 w-4" />
                GitHub Repository
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="justify-start"
            >
              <a
                href="https://docs.btcpayserver.org/API/Greenfield/v1/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="mr-2 h-4 w-4" />
                API Documentation
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="justify-start"
            >
              <a
                href="https://www.youtube.com/@BTCPayServer"
                target="_blank"
                rel="noopener noreferrer"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Video Tutorials
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

DashboardPage.displayName = "DashboardPage";

export default DashboardPage;
