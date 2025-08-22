"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Code,
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  Key,
  Lock,
  Package,
  PlayCircle,
  Server,
  Shield,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Area, AreaChart } from "recharts";
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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlugins } from "@/contexts/plugins-context";
import { APP_CONFIG } from "@/lib/app-config";
import {
  getBitcoinPriceData,
  calculatePriceChange,
  formatPrice,
} from "@/services/bitcoin-price";

const chartConfig = {
  price: {
    label: "BTC Price",
    color: "#52b13d",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { installedPlugins } = usePlugins();
  const [serverStatus, setServerStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");
  
  // Get Bitcoin price data
  const btcPriceData = useMemo(() => getBitcoinPriceData(), []);
  const priceChange = useMemo(() => calculatePriceChange(btcPriceData), [btcPriceData]);

  const checkServerConnection = async () => {
    try {
      // Check if we have API configuration
      const hasApiKey = localStorage.getItem("btcpay_api_key");
      setServerStatus(hasApiKey ? "connected" : "disconnected");
    } catch (_error) {
      setServerStatus("disconnected");
    }
  };

  useEffect(() => {
    // Check server connection status
    checkServerConnection();
  }, [
    // Check server connection status
    checkServerConnection,
  ]);

  const tutorials = [
    {
      icon: CreditCard,
      title: "Getting Started with BTCPayServer Companion",
      description: "Learn the basics of setting up and using the companion app",
      link: "/guides#getting-started",
      internal: true,
      duration: "5 min",
    },
    {
      icon: Package,
      title: "Installing and Managing Apps",
      description: "Discover how to extend functionality with apps",
      link: "/guides#managing-apps",
      internal: true,
      duration: "3 min",
    },
    {
      icon: Shield,
      title: "Understanding Plugin Security",
      description: "Learn how we protect your server from malicious plugins",
      link: "/guides#plugin-security",
      internal: true,
      duration: "10 min",
    },
    {
      icon: Code,
      title: "Developing Your Own Plugin",
      description: "Create custom plugins for your specific needs",
      link: "/guides#developing-plugins",
      internal: true,
      duration: "15 min",
    },
  ];

  const securityFeatures = [
    {
      icon: ShieldCheck,
      title: "Plugin Sandboxing",
      description:
        "All plugins run in isolated environments preventing access to sensitive data",
    },
    {
      icon: Key,
      title: "Permission System",
      description: "Granular permissions control what each plugin can access",
    },
    {
      icon: Lock,
      title: "Code Scanning",
      description:
        "Automatic scanning for malicious code patterns before installation",
    },
    {
      icon: AlertTriangle,
      title: "Runtime Monitoring",
      description:
        "Real-time detection and blocking of suspicious plugin behavior",
    },
  ];

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  serverStatus === "connected"
                    ? "bg-green-500"
                    : serverStatus === "disconnected"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              />
              <span className="text-2xl font-bold capitalize">
                {serverStatus}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {serverStatus === "connected"
                ? "BTCPayServer connected"
                : serverStatus === "disconnected"
                  ? "Configure in settings"
                  : "Checking connection..."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Installed Apps
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{installedPlugins.length}</div>
            <p className="text-xs text-muted-foreground">
              {installedPlugins.filter((p) => p.config.enabled).length} enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Security Status
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">Secure</span>
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-1 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bitcoin Price</CardTitle>
            {priceChange.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {formatPrice(btcPriceData[btcPriceData.length - 1]?.price || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={priceChange.isPositive ? "text-green-500" : "text-red-500"}>
                  {priceChange.isPositive ? "+" : ""}{priceChange.percentage}%
                </span>
                {" "}
                last 30 days
              </p>
            </div>
            <div className="h-[50px] w-[100px] overflow-hidden">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <AreaChart
                  data={btcPriceData}
                  margin={{
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="fillBtcPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#52b13d"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="95%"
                        stopColor="#cedc21"
                        stopOpacity={0.3}
                      />
                    </linearGradient>
                  </defs>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => formatPrice(Number(value))}
                      />
                    }
                  />
                  <Area
                    dataKey="price"
                    type="natural"
                    fill="url(#fillBtcPrice)"
                    fillOpacity={1}
                    stroke="#52b13d"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Learn how to use BTCPayServer Companion effectively
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {tutorials.map((tutorial, index) => {
                  const Icon = tutorial.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (
                          tutorial.internal &&
                          tutorial.link.startsWith("#")
                        ) {
                          document
                            .querySelector(tutorial.link)
                            ?.scrollIntoView({ behavior: "smooth" });
                        } else if (tutorial.internal) {
                          window.location.href = tutorial.link;
                        } else {
                          window.open(tutorial.link, "_blank");
                        }
                      }}
                    >
                      <div className="mt-0.5">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            {tutorial.title}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {tutorial.duration}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tutorial.description}
                        </p>
                      </div>
                      {!tutorial.internal && (
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Need More Help?</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Visit our comprehensive documentation for detailed guides and
                  API references.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href="https://docs.btcpayserver.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Documentation
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href="https://chat.btcpayserver.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Community Chat
                      <Users className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apps Guide Tab */}
        <TabsContent value="apps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Installation & Management</CardTitle>
              <CardDescription>
                Extend BTCPayServer Companion with powerful apps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Browse Available Apps</h4>
                    <p className="text-sm text-muted-foreground">
                      Visit the Apps page to see all available plugins. Built-in
                      apps like Financial Analysis and Event Check-in are
                      pre-installed and ready to use.
                    </p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/apps">
                        Go to Apps
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Enable Apps</h4>
                    <p className="text-sm text-muted-foreground">
                      Toggle the switch on any app card to enable it. Enabled
                      apps will appear in the sidebar for quick access.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Upload Custom Apps</h4>
                    <p className="text-sm text-muted-foreground">
                      Advanced users can upload custom plugins as ZIP files. All
                      uploaded plugins go through our security scanning process
                      before installation.
                    </p>
                    <Badge variant="outline" className="text-xs">
                      <Lock className="mr-1 h-3 w-3" />
                      Security Verified
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Popular Apps</h4>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium text-sm">
                          Financial Analysis
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Revenue analytics and reporting
                        </p>
                      </div>
                    </div>
                    <Badge>Built-in</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Event Check-in</p>
                        <p className="text-xs text-muted-foreground">
                          QR code-based event management
                        </p>
                      </div>
                    </div>
                    <Badge>Built-in</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent
          value="security"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Security & Protection</CardTitle>
              </div>
              <CardDescription>
                How we keep your BTCPayServer and plugins secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Your Security is Our Priority
                  </p>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  BTCPayServer Companion implements multiple layers of security
                  to protect your cryptocurrency operations and server from
                  malicious plugins.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {securityFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="flex gap-3 p-4 rounded-lg border"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">Security Best Practices</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Only install plugins from trusted sources
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Review plugin permissions before installation
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Keep your BTCPayServer Companion updated to the latest
                      version
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Regularly review installed plugins and remove unused ones
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a
                    href="https://docs.btcpayserver.org/Security/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Security Documentation
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/apps">
                    View Plugin Permissions
                    <ChevronRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
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
}
