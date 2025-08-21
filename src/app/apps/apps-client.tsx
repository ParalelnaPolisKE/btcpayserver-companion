"use client";

import * as Icons from "lucide-react";
import {
  CheckCircle,
  type LucideIcon,
  Package,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AvailablePlugin } from "@/app/actions/plugins";
import PluginDropzone from "@/components/apps/plugin-dropzone";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { usePlugins } from "@/contexts/plugins-context";
import {
  getAvailablePluginsClient,
  removePluginFolderClient,
} from "@/services/plugin-client";
import { uploadPluginZip } from "@/services/plugin-upload-client";
import type { PluginManifest } from "@/types/plugin";

// Helper function to get icon component from string name
function getIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return Package;

  // Convert kebab-case or snake_case to PascalCase for icon component name
  const pascalCase = iconName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  // Try to find the icon in the Icons namespace
  const IconComponent = (Icons as any)[pascalCase];

  // Return the icon if found, otherwise default to Package
  return IconComponent || Package;
}

export default function AppsClient() {
  const {
    installedPlugins,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
    isLoading,
    refreshPlugins,
  } = usePlugins();
  const [availablePlugins, setAvailablePlugins] = useState<AvailablePlugin[]>(
    [],
  );
  const [pluginsLoading, setPluginsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [pluginToRemove, setPluginToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Dynamically load available plugins
  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const plugins = await getAvailablePluginsClient();
        setAvailablePlugins(plugins);
      } catch (error) {
        console.error("Failed to load available plugins:", error);
        toast.error("Failed to load available plugins");
      } finally {
        setPluginsLoading(false);
      }
    };
    loadPlugins();
  }, []);

  const handleFileUpload = async (file: File) => {
    const result = await uploadPluginZip(file);

    if (result.success) {
      toast.success(result.message);
      // Refresh the plugins list
      const plugins = await getAvailablePluginsClient();
      setAvailablePlugins(plugins);
      await refreshPlugins();
      setUploadDialogOpen(false);
    } else {
      throw new Error(result.message);
    }
  };

  const handleInstall = async (plugin: AvailablePlugin) => {
    try {
      // Convert AvailablePlugin to PluginManifest format
      const manifest: PluginManifest = {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        icon: plugin.icon,
        routes: plugin.routes
          ? {
              ...plugin.routes,
              main: plugin.routes.main || "/",
            }
          : {
              main: "/",
            },
        requiredPermissions: plugin.requiredPermissions,
        isPaid: plugin.isPaid || false,
        price: plugin.price,
        category: plugin.category,
        tags: plugin.tags,
      };
      await installPlugin(manifest);
      toast.success(`${plugin.name} installed successfully`);
    } catch (_error) {
      toast.error(`Failed to install ${plugin.name}`);
    }
  };

  const handleUninstall = async (pluginId: string, pluginName: string) => {
    try {
      await uninstallPlugin(pluginId);
      toast.success(`${pluginName} uninstalled successfully`);
    } catch (error) {
      console.error("Failed to uninstall plugin:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to uninstall ${pluginName}`;

      // Show specific message for built-in plugins
      if (errorMessage.includes("built-in")) {
        toast.error("Built-in apps cannot be uninstalled");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleToggle = async (
    pluginId: string,
    enabled: boolean,
    pluginName: string,
  ) => {
    try {
      await togglePlugin(pluginId, enabled);
      toast.success(
        enabled ? `${pluginName} enabled` : `${pluginName} disabled`,
      );
    } catch (_error) {
      toast.error(`Failed to update ${pluginName} status`);
    }
  };

  const handleRemoveClick = (pluginId: string, pluginName: string) => {
    setPluginToRemove({ id: pluginId, name: pluginName });
    setRemoveConfirmOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!pluginToRemove) return;

    try {
      const result = await removePluginFolderClient(pluginToRemove.id);
      if (result.success) {
        toast.success(`${pluginToRemove.name} removed successfully`);
        // Refresh the plugins list
        const plugins = await getAvailablePluginsClient();
        setAvailablePlugins(plugins);
      } else {
        toast.error(result.message);
      }
    } catch (_error) {
      toast.error(`Failed to remove ${pluginToRemove.name}`);
    } finally {
      setRemoveConfirmOpen(false);
      setPluginToRemove(null);
    }
  };

  // Merge installed status into available plugins
  const mergedPlugins = availablePlugins.map((plugin) => {
    const installed = installedPlugins.find((p) => p.pluginId === plugin.id);
    return {
      ...plugin,
      isInstalled: !!installed,
      enabled: installed?.config.enabled || false,
      installedAt: installed?.config.installedAt,
    };
  });

  if (isLoading || pluginsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Apps</h1>
          <p className="text-muted-foreground">
            Extend your BTCPayServer Companion with powerful apps and
            integrations
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>Upload Plugin</Button>
      </div>

      {/* Installed Apps */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Installed Apps</h2>
        {installedPlugins.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No apps installed yet. Browse available apps below.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {installedPlugins.map((plugin) => {
              // Skip if manifest is missing
              if (!plugin.manifest) return null;

              // Get the icon component from plugin manifest
              const Icon = getIconComponent(plugin.manifest.icon);
              return (
                <Card key={plugin.pluginId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-lg">
                          {plugin.manifest.name}
                        </CardTitle>
                        {plugin.source === "uploaded" && (
                          <Badge variant="outline" className="text-xs ml-2">
                            Uploaded
                          </Badge>
                        )}
                        {plugin.source === "marketplace" && (
                          <Badge variant="outline" className="text-xs ml-2">
                            Marketplace
                          </Badge>
                        )}
                      </div>
                      <Switch
                        checked={plugin.config.enabled}
                        onCheckedChange={(checked) =>
                          handleToggle(
                            plugin.pluginId,
                            checked,
                            plugin.manifest.name,
                          )
                        }
                      />
                    </div>
                    <CardDescription>
                      {plugin.manifest.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Version {plugin.manifest.version}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {plugin.config.enabled && (
                      <Link href={`/apps/${plugin.pluginId}`}>
                        <Button size="sm">Open</Button>
                      </Link>
                    )}
                    {plugin.manifest.routes?.settings && (
                      <Link href={`/apps/${plugin.pluginId}/settings`}>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Settings
                        </Button>
                      </Link>
                    )}
                    {/* Only show uninstall for non-builtin plugins */}
                    {plugin.source !== "builtin" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleUninstall(plugin.pluginId, plugin.manifest.name)
                        }
                      >
                        Uninstall
                      </Button>
                    )}
                    {/* Show badge for built-in plugins */}
                    {plugin.source === "builtin" && (
                      <Badge variant="secondary" className="text-xs">
                        Built-in
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Apps */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Apps</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mergedPlugins
            .filter((plugin) => !plugin.isInstalled)
            .map((plugin) => {
              const Icon = getIconComponent(plugin.icon);
              return (
                <Card key={plugin.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                      </div>
                      {plugin.isPaid && (
                        <Badge variant="secondary">${plugin.price}</Badge>
                      )}
                    </div>
                    <CardDescription>{plugin.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Version {plugin.version}</span>
                      <span>•</span>
                      <span>By {plugin.author}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleInstall(plugin)}
                      disabled={plugin.isInstalled || plugin.isPaid}
                    >
                      {plugin.isInstalled ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Installed
                        </>
                      ) : plugin.isPaid ? (
                        <>Coming Soon (${plugin.price})</>
                      ) : (
                        "Install"
                      )}
                    </Button>
                    {!plugin.isInstalled && !plugin.isPaid && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          handleRemoveClick(plugin.id, plugin.name)
                        }
                        title="Remove plugin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Upload Plugin Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Plugin</DialogTitle>
            <DialogDescription>
              Upload a plugin as a ZIP file. The plugin must contain a
              manifest.json file and follow the plugin structure.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <PluginDropzone onUpload={handleFileUpload} disabled={false} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Plugin Confirmation Dialog */}
      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Plugin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{pluginToRemove?.name}"? This
              will permanently delete the plugin folder from your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPluginToRemove(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
