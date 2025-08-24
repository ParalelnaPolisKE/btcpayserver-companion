import { expect, test } from "@playwright/test";

test.describe("API Performance Tests", () => {
  test("BTCPay API Response Times", async ({ page }) => {
    const apiMetrics: any[] = [];

    // Intercept API calls
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/api/") || url.includes("btcpay")) {
        const timing = response.request().timing();
        apiMetrics.push({
          url,
          method: response.request().method(),
          status: response.status(),
          duration: timing.responseEnd - timing.requestStart,
          size: Number(response.headers()["content-length"] || 0),
        });
      }
    });

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000); // Wait for API calls to complete

    // Analyze API performance
    apiMetrics.forEach((metric) => {
      expect(metric.duration).toBeLessThan(2000); // API calls should be under 2s
    });

    // Calculate statistics
    if (apiMetrics.length > 0) {
      const avgDuration =
        apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length;
      const maxDuration = Math.max(...apiMetrics.map((m) => m.duration));
      const totalSize = apiMetrics.reduce((sum, m) => sum + m.size, 0);

      console.log("API Performance Statistics:");
      console.log(`  Average Response Time: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Max Response Time: ${maxDuration.toFixed(2)}ms`);
      console.log(
        `  Total Data Transferred: ${(totalSize / 1024).toFixed(2)}KB`,
      );
      console.log(`  Number of API Calls: ${apiMetrics.length}`);
    }
  });

  test("Data Fetching with React Query", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Check for React Query cache performance
    const cacheMetrics = await page.evaluate(() => {
      // Access React Query internals if available
      const queryClient = (window as any).__REACT_QUERY_CLIENT__;
      if (queryClient) {
        const cache = queryClient.getQueryCache();
        return {
          queriesCount: cache.getAll().length,
          staleTimes: cache.getAll().map((q: any) => q.state.dataUpdatedAt),
        };
      }
      return null;
    });

    if (cacheMetrics) {
      console.log("React Query Cache Metrics:", cacheMetrics);
    }
  });

  test("WebSocket Performance (if applicable)", async ({ page }) => {
    const wsMetrics: any[] = [];

    page.on("websocket", (ws) => {
      const startTime = Date.now();

      ws.on("framesent", (frame) => {
        wsMetrics.push({
          type: "sent",
          size: frame.payload?.length || 0,
          timestamp: Date.now() - startTime,
        });
      });

      ws.on("framereceived", (frame) => {
        wsMetrics.push({
          type: "received",
          size: frame.payload?.length || 0,
          timestamp: Date.now() - startTime,
        });
      });
    });

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(5000);

    if (wsMetrics.length > 0) {
      console.log("WebSocket Metrics:", wsMetrics);
    }
  });
});
