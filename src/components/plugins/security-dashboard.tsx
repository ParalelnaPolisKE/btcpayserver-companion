'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Lock, Eye } from 'lucide-react';
import { getSecurityMonitor, SecurityEvent } from '@/services/plugin-security-monitor';
import { usePlugins } from '@/contexts/plugins-context';

export function PluginSecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const { installedPlugins } = usePlugins();
  const monitor = getSecurityMonitor();

  useEffect(() => {
    // Load initial events
    setEvents(monitor.getEvents());

    // Subscribe to new events
    const unsubscribe = monitor.subscribe((event) => {
      setEvents(prev => [...prev.slice(-99), event]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getPluginEvents = (pluginId: string) => {
    return events.filter(e => e.pluginId === pluginId);
  };

  const getPluginMetrics = (pluginId: string) => {
    return monitor.getMetrics(pluginId);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'violation': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'suspicious': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'blocked': return <Lock className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const criticalEvents = events.filter(e => e.severity === 'critical');
  const recentEvents = events.slice(-10).reverse();

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {criticalEvents.length === 0 ? 'Secure' : 'At Risk'}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalEvents.length} critical issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.type === 'blocked').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Malicious attempts blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plugins</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {installedPlugins.filter(p => p.config.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {installedPlugins.length} total installed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalEvents.length > 0 && (
        <Alert className="border-red-600 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Security Issues Detected</AlertTitle>
          <AlertDescription>
            {criticalEvents.length} critical security {criticalEvents.length === 1 ? 'issue' : 'issues'} detected. 
            Review and take action immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Plugin Security Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="plugins">Plugin Status</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Latest security events from all plugins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No security events recorded</p>
                ) : (
                  recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border"
                    >
                      {getEventTypeIcon(event.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{event.message}</p>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Plugin: {event.pluginId}</span>
                          <span>Category: {event.category}</span>
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        {event.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plugins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Security Status</CardTitle>
              <CardDescription>
                Security metrics for each installed plugin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {installedPlugins.map((plugin) => {
                  const pluginEvents = getPluginEvents(plugin.pluginId);
                  const metrics = getPluginMetrics(plugin.pluginId);
                  const hasCritical = pluginEvents.some(e => e.severity === 'critical');
                  
                  return (
                    <div
                      key={plugin.pluginId}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        {hasCritical ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : pluginEvents.length > 0 ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium">{plugin.manifest.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pluginEvents.length} security events
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {metrics && (
                          <div className="text-sm text-muted-foreground">
                            <span>{metrics.apiCalls} API calls</span>
                            {metrics.blockedRequests > 0 && (
                              <span className="ml-2 text-red-600">
                                {metrics.blockedRequests} blocked
                              </span>
                            )}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPlugin(plugin.pluginId)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Permissions</CardTitle>
              <CardDescription>
                Review permissions granted to each plugin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {installedPlugins.map((plugin) => (
                  <div key={plugin.pluginId} className="space-y-2">
                    <h4 className="font-medium">{plugin.manifest.name}</h4>
                    {plugin.manifest.requiredPermissions && plugin.manifest.requiredPermissions.length > 0 ? (
                      <div className="grid gap-2">
                        {plugin.manifest.requiredPermissions.map((perm, idx) => (
                          <div
                            key={idx}
                            className="flex items-start space-x-2 text-sm"
                          >
                            <Badge
                              variant={perm.required ? "default" : "secondary"}
                              className="mt-0.5"
                            >
                              {perm.required ? 'Required' : 'Optional'}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-mono text-xs">{perm.permission}</p>
                              <p className="text-muted-foreground">{perm.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No permissions required</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Report Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            const report = monitor.generateReport();
            const blob = new Blob([report], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `security-report-${new Date().toISOString()}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download Security Report
        </Button>
      </div>
    </div>
  );
}