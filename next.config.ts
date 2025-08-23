import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode in development to prevent double rendering
  // Remove this in production
  reactStrictMode: false,
  // Enable static export for Tauri
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // transpilePackages is for npm packages, not local directories
  // Local directories are handled by webpack config below
  webpack: (config) => {
    // Add alias for plugins directory
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/plugins": path.resolve("./plugins"),
    };

    // Ensure webpack can handle dynamic imports from plugins directory
    // Next.js already handles TypeScript/JSX transpilation

    return config;
  },
};

export default nextConfig;
