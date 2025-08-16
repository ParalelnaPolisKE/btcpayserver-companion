'use client';

export interface SecurityEvent {
  id: string;
  pluginId: string;
  timestamp: Date;
  type: 'violation' | 'suspicious' | 'blocked' | 'warning';
  category: 'csp' | 'permission' | 'xss' | 'network' | 'resource' | 'behavior';
  message: string;
  details?: any;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PluginMetrics {
  pluginId: string;
  apiCalls: number;
  blockedRequests: number;
  violations: number;
  memoryUsage?: number;
  cpuTime?: number;
  lastActive: Date;
}

export class PluginSecurityMonitor {
  private events: SecurityEvent[] = [];
  private metrics: Map<string, PluginMetrics> = new Map();
  private listeners: Set<(event: SecurityEvent) => void> = new Set();
  private suspiciousPatterns: Map<string, number> = new Map();
  private readonly maxEvents = 1000;
  private readonly suspiciousThreshold = 5;
  
  constructor() {
    this.setupGlobalMonitoring();
  }
  
  private setupGlobalMonitoring() {
    // Monitor CSP violations
    if (typeof window !== 'undefined') {
      window.addEventListener('securitypolicyviolation', (e) => {
        this.recordEvent({
          id: crypto.randomUUID(),
          pluginId: this.detectPluginFromViolation(e),
          timestamp: new Date(),
          type: 'violation',
          category: 'csp',
          message: `CSP violation: ${e.violatedDirective}`,
          details: {
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
            originalPolicy: e.originalPolicy,
            sourceFile: e.sourceFile,
            lineNumber: e.lineNumber,
            columnNumber: e.columnNumber
          },
          severity: this.assessCSPSeverity(e.violatedDirective)
        });
      });
      
      // Monitor unhandled errors
      window.addEventListener('error', (e) => {
        if (this.isPluginError(e)) {
          this.recordEvent({
            id: crypto.randomUUID(),
            pluginId: this.detectPluginFromError(e),
            timestamp: new Date(),
            type: 'warning',
            category: 'behavior',
            message: `Runtime error: ${e.message}`,
            details: {
              filename: e.filename,
              lineno: e.lineno,
              colno: e.colno,
              stack: e.error?.stack
            },
            severity: 'medium'
          });
        }
      });
      
      // Monitor resource timing for unusual patterns
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.analyzeResourceTiming(entry as PerformanceResourceTiming);
            }
          }
        });
        
        observer.observe({ entryTypes: ['resource'] });
      }
    }
  }
  
  private detectPluginFromViolation(e: SecurityPolicyViolationEvent): string {
    // Try to detect which plugin caused the violation
    if (e.sourceFile?.includes('/apps/')) {
      const match = e.sourceFile.match(/\/apps\/([^\/]+)/);
      if (match) return match[1];
    }
    return 'unknown';
  }
  
  private detectPluginFromError(e: ErrorEvent): string {
    if (e.filename?.includes('/apps/')) {
      const match = e.filename.match(/\/apps\/([^\/]+)/);
      if (match) return match[1];
    }
    return 'unknown';
  }
  
  private isPluginError(e: ErrorEvent): boolean {
    return e.filename?.includes('/apps/') || false;
  }
  
  private assessCSPSeverity(directive: string): 'critical' | 'high' | 'medium' | 'low' {
    const criticalDirectives = ['script-src', 'object-src', 'base-uri'];
    const highDirectives = ['style-src', 'frame-src', 'connect-src'];
    
    if (criticalDirectives.some(d => directive.includes(d))) return 'critical';
    if (highDirectives.some(d => directive.includes(d))) return 'high';
    return 'medium';
  }
  
  private analyzeResourceTiming(entry: PerformanceResourceTiming) {
    // Check for suspicious network patterns
    const url = new URL(entry.name, window.location.origin);
    
    // Check if it's an external request from a plugin context
    if (this.isPluginContext() && !this.isAllowedDomain(url.hostname)) {
      this.recordEvent({
        id: crypto.randomUUID(),
        pluginId: this.getCurrentPluginId(),
        timestamp: new Date(),
        type: 'suspicious',
        category: 'network',
        message: `Unauthorized network request to ${url.hostname}`,
        details: {
          url: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize
        },
        severity: 'high'
      });
    }
    
    // Check for unusually large transfers (potential data exfiltration)
    if (entry.transferSize > 10 * 1024 * 1024) { // 10MB
      this.recordEvent({
        id: crypto.randomUUID(),
        pluginId: this.getCurrentPluginId(),
        timestamp: new Date(),
        type: 'suspicious',
        category: 'network',
        message: `Large data transfer detected (${(entry.transferSize / 1024 / 1024).toFixed(2)} MB)`,
        details: {
          url: entry.name,
          transferSize: entry.transferSize
        },
        severity: 'medium'
      });
    }
  }
  
  private isPluginContext(): boolean {
    return window.location.pathname.startsWith('/apps/');
  }
  
  private getCurrentPluginId(): string {
    const match = window.location.pathname.match(/\/apps\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }
  
  private isAllowedDomain(hostname: string): boolean {
    const allowedDomains = [
      window.location.hostname,
      'btcpayserver.org',
      'api.btcpayserver.org'
    ];
    
    return allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  }
  
  recordEvent(event: SecurityEvent, skipPatternCheck = false) {
    // Add to events list
    this.events.push(event);
    
    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
    
    // Update metrics
    this.updateMetrics(event);
    
    // Check for suspicious patterns (unless explicitly skipped to prevent recursion)
    if (!skipPatternCheck && event.category !== 'behavior') {
      this.detectSuspiciousPatterns(event);
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener(event));
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security Monitor]', event);
    }
  }
  
  private updateMetrics(event: SecurityEvent) {
    const metrics = this.metrics.get(event.pluginId) || {
      pluginId: event.pluginId,
      apiCalls: 0,
      blockedRequests: 0,
      violations: 0,
      lastActive: new Date()
    };
    
    if (event.type === 'violation') metrics.violations++;
    if (event.type === 'blocked') metrics.blockedRequests++;
    
    metrics.lastActive = new Date();
    this.metrics.set(event.pluginId, metrics);
  }
  
  private detectSuspiciousPatterns(event: SecurityEvent) {
    const key = `${event.pluginId}-${event.category}`;
    const count = (this.suspiciousPatterns.get(key) || 0) + 1;
    this.suspiciousPatterns.set(key, count);
    
    // Check if threshold exceeded
    if (count >= this.suspiciousThreshold) {
      // Pass true for skipPatternCheck to prevent infinite recursion
      this.recordEvent({
        id: crypto.randomUUID(),
        pluginId: event.pluginId,
        timestamp: new Date(),
        type: 'blocked',
        category: 'behavior',
        message: `Plugin exhibiting suspicious behavior pattern (${event.category})`,
        details: {
          pattern: event.category,
          occurrences: count
        },
        severity: 'critical'
      }, true); // Skip pattern check to prevent recursion
      
      // Reset counter
      this.suspiciousPatterns.set(key, 0);
      
      // Could trigger plugin suspension here
      this.suspendPlugin(event.pluginId);
    }
  }
  
  private suspendPlugin(pluginId: string) {
    // Emit event that can be caught by the plugin manager
    window.dispatchEvent(new CustomEvent('plugin-suspended', {
      detail: { pluginId, reason: 'suspicious-behavior' }
    }));
  }
  
  subscribe(listener: (event: SecurityEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  getEvents(pluginId?: string, limit = 100): SecurityEvent[] {
    let events = pluginId 
      ? this.events.filter(e => e.pluginId === pluginId)
      : this.events;
    
    return events.slice(-limit);
  }
  
  getMetrics(pluginId: string): PluginMetrics | undefined {
    return this.metrics.get(pluginId);
  }
  
  getAllMetrics(): PluginMetrics[] {
    return Array.from(this.metrics.values());
  }
  
  clearEvents(pluginId?: string) {
    if (pluginId) {
      this.events = this.events.filter(e => e.pluginId !== pluginId);
    } else {
      this.events = [];
    }
  }
  
  generateReport(pluginId?: string): string {
    const events = pluginId 
      ? this.events.filter(e => e.pluginId === pluginId)
      : this.events;
    
    const report = [
      '# Security Monitoring Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `Total Events: ${events.length}`,
      `Critical: ${events.filter(e => e.severity === 'critical').length}`,
      `High: ${events.filter(e => e.severity === 'high').length}`,
      `Medium: ${events.filter(e => e.severity === 'medium').length}`,
      `Low: ${events.filter(e => e.severity === 'low').length}`,
      '',
      '## Events by Type',
      `Violations: ${events.filter(e => e.type === 'violation').length}`,
      `Suspicious: ${events.filter(e => e.type === 'suspicious').length}`,
      `Blocked: ${events.filter(e => e.type === 'blocked').length}`,
      `Warnings: ${events.filter(e => e.type === 'warning').length}`,
      '',
      '## Recent Events',
      ...events.slice(-10).map(e => 
        `- [${e.timestamp.toISOString()}] ${e.severity.toUpperCase()}: ${e.message} (${e.pluginId})`
      )
    ];
    
    return report.join('\n');
  }
}

// Singleton instance
let monitorInstance: PluginSecurityMonitor | null = null;

export function getSecurityMonitor(): PluginSecurityMonitor {
  if (!monitorInstance && typeof window !== 'undefined') {
    monitorInstance = new PluginSecurityMonitor();
  }
  return monitorInstance!;
}