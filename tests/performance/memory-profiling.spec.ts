import { expect, test } from "@playwright/test";

test.describe("Memory Profiling", () => {
  test("Memory Leak Detection", async ({ page, context }) => {
    const memorySnapshots: any[] = [];

    // Helper to take memory snapshot
    const takeMemorySnapshot = async (label: string) => {
      const metrics = await page.evaluate(() => {
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

      if (metrics) {
        memorySnapshots.push({ label, ...metrics, timestamp: Date.now() });
      }
    };

    // Initial load
    await page.goto("/", { waitUntil: "networkidle" });
    await takeMemorySnapshot("Initial Load");

    // Navigate through pages multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto("/dashboard", { waitUntil: "networkidle" });
      await takeMemorySnapshot(`Dashboard Visit ${i + 1}`);

      await page.goto("/settings", { waitUntil: "networkidle" });
      await takeMemorySnapshot(`Settings Visit ${i + 1}`);

      await page.goto("/", { waitUntil: "networkidle" });
      await takeMemorySnapshot(`Home Visit ${i + 1}`);
    }

    // Force garbage collection if possible
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    await takeMemorySnapshot("After Navigation Cycle");

    // Analyze memory growth
    if (memorySnapshots.length > 0) {
      const initialMemory = memorySnapshots[0].usedJSHeapSize;
      const finalMemory =
        memorySnapshots[memorySnapshots.length - 1].usedJSHeapSize;
      const memoryGrowth = finalMemory - initialMemory;
      const growthPercentage = (memoryGrowth / initialMemory) * 100;

      console.log("Memory Analysis:");
      console.log(
        `  Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(
        `  Final Memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(
        `  Memory Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB (${growthPercentage.toFixed(2)}%)`,
      );

      // Check for potential memory leaks
      expect(growthPercentage).toBeLessThan(50); // Memory shouldn't grow more than 50%
    }
  });

  test("Component Unmounting Memory Cleanup", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const checkComponentCleanup = await page.evaluate(() => {
      return new Promise((resolve) => {
        const componentRefs: WeakRef<any>[] = [];
        const registry = new FinalizationRegistry((heldValue: string) => {
          console.log(`Component ${heldValue} was garbage collected`);
        });

        // Track React components
        const originalCreateElement = (window as any).React?.createElement;
        if (originalCreateElement) {
          (window as any).React.createElement = function (...args: any[]) {
            const element = originalCreateElement.apply(this, args);
            if (element && typeof element === "object") {
              const ref = new WeakRef(element);
              componentRefs.push(ref);
              registry.register(element, element.type?.name || "Unknown");
            }
            return element;
          };
        }

        setTimeout(() => {
          // Check how many components are still alive
          const aliveComponents = componentRefs.filter(
            (ref) => ref.deref() !== undefined,
          );
          resolve({
            totalTracked: componentRefs.length,
            stillAlive: aliveComponents.length,
          });
        }, 5000);
      });
    });

    console.log("Component Cleanup Analysis:", checkComponentCleanup);
  });

  test("DOM Node Count", async ({ page }) => {
    const nodeCountMetrics: any[] = [];

    const measureDOMNodes = async (label: string) => {
      const nodeCount = await page.evaluate(() => {
        return document.getElementsByTagName("*").length;
      });
      nodeCountMetrics.push({ label, count: nodeCount });
    };

    await page.goto("/", { waitUntil: "networkidle" });
    await measureDOMNodes("Homepage");

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await measureDOMNodes("Dashboard");

    await page.goto("/settings", { waitUntil: "networkidle" });
    await measureDOMNodes("Settings");

    console.log("DOM Node Counts:", nodeCountMetrics);

    // Check for excessive DOM nodes
    nodeCountMetrics.forEach((metric) => {
      expect(metric.count).toBeLessThan(3000); // Warn if more than 3000 nodes
    });
  });
});
