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
};

export default nextConfig;
