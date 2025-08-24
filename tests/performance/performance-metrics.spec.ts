import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

interface PerformanceMetrics {
  pageLoad: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  network: {
    requests: Array<{
      url: string;
      method: string;
      status: number;
      timing: {
        start: number;
        end: number;
        duration: number;
      };
      size: number;
      type: string;
    }>;
    totalRequests: number;
    totalSize: number;
    totalDuration: number;
  };
  rendering: {
    fps: number[];
    jank: number;
    longTasks: Array<{
      duration: number;
      startTime: number;
    }>;
  };
  bundleSize: {
    javascript: number;
    css: number;
    images: number;
    fonts: number;
    total: number;
  };
}

class PerformanceProfiler {
  private page: Page;
  private context: BrowserContext;
  private metrics: Partial<PerformanceMetrics> = {};
  private networkRequests: any[] = [];

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  async startProfiling() {
    // Enable CDP for advanced metrics
    const client = await this.context.newCDPSession(this.page);

    // Enable performance monitoring
    await client.send("Performance.enable");
    await client.send("Runtime.enable");

    // Track network requests
    this.page.on("request", (request) => {
      this.networkRequests.push({
        url: request.url(),
        method: request.method(),
        startTime: Date.now(),
        headers: request.headers(),
      });
    });

    this.page.on("response", (response) => {
      const request = this.networkRequests.find(
        (r) => r.url === response.url(),
      );
      if (request) {
        request.status = response.status();
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.size = Number(response.headers()["content-length"] || 0);
        request.type = response.headers()["content-type"] || "unknown";
      }
    });

    return client;
  }

  async collectPageLoadMetrics() {
    const metrics = await this.page.evaluate(() => {
      const getNavigationTiming = () => {
        const timing = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        return {
          navigationStart: timing.fetchStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
          loadComplete: timing.loadEventEnd - timing.fetchStart,
        };
      };

      const getPaintMetrics = () => {
        const paintEntries = performance.getEntriesByType("paint");
        const fcp = paintEntries.find(
          (entry) => entry.name === "first-contentful-paint",
        );
        const fp = paintEntries.find((entry) => entry.name === "first-paint");

        return {
          firstPaint: fp ? fp.startTime : 0,
          firstContentfulPaint: fcp ? fcp.startTime : 0,
        };
      };

      const getLCP = () => {
        return new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ entryTypes: ["largest-contentful-paint"] });

          // Fallback after 5 seconds
          setTimeout(() => resolve(0), 5000);
        });
      };

      const getCLS = () => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            resolve(clsValue);
          }).observe({ entryTypes: ["layout-shift"] });

          // Resolve after 5 seconds of observation
          setTimeout(() => resolve(clsValue), 5000);
        });
      };

      const getTBT = () => {
        return new Promise<number>((resolve) => {
          let totalBlockingTime = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                totalBlockingTime += entry.duration - 50;
              }
            }
            resolve(totalBlockingTime);
          }).observe({ entryTypes: ["longtask"] });

          // Resolve after 5 seconds of observation
          setTimeout(() => resolve(totalBlockingTime), 5000);
        });
      };

      return {
        navigation: getNavigationTiming(),
        paint: getPaintMetrics(),
        lcp: getLCP(),
        cls: getCLS(),
        tbt: getTBT(),
      };
    });

    // Wait for promises to resolve
    const [lcp, cls, tbt] = await Promise.all([
      this.page.evaluate(() => metrics.lcp),
      this.page.evaluate(() => metrics.cls),
      this.page.evaluate(() => metrics.tbt),
    ]);

    this.metrics.pageLoad = {
      ...metrics.navigation,
      ...metrics.paint,
      largestContentfulPaint: await lcp,
      cumulativeLayoutShift: await cls,
      totalBlockingTime: await tbt,
      timeToInteractive: 0, // Will be calculated separately
    };
  }

  async collectMemoryMetrics() {
    const memoryInfo = await this.page.evaluate(() => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (memoryInfo) {
      this.metrics.memory = memoryInfo;
    }
  }

  async collectNetworkMetrics() {
    const totalSize = this.networkRequests.reduce(
      (sum, req) => sum + (req.size || 0),
      0,
    );
    const totalDuration = this.networkRequests.reduce(
      (sum, req) => sum + (req.duration || 0),
      0,
    );

    this.metrics.network = {
      requests: this.networkRequests.map((req) => ({
        url: req.url,
        method: req.method,
        status: req.status || 0,
        timing: {
          start: req.startTime,
          end: req.endTime || req.startTime,
          duration: req.duration || 0,
        },
        size: req.size || 0,
        type: req.type || "unknown",
      })),
      totalRequests: this.networkRequests.length,
      totalSize,
      totalDuration,
    };
  }

  async collectRenderingMetrics(cdpSession: any) {
    // Collect FPS data
    const metrics = await cdpSession.send("Performance.getMetrics");

    // Collect long tasks
    const longTasks = await this.page.evaluate(() => {
      return new Promise<any[]>((resolve) => {
        const tasks: any[] = [];
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              tasks.push({
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });

        // Collect for 5 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(tasks);
        }, 5000);
      });
    });

    this.metrics.rendering = {
      fps: [], // Would need continuous monitoring
      jank: longTasks.length,
      longTasks,
    };
  }

  async collectBundleSizeMetrics() {
    const resources = await this.page.evaluate(() => {
      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      const categorized = {
        javascript: 0,
        css: 0,
        images: 0,
        fonts: 0,
        total: 0,
      };

      resources.forEach((resource) => {
        const size = resource.transferSize;
        categorized.total += size;

        if (resource.name.match(/\.(js|mjs|jsx|ts|tsx)$/)) {
          categorized.javascript += size;
        } else if (resource.name.match(/\.css$/)) {
          categorized.css += size;
        } else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
          categorized.images += size;
        } else if (resource.name.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
          categorized.fonts += size;
        }
      });

      return categorized;
    });

    this.metrics.bundleSize = resources;
  }

  async runFullProfile() {
    const cdpSession = await this.startProfiling();

    // Navigate and wait for load
    await this.page.goto("/", { waitUntil: "networkidle" });

    // Collect all metrics
    await Promise.all([
      this.collectPageLoadMetrics(),
      this.collectMemoryMetrics(),
      this.collectNetworkMetrics(),
      this.collectBundleSizeMetrics(),
    ]);

    // Collect rendering metrics (needs some interaction time)
    await this.page.waitForTimeout(5000);
    await this.collectRenderingMetrics(cdpSession);

    return this.metrics;
  }

  getMetrics() {
    return this.metrics;
  }
}

test.describe("Performance Profiling", () => {
  const performanceData: any = {};

  test("Homepage Performance", async ({ page, context }) => {
    const profiler = new PerformanceProfiler(page, context);
    const metrics = await profiler.runFullProfile();

    performanceData.homepage = metrics;

    // Basic assertions to ensure metrics are collected
    expect(metrics.pageLoad?.domContentLoaded).toBeLessThan(3000);
    expect(metrics.pageLoad?.largestContentfulPaint).toBeLessThan(4000);
    expect(metrics.bundleSize?.javascript).toBeLessThan(5 * 1024 * 1024); // 5MB
  });

  test("Dashboard Performance", async ({ page, context }) => {
    const profiler = new PerformanceProfiler(page, context);
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const metrics = await profiler.runFullProfile();
    performanceData.dashboard = metrics;

    expect(metrics.pageLoad?.domContentLoaded).toBeLessThan(4000);
  });

  test("Settings Page Performance", async ({ page, context }) => {
    const profiler = new PerformanceProfiler(page, context);
    await page.goto("/settings", { waitUntil: "networkidle" });

    const metrics = await profiler.runFullProfile();
    performanceData.settings = metrics;

    expect(metrics.pageLoad?.domContentLoaded).toBeLessThan(3000);
  });

  test("Navigation Performance", async ({ page, context }) => {
    const profiler = new PerformanceProfiler(page, context);

    // Start from homepage
    await page.goto("/", { waitUntil: "networkidle" });

    // Measure navigation to dashboard
    const navStart = Date.now();
    await page.click('a[href="/dashboard"]');
    await page.waitForLoadState("networkidle");
    const dashboardNavTime = Date.now() - navStart;

    // Measure navigation to settings
    const settingsNavStart = Date.now();
    await page.click('a[href="/settings"]');
    await page.waitForLoadState("networkidle");
    const settingsNavTime = Date.now() - settingsNavStart;

    performanceData.navigation = {
      toDashboard: dashboardNavTime,
      toSettings: settingsNavTime,
    };

    expect(dashboardNavTime).toBeLessThan(2000);
    expect(settingsNavTime).toBeLessThan(2000);
  });

  test("Interaction Performance", async ({ page, context }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Measure interaction responsiveness
    const interactions = [];

    // Test button clicks
    const buttons = await page.$$("button");
    for (const button of buttons.slice(0, 3)) {
      // Test first 3 buttons
      const start = Date.now();
      await button.click();
      await page.waitForTimeout(100); // Wait for any animations
      const duration = Date.now() - start;
      interactions.push({ type: "button-click", duration });
    }

    performanceData.interactions = interactions;

    // Assert interactions are responsive
    interactions.forEach((interaction) => {
      expect(interaction.duration).toBeLessThan(500);
    });
  });

  test("React Component Rendering Performance", async ({ page, context }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Inject React DevTools profiling
    const renderMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any[] = [];
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "measure" && entry.name.includes("⚛")) {
              metrics.push({
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          }
        });
        observer.observe({ entryTypes: ["measure"] });

        // Trigger re-renders by interacting with the page
        setTimeout(() => {
          observer.disconnect();
          resolve(metrics);
        }, 3000);
      });
    });

    performanceData.reactRendering = renderMetrics;
  });

  test.afterAll(async () => {
    // Save performance data to file
    const reportPath = path.join(process.cwd(), "performance-report.json");
    await fs.writeFile(reportPath, JSON.stringify(performanceData, null, 2));
    console.log("Performance report saved to:", reportPath);
  });
});
