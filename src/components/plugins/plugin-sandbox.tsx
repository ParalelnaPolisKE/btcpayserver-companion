"use client";

import { AlertTriangle, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PluginManifest } from "@/types/plugin";

interface PluginSandboxProps {
  pluginId: string;
  manifest: PluginManifest;
  pluginContent: string;
  settings?: Record<string, any>;
  onSecurityViolation?: (violation: SecurityViolation) => void;
}

interface SecurityViolation {
  type: "csp" | "permission" | "xss" | "access";
  message: string;
  timestamp: Date;
  details?: any;
}

interface PluginMessage {
  type: "ready" | "request" | "error" | "log";
  action?: string;
  data?: any;
  requestId?: string;
}

export function PluginSandbox({
  pluginId,
  manifest,
  pluginContent,
  settings,
  onSecurityViolation,
}: PluginSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);
  const _messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());

  // Generate a secure sandbox HTML with strict CSP
  const generateSandboxHTML = () => {
    const nonce = crypto.randomUUID();

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'nonce-${nonce}';
    style-src 'unsafe-inline';
    img-src data: https:;
    connect-src 'none';
    font-src data:;
    object-src 'none';
    media-src 'none';
    frame-src 'none';
    base-uri 'none';
    form-action 'none';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  ">
  <title>Plugin: ${manifest.name}</title>
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      background: transparent;
    }
    .error {
      color: #ef4444;
      padding: 12px;
      background: #fee;
      border-radius: 6px;
      margin: 12px 0;
    }
  </style>
</head>
<body>
  <div id="plugin-root"></div>
  <script nonce="${nonce}">
    // Plugin Security Context
    (function() {
      'use strict';
      
      // Freeze critical objects to prevent tampering
      Object.freeze(Object.prototype);
      Object.freeze(Array.prototype);
      Object.freeze(Function.prototype);
      
      // Remove dangerous globals
      delete window.eval;
      delete window.Function;
      delete window.WebAssembly;
      delete window.importScripts;
      
      // Override potentially dangerous APIs
      const blockedAPIs = [
        'localStorage',
        'sessionStorage',
        'indexedDB',
        'caches',
        'crypto',
        'Notification',
        'geolocation',
        'clipboard',
        'bluetooth',
        'usb',
        'serial',
        'hid',
        'nfc',
        'wakeLock',
        'share',
        'mediaDevices',
        'getUserMedia',
        'requestMIDIAccess',
        'requestMediaKeySystemAccess',
        'PaymentRequest',
        'Credential',
        'PasswordCredential',
        'PublicKeyCredential'
      ];
      
      blockedAPIs.forEach(api => {
        if (api in window) {
          Object.defineProperty(window, api, {
            get() {
              throw new Error(\`Access to \${api} is blocked for security reasons\`);
            },
            configurable: false
          });
        }
        
        if (api in navigator) {
          Object.defineProperty(navigator, api, {
            get() {
              throw new Error(\`Access to navigator.\${api} is blocked for security reasons\`);
            },
            configurable: false
          });
        }
      });
      
      // Create secure communication channel
      const pluginAPI = {
        id: '${pluginId}',
        manifest: ${JSON.stringify(manifest)},
        settings: ${JSON.stringify(settings || {})},
        
        // Send message to parent
        sendMessage(type, action, data) {
          parent.postMessage({
            source: 'plugin',
            pluginId: '${pluginId}',
            type,
            action,
            data,
            timestamp: Date.now()
          }, '*');
        },
        
        // Request data from parent (with permission check)
        request(action, data) {
          return new Promise((resolve, reject) => {
            const requestId = crypto.randomUUID();
            const timeout = setTimeout(() => {
              delete window.__pendingRequests[requestId];
              reject(new Error('Request timeout'));
            }, 5000);
            
            window.__pendingRequests = window.__pendingRequests || {};
            window.__pendingRequests[requestId] = { resolve, reject, timeout };
            
            this.sendMessage('request', action, { ...data, requestId });
          });
        },
        
        // Log messages (for debugging, monitored by parent)
        log(...args) {
          this.sendMessage('log', 'console', { args });
          console.log('[Plugin ${pluginId}]', ...args);
        },
        
        error(...args) {
          this.sendMessage('error', 'console', { args });
          console.error('[Plugin ${pluginId}]', ...args);
        }
      };
      
      // Make plugin API available
      window.BTCPayPlugin = Object.freeze(pluginAPI);
      
      // Handle messages from parent
      window.addEventListener('message', (event) => {
        if (event.data.source !== 'parent') return;
        
        const { type, requestId, data, error } = event.data;
        
        if (type === 'response' && requestId && window.__pendingRequests?.[requestId]) {
          const { resolve, reject, timeout } = window.__pendingRequests[requestId];
          clearTimeout(timeout);
          delete window.__pendingRequests[requestId];
          
          if (error) {
            reject(new Error(error));
          } else {
            resolve(data);
          }
        }
      });
      
      // Monitor for security violations
      window.addEventListener('error', (event) => {
        pluginAPI.sendMessage('error', 'runtime', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });
      
      // Prevent navigation
      window.addEventListener('beforeunload', (e) => {
        e.preventDefault();
        e.returnValue = '';
      });
      
      // Block form submissions
      document.addEventListener('submit', (e) => {
        e.preventDefault();
        pluginAPI.error('Form submission blocked for security');
      });
      
      // Signal that sandbox is ready
      pluginAPI.sendMessage('ready', null, null);
    })();
  </script>
  <script nonce="${nonce}">
    // Plugin code execution in sandboxed context
    try {
      ${pluginContent}
    } catch (error) {
      document.getElementById('plugin-root').innerHTML = 
        '<div class="error">Plugin failed to load: ' + error.message + '</div>';
      window.BTCPayPlugin.error('Plugin execution failed:', error);
    }
  </script>
</body>
</html>`;
  };

  // Handle plugin requests with permission checking
  const handlePluginRequest = async (
    message: PluginMessage & { data: any },
  ) => {
    const { action, data } = message;
    const requestId = data?.requestId;

    if (!requestId || !action) return;

    try {
      // Check if plugin has permission for this action
      const hasPermission = checkPermission(action);

      if (!hasPermission) {
        throw new Error(`Permission denied for action: ${action}`);
      }

      // Process allowed actions
      let responseData: any = null;

      switch (action) {
        case "getInvoices":
          // Only if plugin has btcpay.store.canviewinvoices permission
          if (
            manifest.requiredPermissions?.some(
              (p) => p.permission === "btcpay.store.canviewinvoices",
            )
          ) {
            // This would call the actual API through a secure channel
            responseData = { invoices: [] }; // Placeholder
          }
          break;

        case "getSettings":
          responseData = settings;
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Send response back to plugin
      iframeRef.current?.contentWindow?.postMessage(
        {
          source: "parent",
          type: "response",
          requestId,
          data: responseData,
        },
        "*",
      );
    } catch (error) {
      // Send error back to plugin
      iframeRef.current?.contentWindow?.postMessage(
        {
          source: "parent",
          type: "response",
          requestId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "*",
      );

      // Log security violation
      onSecurityViolation?.({
        type: "permission",
        message: `Unauthorized request: ${action}`,
        timestamp: new Date(),
        details: { action, data },
      });
    }
  };

  // Check if plugin has permission for an action
  const checkPermission = (action: string): boolean => {
    const permissionMap: Record<string, string> = {
      getInvoices: "btcpay.store.canviewinvoices",
      updateInvoice: "btcpay.store.canmodifyinvoices",
      getStore: "btcpay.store.canviewstoresettings",
      // Add more mappings as needed
    };

    const requiredPermission = permissionMap[action];
    if (!requiredPermission) return false;

    return (
      manifest.requiredPermissions?.some(
        (p) => p.permission === requiredPermission,
      ) || false
    );
  };

  // Handle messages from the sandboxed plugin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify message origin
      if (event.source !== iframeRef.current?.contentWindow) return;

      const message = event.data as PluginMessage & {
        source: string;
        pluginId: string;
        timestamp: number;
      };

      // Validate message structure
      if (message.source !== "plugin" || message.pluginId !== pluginId) return;

      switch (message.type) {
        case "ready":
          setIsLoading(false);
          break;

        case "request":
          if (message.data) {
            handlePluginRequest(message as PluginMessage & { data: any });
          }
          break;

        case "error":
          console.error(`[Plugin ${pluginId}]`, message.data);
          if (message.action === "runtime") {
            onSecurityViolation?.({
              type: "xss",
              message: `Runtime error in plugin: ${message.data.message}`,
              timestamp: new Date(),
              details: message.data,
            });
          }
          break;

        case "log":
          console.log(`[Plugin ${pluginId}]`, ...message.data.args);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pluginId, onSecurityViolation, handlePluginRequest]);

  // Initialize iframe with sandboxed content
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generateSandboxHTML());
        doc.close();
      }
    }
  }, [generateSandboxHTML]);

  return (
    <div className="plugin-sandbox-container">
      {error && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="sandbox-header mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Plugin running in secure sandbox</span>
      </div>

      <iframe
        ref={iframeRef}
        className="w-full min-h-[600px] border rounded-lg bg-background"
        title={`Plugin: ${manifest.name}`}
        sandbox="allow-scripts"
        style={{
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "8px",
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading plugin...</p>
          </div>
        </div>
      )}
    </div>
  );
}
