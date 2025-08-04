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
  transpilePackages: ['plugins/*'],
  webpack: (config, { isServer }) => {
    // Add alias for plugins directory
    config.resolve.alias = {
      ...config.resolve.alias,
      '@plugins': './plugins',
    };
    
    return config;
  },
};

export default nextConfig;
