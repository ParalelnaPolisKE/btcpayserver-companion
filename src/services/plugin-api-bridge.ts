"use client";

import type { PluginManifest } from "@/types/plugin";

export interface PluginAPIRequest {
  action: string;
  params?: any;
  permissions?: string[];
}

export interface PluginAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class PluginAPIBridge {
  private readonly manifest: PluginManifest;
  private readonly allowedActions: Map<string, string[]>;
  private rateLimits: Map<string, { count: number; resetTime: number }>;

  constructor(manifest: PluginManifest) {
    this.manifest = manifest;
    this.allowedActions = this.buildActionPermissionMap();
    this.rateLimits = new Map();
  }

  private buildActionPermissionMap(): Map<string, string[]> {
    const map = new Map<string, string[]>();

    // Define which permissions are required for each action
    map.set("getInvoices", ["btcpay.store.canviewinvoices"]);
    map.set("getInvoice", ["btcpay.store.canviewinvoices"]);
    map.set("createInvoice", ["btcpay.store.cancreateinvoice"]);
    map.set("updateInvoice", ["btcpay.store.canmodifyinvoices"]);
    map.set("getStoreInfo", ["btcpay.store.canviewstoresettings"]);
    map.set("getPaymentMethods", ["btcpay.store.canviewstoresettings"]);
    map.set("getApps", ["btcpay.store.canviewstoresettings"]);

    // Plugin settings are always allowed for the plugin itself
    map.set("getPluginSettings", []);
    map.set("savePluginSettings", []);

    return map;
  }

  async handleRequest(request: PluginAPIRequest): Promise<PluginAPIResponse> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(request.action)) {
        return {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        };
      }

      // Validate action exists
      const requiredPermissions = this.allowedActions.get(request.action);
      if (requiredPermissions === undefined) {
        return {
          success: false,
          error: `Unknown action: ${request.action}`,
        };
      }

      // Check permissions
      if (!this.hasPermissions(requiredPermissions)) {
        return {
          success: false,
          error: `Permission denied. Required: ${requiredPermissions.join(", ")}`,
        };
      }

      // Sanitize parameters
      const sanitizedParams = this.sanitizeParams(request.params);

      // Execute action
      const result = await this.executeAction(request.action, sanitizedParams);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`Plugin API error for ${this.manifest.id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  private checkRateLimit(action: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(action);

    // Rate limits per action
    const limits: Record<string, { maxRequests: number; windowMs: number }> = {
      getInvoices: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
      createInvoice: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
      updateInvoice: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
      default: { maxRequests: 30, windowMs: 60000 }, // 30 per minute default
    };

    const actionLimit = limits[action] || limits.default;

    if (!limit || now > limit.resetTime) {
      // Reset or initialize
      this.rateLimits.set(action, {
        count: 1,
        resetTime: now + actionLimit.windowMs,
      });
      return true;
    }

    if (limit.count >= actionLimit.maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  private hasPermissions(required: string[]): boolean {
    if (required.length === 0) return true;

    const pluginPermissions = this.manifest.requiredPermissions || [];
    const grantedPermissions = pluginPermissions
      .filter((p) => p.required || p.permission)
      .map((p) => p.permission);

    return required.every((perm) => grantedPermissions.includes(perm));
  }

  private sanitizeParams(params: any): any {
    if (!params) return {};

    // Deep clone to avoid mutations
    const sanitized = JSON.parse(JSON.stringify(params));

    // Remove any potentially dangerous fields
    const dangerousKeys = [
      "__proto__",
      "constructor",
      "prototype",
      "eval",
      "Function",
      "setTimeout",
      "setInterval",
    ];

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== "object" || obj === null) return obj;

      for (const key of Object.keys(obj)) {
        if (dangerousKeys.includes(key)) {
          delete obj[key];
        } else if (typeof obj[key] === "object") {
          obj[key] = sanitizeObject(obj[key]);
        } else if (typeof obj[key] === "string") {
          // Sanitize strings to prevent XSS
          obj[key] = this.sanitizeString(obj[key]);
        }
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }

  private sanitizeString(str: string): string {
    // Basic XSS prevention
    return str
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      .replace(/`/g, "&#x60;")
      .replace(/=/g, "&#x3D;");
  }

  private async executeAction(action: string, params: any): Promise<any> {
    // This would integrate with your actual BTCPay API client
    // For now, we'll return mock data for demonstration

    switch (action) {
      case "getPluginSettings":
        // Get from IndexedDB or localStorage (sandboxed per plugin)
        return this.getPluginSettings();

      case "savePluginSettings":
        // Save to IndexedDB or localStorage (sandboxed per plugin)
        return this.savePluginSettings(params);

      case "getInvoices":
        // Would call actual BTCPay API with proper authentication
        return this.mockGetInvoices(params);

      default:
        throw new Error(`Action ${action} not implemented`);
    }
  }

  private async getPluginSettings(): Promise<any> {
    const key = `plugin_settings_${this.manifest.id}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  }

  private async savePluginSettings(settings: any): Promise<void> {
    const key = `plugin_settings_${this.manifest.id}`;
    localStorage.setItem(key, JSON.stringify(settings));
  }

  private async mockGetInvoices(_params: any): Promise<any> {
    // Mock implementation
    return {
      invoices: [],
      total: 0,
    };
  }

  // Audit logging
  logAccess(action: string, params: any, result: "success" | "denied") {
    const log = {
      pluginId: this.manifest.id,
      action,
      timestamp: new Date().toISOString(),
      result,
      params: params ? Object.keys(params) : [], // Log param keys only, not values
    };

    // In production, send to monitoring service
    console.log("[Plugin Audit]", log);
  }
}
