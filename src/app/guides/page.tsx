"use client";

export const dynamic = 'force-dynamic';

import {
  BookOpen,
  ChevronLeft,
  Code,
  CreditCard,
  Package,
  Shield,
} from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface GuideSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  sections: GuideSection[];
}

const guides: Guide[] = [
  {
    id: "getting-started",
    title: "Getting Started with BTCPayServer Companion",
    description: "Learn the basics of setting up and using the companion app",
    icon: CreditCard,
    sections: [
      {
        id: "overview",
        title: "Overview",
        content: (
          <div className="space-y-6">
            <p className="leading-relaxed">
              BTCPayServer Companion is a powerful desktop application that enhances your BTCPayServer experience 
              with advanced analytics, plugin management, and offline capabilities.
            </p>
            <p className="leading-relaxed">
              This guide will walk you through the initial setup and help you understand the core features 
              of the companion app.
            </p>
          </div>
        ),
      },
      {
        id: "installation",
        title: "Installation",
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold">Download the App</h4>
            <p>
              BTCPayServer Companion is available for Windows, macOS, and Linux. Download the latest version 
              from our GitHub releases page.
            </p>
            
            <h4 className="font-semibold">System Requirements</h4>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Windows 10 or later / macOS 10.15 or later / Ubuntu 20.04 or later</li>
              <li>4GB RAM minimum (8GB recommended)</li>
              <li>200MB available disk space</li>
              <li>Internet connection for BTCPayServer sync</li>
            </ul>
          </div>
        ),
      },
      {
        id: "configuration",
        title: "Configuration",
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold">Connect to BTCPayServer</h4>
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Navigate to Settings:</strong> Click on the Settings link in the sidebar or go to the Settings page
              </li>
              <li>
                <strong>Enter BTCPayServer URL:</strong> Input your BTCPayServer instance URL (e.g., https://btcpay.yourdomain.com)
              </li>
              <li>
                <strong>Add API Key:</strong> Generate an API key from your BTCPayServer dashboard with the following permissions:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm">
                  <li>View invoices</li>
                  <li>View store settings</li>
                  <li>View apps</li>
                </ul>
              </li>
              <li>
                <strong>Select Store:</strong> Choose the store you want to connect to from the dropdown
              </li>
              <li>
                <strong>Test Connection:</strong> Click "Test Connection" to verify your settings
              </li>
            </ol>

            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="text-sm leading-relaxed">
                <strong className="font-semibold">Tip:</strong> You can work in offline mode without a BTCPayServer connection. 
                The app will use mock data for testing and demonstration purposes.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "first-steps",
        title: "First Steps",
        content: (
          <div className="space-y-4">
            <p>Once connected, here are the recommended first steps:</p>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <h5 className="font-semibold">Enable Financial Analysis App</h5>
                  <p className="text-sm text-muted-foreground">
                    Go to Apps and enable the Financial Analysis plugin to start tracking revenue and analytics
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <h5 className="font-semibold">Configure Store Settings</h5>
                  <p className="text-sm text-muted-foreground">
                    Set up multiple stores if needed and configure monthly expenses for profit calculations
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div>
                  <h5 className="font-semibold">Explore the Dashboard</h5>
                  <p className="text-sm text-muted-foreground">
                    Check your dashboard for an overview of your BTCPayServer status and quick stats
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "managing-apps",
    title: "Installing and Managing Apps",
    description: "Discover how to extend functionality with apps",
    icon: Package,
    sections: [
      {
        id: "overview",
        title: "Apps Overview",
        content: (
          <div className="space-y-4">
            <p>
              Apps (also called plugins) extend the functionality of BTCPayServer Companion. 
              They run in a secure, sandboxed environment and can access BTCPayServer data through a controlled API.
            </p>
            <p>
              The companion app comes with several built-in apps and supports uploading custom plugins.
            </p>
          </div>
        ),
      },
      {
        id: "built-in-apps",
        title: "Built-in Apps",
        content: (
          <div className="space-y-4">
            <p>BTCPayServer Companion includes these pre-installed apps:</p>
            
            <div className="space-y-3">
              <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <h4 className="mb-2 font-semibold">Financial Analysis</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Comprehensive revenue analytics, profit calculations, and financial projections. 
                  Track payment methods, monitor trends, and export reports.
                </p>
              </div>
              
              <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <h4 className="mb-2 font-semibold">Event Check-in</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  QR code-based event management system. Scan tickets, track attendance, 
                  and manage event entry with offline support.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "enabling-apps",
        title: "Enabling Apps",
        content: (
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Navigate to Apps:</strong> Click on "Apps" in the sidebar
              </li>
              <li>
                <strong>Find the App:</strong> Browse the available apps in the grid
              </li>
              <li>
                <strong>Enable the App:</strong> Toggle the switch on the app card to enable it
              </li>
              <li>
                <strong>Access the App:</strong> Enabled apps appear in the sidebar for quick access
              </li>
              <li>
                <strong>Configure Settings:</strong> Click the settings icon on the app card to configure app-specific settings
              </li>
            </ol>
            
            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/30">
              <p className="text-sm leading-relaxed">
                <strong className="font-semibold">Note:</strong> Some apps may require additional configuration, such as API permissions 
                or store selection, before they can be fully functional.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "custom-apps",
        title: "Installing Custom Apps",
        content: (
          <div className="space-y-4">
            <p>Advanced users can install custom plugins:</p>
            
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Prepare the Plugin:</strong> Ensure your plugin is packaged as a ZIP file with a valid manifest.json
              </li>
              <li>
                <strong>Upload the Plugin:</strong> On the Apps page, click "Upload Plugin" or drag and drop the ZIP file
              </li>
              <li>
                <strong>Security Scan:</strong> The plugin will be automatically scanned for security issues
              </li>
              <li>
                <strong>Review Permissions:</strong> Check what permissions the plugin requests
              </li>
              <li>
                <strong>Install:</strong> If the scan passes, the plugin will be installed and available to enable
              </li>
            </ol>
            
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm leading-relaxed">
                <strong className="font-semibold">Warning:</strong> Only install plugins from trusted sources. Malicious plugins 
                could potentially access your BTCPayServer data.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "managing-apps",
        title: "Managing Installed Apps",
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold">App Management Options</h4>
            
            <ul className="space-y-3">
              <li>
                <strong>Disable/Enable:</strong> Toggle apps on/off without uninstalling
              </li>
              <li>
                <strong>Configure:</strong> Access app-specific settings through the settings icon
              </li>
              <li>
                <strong>Update:</strong> When updates are available, you'll see an update button on the app card
              </li>
              <li>
                <strong>Uninstall:</strong> Remove apps you no longer need (built-in apps cannot be uninstalled)
              </li>
            </ul>
            
            <h4 className="font-semibold mt-6">Storage Management</h4>
            <p className="text-sm">
              Apps store data locally using IndexedDB. You can clear app data from the app's settings page 
              if you need to reset an app or free up space.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "plugin-security",
    title: "Understanding Plugin Security",
    description: "Learn how we protect your server from malicious plugins",
    icon: Shield,
    sections: [
      {
        id: "overview",
        title: "Security Overview",
        content: (
          <div className="space-y-4">
            <p>
              BTCPayServer Companion implements multiple layers of security to protect your BTCPayServer 
              instance and cryptocurrency operations from potentially malicious plugins.
            </p>
            <p>
              Our security model is based on the principle of least privilege - plugins only get access 
              to what they explicitly need and nothing more.
            </p>
          </div>
        ),
      },
      {
        id: "sandboxing",
        title: "Plugin Sandboxing",
        content: (
          <div className="space-y-4">
            <p>
              All plugins run in isolated sandbox environments using iframes with strict Content Security Policies (CSP).
            </p>
            
            <h4 className="font-semibold">Sandbox Restrictions</h4>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>No direct access to the main application's JavaScript context</li>
              <li>No access to cookies or local storage of the main app</li>
              <li>No ability to make direct network requests without permission</li>
              <li>No access to file system or native APIs</li>
              <li>All communication happens through a controlled message-passing API</li>
            </ul>
            
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
              <p className="text-sm leading-relaxed">
                <strong className="font-semibold">Result:</strong> Even if a plugin contains malicious code, it cannot access 
                your BTCPayServer API keys, cryptocurrency wallets, or sensitive data.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "permissions",
        title: "Permission System",
        content: (
          <div className="space-y-4">
            <p>
              Plugins must declare required permissions in their manifest file. Users can review 
              these permissions before installation.
            </p>
            
            <h4 className="font-semibold">Common Permissions</h4>
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <strong className="text-sm font-semibold">btcpay:read</strong>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Read access to BTCPayServer data (invoices, store info)
                </p>
              </div>
              
              <div className="rounded-lg border bg-muted/30 p-4">
                <strong className="text-sm font-semibold">btcpay:write</strong>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Create and modify BTCPayServer resources (requires additional confirmation)
                </p>
              </div>
              
              <div className="rounded-lg border bg-muted/30 p-4">
                <strong className="text-sm font-semibold">storage</strong>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Store data locally in the browser (limited to 50MB per plugin)
                </p>
              </div>
              
              <div className="rounded-lg border bg-muted/30 p-4">
                <strong className="text-sm font-semibold">network</strong>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Make network requests to approved domains only
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "code-scanning",
        title: "Automatic Code Scanning",
        content: (
          <div className="space-y-4">
            <p>
              Before installation, all plugins are automatically scanned for suspicious patterns 
              and potentially malicious code.
            </p>
            
            <h4 className="font-semibold">What We Scan For</h4>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Attempts to access sensitive APIs (crypto, filesystem, etc.)</li>
              <li>Obfuscated or encrypted code that hides functionality</li>
              <li>Known malicious patterns and signatures</li>
              <li>Attempts to bypass sandbox restrictions</li>
              <li>Excessive permission requests</li>
              <li>Hidden network requests or data exfiltration attempts</li>
            </ul>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm">
                <strong>Transparency:</strong> Scan results are shown before installation, 
                including any warnings or concerns found.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "runtime-monitoring",
        title: "Runtime Monitoring",
        content: (
          <div className="space-y-4">
            <p>
              Even after installation, plugins are continuously monitored for suspicious behavior.
            </p>
            
            <h4 className="font-semibold">Monitoring Features</h4>
            <div className="space-y-3">
              <div className="flex gap-4 rounded-lg bg-muted/20 p-4">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm font-semibold">API Call Monitoring</strong>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    All API calls are logged and rate-limited to prevent abuse
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 rounded-lg bg-muted/20 p-4">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm font-semibold">Resource Usage Tracking</strong>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    CPU and memory usage is monitored to detect mining or DoS attempts
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 rounded-lg bg-muted/20 p-4">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm font-semibold">Network Traffic Analysis</strong>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    Unexpected network requests are blocked and reported
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 rounded-lg bg-muted/20 p-4">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm font-semibold">Automatic Suspension</strong>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    Plugins exhibiting malicious behavior are automatically disabled
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "best-practices",
        title: "Security Best Practices",
        content: (
          <div className="space-y-4">
            <p>Follow these guidelines to maintain maximum security:</p>
            
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Verify Plugin Sources:</strong> Only install plugins from trusted developers or official sources
              </li>
              <li>
                <strong>Review Permissions:</strong> Always check what permissions a plugin requests before installation
              </li>
              <li>
                <strong>Keep Updated:</strong> Update BTCPayServer Companion and plugins regularly for security patches
              </li>
              <li>
                <strong>Monitor Activity:</strong> Regularly check the security dashboard for any warnings
              </li>
              <li>
                <strong>Limit Permissions:</strong> Only grant plugins the minimum permissions they need
              </li>
              <li>
                <strong>Remove Unused Plugins:</strong> Uninstall plugins you're no longer using
              </li>
              <li>
                <strong>Report Suspicious Behavior:</strong> If you notice anything unusual, disable the plugin and report it
              </li>
            </ol>
            
            <div className="mt-8 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
              <p className="text-sm leading-relaxed">
                <strong className="font-semibold">Remember:</strong> Security is a shared responsibility. While we provide robust 
                protection mechanisms, your vigilance in following best practices is equally important.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "developing-plugins",
    title: "Developing Your Own Plugin",
    description: "Create custom plugins for your specific needs",
    icon: Code,
    sections: [
      {
        id: "overview",
        title: "Development Overview",
        content: (
          <div className="space-y-4">
            <p>
              BTCPayServer Companion supports custom plugins, allowing you to extend functionality 
              to meet your specific business needs.
            </p>
            <p>
              Plugins are built using standard web technologies (HTML, CSS, JavaScript/TypeScript) 
              and can use popular frameworks like React, Vue, or vanilla JavaScript.
            </p>
          </div>
        ),
      },
      {
        id: "plugin-structure",
        title: "Plugin Structure",
        content: (
          <div className="space-y-4">
            <p>A plugin consists of the following files packaged in a ZIP archive:</p>
            
            <pre className="bg-muted/50 border border-border p-6 rounded-xl overflow-x-auto text-sm font-mono">
{`my-plugin/
├── manifest.json       # Plugin metadata and configuration
├── index.html         # Main plugin entry point
├── index.js           # Plugin JavaScript code
├── styles.css         # Plugin styles (optional)
├── settings.html      # Settings page (optional)
└── assets/           # Images and other assets (optional)
    └── icon.png      # Plugin icon (256x256px recommended)`}
            </pre>
            
            <h4 className="font-semibold mt-6">Manifest File Structure</h4>
            <pre className="bg-muted/50 border border-border p-6 rounded-xl overflow-x-auto text-sm font-mono">
{`{
  "id": "my-custom-plugin",
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "description": "A custom plugin for BTCPayServer Companion",
  "author": "Your Name",
  "permissions": ["btcpay:read", "storage"],
  "entryPoint": "index.html",
  "settingsPage": "settings.html",
  "icon": "assets/icon.png"
}`}
            </pre>
          </div>
        ),
      },
      {
        id: "plugin-api",
        title: "Plugin API",
        content: (
          <div className="space-y-4">
            <p>
              Plugins communicate with BTCPayServer Companion through a message-passing API.
            </p>
            
            <h4 className="font-semibold">Available API Methods</h4>
            
            <pre className="bg-muted/50 border border-border p-6 rounded-xl overflow-x-auto text-sm font-mono">
{`// Initialize the plugin
window.btcpayCompanion.init({
  onReady: () => {
    console.log('Plugin initialized');
  }
});

// Fetch BTCPay data
window.btcpayCompanion.api.getInvoices({
  storeId: 'store-id',
  take: 50
}).then(invoices => {
  console.log('Invoices:', invoices);
});

// Store local data
window.btcpayCompanion.storage.set('key', { data: 'value' });
window.btcpayCompanion.storage.get('key').then(data => {
  console.log('Stored data:', data);
});

// Show notifications
window.btcpayCompanion.ui.showNotification({
  title: 'Success',
  message: 'Operation completed',
  type: 'success'
});`}
            </pre>
            
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <p className="text-sm">
                <strong>API Documentation:</strong> Full API documentation with all available methods 
                and examples is available in our GitHub repository.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "development-workflow",
        title: "Development Workflow",
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold">Setting Up Development Environment</h4>
            
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Use the Plugin Template:</strong> Clone our plugin template from GitHub as a starting point
              </li>
              <li>
                <strong>Install Dependencies:</strong>
                <pre className="bg-muted/50 border border-border p-3 rounded-lg mt-2 text-sm font-mono">npm install</pre>
              </li>
              <li>
                <strong>Start Development Server:</strong>
                <pre className="bg-muted/50 border border-border p-3 rounded-lg mt-2 text-sm font-mono">npm run dev</pre>
              </li>
              <li>
                <strong>Test in Companion App:</strong> Use the development mode to load your plugin locally
              </li>
            </ol>
            
            <h4 className="font-semibold mt-6">Building for Production</h4>
            
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Build the Plugin:</strong>
                <pre className="bg-muted/50 border border-border p-3 rounded-lg mt-2 text-sm font-mono">npm run build</pre>
              </li>
              <li>
                <strong>Package as ZIP:</strong>
                <pre className="bg-muted/50 border border-border p-3 rounded-lg mt-2 text-sm font-mono">npm run package</pre>
              </li>
              <li>
                <strong>Test Installation:</strong> Upload the ZIP file to verify it installs correctly
              </li>
              <li>
                <strong>Distribute:</strong> Share your plugin ZIP file or publish to the community repository
              </li>
            </ol>
          </div>
        ),
      },
      {
        id: "best-practices",
        title: "Development Best Practices",
        content: (
          <div className="space-y-4">
            <h4 className="font-semibold">Code Quality</h4>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Use TypeScript for better type safety and IDE support</li>
              <li>Follow consistent coding standards and formatting</li>
              <li>Include error handling for all API calls</li>
              <li>Minimize bundle size - only include necessary dependencies</li>
              <li>Test thoroughly in different scenarios (online/offline, different data sets)</li>
            </ul>
            
            <h4 className="font-semibold mt-6">User Experience</h4>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Provide clear loading states and error messages</li>
              <li>Make your UI responsive for different screen sizes</li>
              <li>Follow the Companion app's design system for consistency</li>
              <li>Include helpful documentation and tooltips</li>
              <li>Respect user preferences (dark mode, currency display, etc.)</li>
            </ul>
            
            <h4 className="font-semibold mt-6">Security</h4>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Never hardcode API keys or sensitive data</li>
              <li>Validate all user inputs</li>
              <li>Use HTTPS for any external API calls</li>
              <li>Request only necessary permissions</li>
              <li>Sanitize data before displaying to prevent XSS</li>
            </ul>
            
            <h4 className="font-semibold mt-6">Performance</h4>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Implement pagination for large data sets</li>
              <li>Cache API responses when appropriate</li>
              <li>Use virtual scrolling for long lists</li>
              <li>Optimize images and assets</li>
              <li>Lazy load features that aren't immediately needed</li>
            </ul>
          </div>
        ),
      },
      {
        id: "publishing",
        title: "Publishing Your Plugin",
        content: (
          <div className="space-y-4">
            <p>Once your plugin is ready, you can share it with the community:</p>
            
            <h4 className="font-semibold">Community Repository</h4>
            <p className="text-sm">
              Submit your plugin to the official BTCPayServer Companion plugin repository. 
              Plugins in the repository are reviewed for security and quality.
            </p>
            
            <h4 className="font-semibold mt-6">Submission Process</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Fork the plugin repository on GitHub</li>
              <li>Add your plugin metadata to the registry</li>
              <li>Submit a pull request with your plugin details</li>
              <li>Wait for review and approval</li>
              <li>Once approved, your plugin will be available in the app</li>
            </ol>
            
            <h4 className="font-semibold mt-6">Direct Distribution</h4>
            <p className="text-sm">
              You can also distribute your plugin ZIP file directly to users. They can install it 
              using the "Upload Plugin" feature in the Apps page.
            </p>
            
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
              <p className="text-sm leading-relaxed">
                <strong className="font-semibold">Open Source Encouraged:</strong> Consider making your plugin open source 
                to build trust and allow community contributions.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
];

export default function GuidesPage() {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    // Check for hash in URL to auto-select guide and section
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const [guideId, sectionId] = hash.split("/");
        const guide = guides.find((g) => g.id === guideId);
        if (guide) {
          setSelectedGuide(guideId);
          if (sectionId && guide.sections.find((s) => s.id === sectionId)) {
            setSelectedSection(sectionId);
          } else {
            setSelectedSection(guide.sections[0]?.id || null);
          }
        }
      }
    }
  }, []);

  const handleGuideSelect = (guideId: string) => {
    const guide = guides.find((g) => g.id === guideId);
    if (guide) {
      setSelectedGuide(guideId);
      setSelectedSection(guide.sections[0]?.id || null);
      if (typeof window !== 'undefined') {
        window.location.hash = `${guideId}/${guide.sections[0]?.id || ""}`;
      }
    }
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
    if (selectedGuide && typeof window !== 'undefined') {
      window.location.hash = `${selectedGuide}/${sectionId}`;
    }
  };

  const handleBackToGuides = () => {
    setSelectedGuide(null);
    setSelectedSection(null);
    if (typeof window !== 'undefined') {
      window.location.hash = "";
    }
  };

  const currentGuide = guides.find((g) => g.id === selectedGuide);
  const currentSection = currentGuide?.sections.find(
    (s) => s.id === selectedSection
  );

  if (!selectedGuide) {
    // Guide selection view
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Guides</h1>
          <p className="text-muted-foreground">
            Learn how to use BTCPayServer Companion effectively
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card
                key={guide.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleGuideSelect(guide.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {guide.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {guide.sections.length} sections
                    </span>
                    <Button variant="ghost" size="sm">
                      Read Guide →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Guide reading view
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToGuides}
            className="-ml-2 mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Guides
          </Button>
        </div>

        {currentGuide && (
          <article>
            {/* Guide header */}
            <header className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <currentGuide.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    {currentGuide.title}
                  </h1>
                </div>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {currentGuide.description}
              </p>
            </header>

            {/* Section navigation */}
            <nav className="mb-12 flex flex-wrap gap-2 border-b pb-6">
              {currentGuide.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionSelect(section.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>

            {/* Main content */}
            <main className="prose prose-gray dark:prose-invert max-w-none">
              <h2 className="text-3xl font-semibold tracking-tight mb-6">
                {currentSection?.title}
              </h2>
              <div className="text-base leading-7">
                {currentSection?.content}
              </div>
            </main>

            {/* Navigation footer */}
            <footer className="mt-16 flex items-center justify-between border-t pt-8">
              {currentGuide.sections.map((section, index) => {
                if (section.id === selectedSection) {
                  const prevSection = currentGuide.sections[index - 1];
                  const nextSection = currentGuide.sections[index + 1];
                  
                  return (
                    <React.Fragment key={section.id}>
                      <div>
                        {prevSection ? (
                          <button
                            onClick={() => handleSectionSelect(prevSection.id)}
                            className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            <div className="text-left">
                              <div className="text-xs uppercase tracking-wide opacity-60">
                                Previous
                              </div>
                              <div className="font-medium">{prevSection.title}</div>
                            </div>
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                      <div>
                        {nextSection && (
                          <button
                            onClick={() => handleSectionSelect(nextSection.id)}
                            className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <div className="text-right">
                              <div className="text-xs uppercase tracking-wide opacity-60">
                                Next
                              </div>
                              <div className="font-medium">{nextSection.title}</div>
                            </div>
                            <ChevronLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
                          </button>
                        )}
                      </div>
                    </React.Fragment>
                  );
                }
                return null;
              })}
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}