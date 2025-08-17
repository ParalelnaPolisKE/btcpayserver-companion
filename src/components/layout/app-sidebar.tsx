'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Settings,
  Package,
  ChevronUp,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Github,
  LogOut,
  BarChart3,
  CalendarCheck,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  PieChart,
  QrCode
} from "lucide-react";

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { usePlugins } from "@/contexts/plugins-context";
import { cn } from "@/lib/utils";

// Icon mapping for plugins
const iconMap: Record<string, React.ComponentType<any>> = {
  'financial-analysis': PieChart,
  'event-checkin': QrCode,
  'invoice-management': DollarSign,
  'analytics': TrendingUp,
  'customers': Users,
  'automation': Zap,
};

function getPluginIcon(pluginId: string): React.ComponentType<any> {
  return iconMap[pluginId] || Package;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { installedPlugins, isLoading } = usePlugins();
  const { state } = useSidebar();
  const [appsOpen, setAppsOpen] = React.useState(true);

  // Filter enabled plugins
  const enabledPlugins = installedPlugins.filter(p => p.config.enabled);

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
                  <span className="text-xs text-muted-foreground">Store Management</span>
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
                      !appsOpen && "-rotate-180"
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
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === '/apps'}
                    >
                      <Link href="/apps" className="flex items-center gap-2">
                        <Package className="size-4" />
                        <span>All Apps</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {/* Dynamic Plugin Links */}
                  {!isLoading && enabledPlugins.length > 0 && (
                    <>
                      {enabledPlugins.map((plugin) => {
                        const Icon = getPluginIcon(plugin.pluginId);
                        const pluginPath = `/apps/${plugin.pluginId}`;
                        const isActive = pathname.startsWith(pluginPath);
                        
                        return (
                          <SidebarMenuItem key={plugin.pluginId}>
                            <SidebarMenuButton 
                              asChild 
                              isActive={isActive}
                            >
                              <Link 
                                href={pluginPath} 
                                className="flex items-center gap-2"
                                title={plugin.manifest.name}
                              >
                                <Icon className="size-4" />
                                <span className="truncate">{plugin.manifest.name}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </>
                  )}
                  
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
            <SidebarMenuButton asChild>
              <a 
                href="https://github.com/ParalelnaPolisKE/btcpayserver-companion/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageSquare className="size-4" />
                <span>Send Feedback</span>
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
        
        <SidebarSeparator />
        
        {/* User Menu */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                    <Users className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-sm font-medium">Store Admin</span>
                    <span className="text-xs text-muted-foreground">admin@store.com</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                align="start" 
                className="w-[--radix-dropdown-menu-trigger-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}