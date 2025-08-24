import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode in development to prevent double rendering
  // Remove this in production
  reactStrictMode: false,
  // Enable static export for Tauri
  output: "export",

  // Image optimization settings
  images: {
    unoptimized: true, // Required for static export
    formats: ["image/webp"], // Prefer WebP format when possible
  },

  // Performance optimizations
  experimental: {
    // Note: optimizeCss requires 'critters' package
    // optimizeCss: true,
    // Optimize package imports for better tree-shaking
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "recharts",
    ],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"], // Keep error and warn logs
          }
        : false,
  },
  // Webpack configuration for additional optimizations
  webpack: (config, { isServer, dev }) => {
    // Add alias for plugins directory
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/plugins": path.resolve("./plugins"),
    };

    // Production optimizations
    if (!dev && !isServer) {
      // Enable more aggressive code splitting
      config.optimization = {
        ...config.optimization,
        runtimeChunk: "single",
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk
            framework: {
              name: "framework",
              chunks: "all",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // UI library chunk
            lib: {
              test(module: any) {
                return (
                  module.size() > 160000 &&
                  /node_modules[\\/]/.test(module.identifier())
                );
              },
              name(module: any) {
                const hash = require("crypto")
                  .createHash("sha1")
                  .update(module.identifier())
                  .digest("hex");
                return `lib-${hash.substring(0, 8)}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Commons chunk
            commons: {
              name: "commons",
              minChunks: 2,
              priority: 20,
            },
            // Shared modules chunk
            shared: {
              name(module: any, chunks: any) {
                const hash = require("crypto")
                  .createHash("sha1")
                  .update(
                    chunks.reduce(
                      (acc: string, chunk: any) => acc + chunk.name,
                      "",
                    ),
                  )
                  .digest("hex");
                return `shared-${hash.substring(0, 8)}`;
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
          // Maximum number of parallel requests
          maxAsyncRequests: 30,
          // Maximum number of parallel requests at entry point
          maxInitialRequests: 25,
          // Minimum size for chunk generation
          minSize: 20000,
        },
      };
    }

    return config;
  },
};

export default nextConfig;
