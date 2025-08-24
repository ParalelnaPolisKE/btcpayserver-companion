import { expect, test } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

test.describe("Bundle Size Analysis", () => {
  test("JavaScript Bundle Analysis", async ({ page }) => {
    const bundleMetrics: any = {
      scripts: [],
      stylesheets: [],
      images: [],
      fonts: [],
      totalSize: 0,
    };

    // Track all resources
    page.on("response", async (response) => {
      const url = response.url();
      const headers = response.headers();
      const size = Number(headers["content-length"] || 0);

      if (url.match(/\.(js|mjs|jsx|ts|tsx)$/)) {
        bundleMetrics.scripts.push({
          url,
          size,
          compressed: headers["content-encoding"] === "gzip",
        });
      } else if (url.match(/\.css$/)) {
        bundleMetrics.stylesheets.push({ url, size });
      } else if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
        bundleMetrics.images.push({ url, size });
      } else if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
        bundleMetrics.fonts.push({ url, size });
      }

      bundleMetrics.totalSize += size;
    });

    await page.goto("/", { waitUntil: "networkidle" });

    // Analyze JavaScript bundles
    const jsAnalysis = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      return scripts.map((script) => {
        const src = script.getAttribute("src") || "";
        const isAsync = script.hasAttribute("async");
        const isDefer = script.hasAttribute("defer");
        const isModule = script.getAttribute("type") === "module";

        return {
          src,
          isAsync,
          isDefer,
          isModule,
          loadingStrategy: isAsync ? "async" : isDefer ? "defer" : "blocking",
        };
      });
    });

    // Check for code splitting
    const hasCodeSplitting =
      bundleMetrics.scripts.filter(
        (s: any) =>
          s.url.includes("chunk") ||
          s.url.includes("_app") ||
          s.url.includes("_page"),
      ).length > 0;

    // Calculate statistics
    const totalJSSize = bundleMetrics.scripts.reduce(
      (sum: number, s: any) => sum + s.size,
      0,
    );
    const totalCSSSize = bundleMetrics.stylesheets.reduce(
      (sum: number, s: any) => sum + s.size,
      0,
    );
    const totalImageSize = bundleMetrics.images.reduce(
      (sum: number, s: any) => sum + s.size,
      0,
    );

    console.log("Bundle Analysis:");
    console.log(`  Total JS: ${(totalJSSize / 1024).toFixed(2)}KB`);
    console.log(`  Total CSS: ${(totalCSSSize / 1024).toFixed(2)}KB`);
    console.log(`  Total Images: ${(totalImageSize / 1024).toFixed(2)}KB`);
    console.log(`  Code Splitting: ${hasCodeSplitting ? "Yes" : "No"}`);
    console.log(`  Number of JS files: ${bundleMetrics.scripts.length}`);
    console.log("  JS Loading Strategies:", jsAnalysis);

    // Performance assertions
    expect(totalJSSize).toBeLessThan(2 * 1024 * 1024); // JS should be under 2MB
    expect(totalCSSSize).toBeLessThan(500 * 1024); // CSS should be under 500KB
  });

  test("Third-party Dependencies Impact", async ({ page }) => {
    const thirdPartyMetrics: any[] = [];

    page.on("response", async (response) => {
      const url = response.url();
      const isThirdParty =
        !url.includes("localhost") && !url.includes("127.0.0.1");

      if (isThirdParty) {
        const headers = response.headers();
        thirdPartyMetrics.push({
          url,
          domain: new URL(url).hostname,
          size: Number(headers["content-length"] || 0),
          type: headers["content-type"] || "unknown",
        });
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Group by domain
    const byDomain = thirdPartyMetrics.reduce((acc: any, metric) => {
      if (!acc[metric.domain]) {
        acc[metric.domain] = { count: 0, size: 0 };
      }
      acc[metric.domain].count++;
      acc[metric.domain].size += metric.size;
      return acc;
    }, {});

    console.log("Third-party Dependencies:");
    Object.entries(byDomain).forEach(([domain, stats]: [string, any]) => {
      console.log(
        `  ${domain}: ${stats.count} requests, ${(stats.size / 1024).toFixed(2)}KB`,
      );
    });
  });

  test("Tree-shaking Effectiveness", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Check for unused exports in bundles
    const unusedCode = await page.evaluate(() => {
      // This is a simplified check - real tree-shaking analysis would need build tools
      const scripts = Array.from(document.querySelectorAll("script"));
      const hasUnusedExports = scripts.some((script) => {
        const content = script.textContent || "";
        // Look for common patterns of unused code
        return (
          content.includes("__unused_webpack_exports") ||
          content.includes("/*#__PURE__*/") ||
          content.includes("/*unused harmony export")
        );
      });

      return hasUnusedExports;
    });

    console.log("Tree-shaking Analysis:");
    console.log(
      `  Potential unused code detected: ${unusedCode ? "Yes" : "No"}`,
    );
  });

  test("Asset Optimization", async ({ page }) => {
    const assetMetrics: any = {
      images: [],
      fonts: [],
    };

    page.on("response", async (response) => {
      const url = response.url();
      const headers = response.headers();

      if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
        assetMetrics.images.push({
          url,
          size: Number(headers["content-length"] || 0),
          format: url.split(".").pop(),
          cached: headers["cache-control"] || "none",
        });
      } else if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
        assetMetrics.fonts.push({
          url,
          size: Number(headers["content-length"] || 0),
          format: url.split(".").pop(),
        });
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });

    // Check for modern image formats
    const hasWebP = assetMetrics.images.some(
      (img: any) => img.format === "webp",
    );
    const hasWoff2 = assetMetrics.fonts.some(
      (font: any) => font.format === "woff2",
    );

    console.log("Asset Optimization:");
    console.log(`  Using WebP images: ${hasWebP ? "Yes" : "No"}`);
    console.log(`  Using WOFF2 fonts: ${hasWoff2 ? "Yes" : "No"}`);
    console.log(`  Total images: ${assetMetrics.images.length}`);
    console.log(`  Total fonts: ${assetMetrics.fonts.length}`);

    // Check image sizes
    assetMetrics.images.forEach((img: any) => {
      if (img.size > 200 * 1024) {
        // Images over 200KB
        console.warn(
          `  Large image detected: ${img.url} (${(img.size / 1024).toFixed(2)}KB)`,
        );
      }
    });
  });
});
