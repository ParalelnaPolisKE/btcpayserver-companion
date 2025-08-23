"use client";

import {
  BookOpen,
  ChevronUp,
  Code,
  CreditCard,
  DollarSign,
  Github,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Package,
  PieChart,
  QrCode,
  Settings,
  Shield,
  Sun,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { usePlugins } from "@/contexts/plugins-context";
import { cn } from "@/lib/utils";

// Icon mapping for plugins
const iconMap: Record<string, React.ComponentType<any>> = {
  "financial-analysis": PieChart,
  "event-checkin": QrCode,
  "invoice-management": DollarSign,
  analytics: TrendingUp,
  customers: Users,
  automation: Zap,
};

function getPluginIcon(pluginId: string): React.ComponentType<any> {
  return iconMap[pluginId] || Package;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { installedPlugins, isLoading } = usePlugins();
  const { theme, setTheme } = useTheme();
  const [appsOpen, setAppsOpen] = React.useState(true);
  const [guidesOpen, setGuidesOpen] = React.useState(false);

  // Filter enabled plugins
  const enabledPlugins = installedPlugins.filter((p) => p.config.enabled);

  // Main navigation items
  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  // Guide items for the submenu
  const guideItems = [
    {
      title: "Overview",
      href: "/guides",
      icon: BookOpen,
    },
    {
      title: "Getting Started",
      href: "/guides#getting-started/overview",
      icon: CreditCard,
    },
    {
      title: "Managing Apps",
      href: "/guides#managing-apps/overview",
      icon: Package,
    },
    {
      title: "Plugin Security",
      href: "/guides#plugin-security/overview",
      icon: Shield,
    },
    {
      title: "Developing Plugins",
      href: "/guides#developing-plugins/overview",
      icon: Code,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CreditCard className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">BTCPayServer Companion</span>
                  <span className="text-xs text-muted-foreground">
                    Store Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Guides Section */}
        <SidebarGroup>
          <Collapsible open={guidesOpen} onOpenChange={setGuidesOpen}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Guides</span>
                <ChevronUp
                  className={cn(
                    "size-4 transition-transform text-muted-foreground",
                    !guidesOpen && "-rotate-180",
                  )}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {guideItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === "/guides" && item.href === "/guides"
                      ? true
                      : pathname === "/guides" && typeof window !== 'undefined' && window.location.hash === item.href.replace("/guides", "");

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.href}>
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Apps Section */}
        <SidebarGroup>
          <Collapsible open={appsOpen} onOpenChange={setAppsOpen}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Apps</span>
                <div className="flex items-center gap-2">
                  {enabledPlugins.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {enabledPlugins.length}
                    </span>
                  )}
                  <ChevronUp
                    className={cn(
                      "size-4 transition-transform text-muted-foreground",
                      !appsOpen && "-rotate-180",
                    )}
                  />
                </div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* All Apps Link */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/apps"}>
                      <Link href="/apps" className="flex items-center gap-2">
                        <Package className="size-4" />
                        <span>All Apps</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Dynamic Plugin Links */}
                  {!isLoading &&
                    enabledPlugins.length > 0 &&
                    enabledPlugins.map((plugin) => {
                      const Icon = getPluginIcon(plugin.pluginId);
                      const pluginPath = `/apps/${plugin.pluginId}`;
                      const isActive = pathname.startsWith(pluginPath);
                      const pluginName = plugin.manifest?.name || 'Unknown Plugin';

                      return (
                        <SidebarMenuItem key={plugin.pluginId}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                              href={pluginPath}
                              className="flex items-center gap-2"
                              title={pluginName}
                            >
                              <Icon className="size-4" />
                              <span className="truncate">
                                {pluginName}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}

                  {/* Show placeholder when no apps enabled */}
                  {!isLoading && enabledPlugins.length === 0 && (
                    <SidebarMenuItem>
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No apps enabled
                      </div>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator className="my-2" />
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="https://github.com/ParalelnaPolisKE/btcpayserver-companion/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageSquare className="size-4" />
                <span>Send feedback</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="https://github.com/ParalelnaPolisKE/btcpayserver-companion"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="size-4" />
                <span>GitHub</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
