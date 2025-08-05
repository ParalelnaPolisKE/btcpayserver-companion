import type { NextConfig } from "next";
import path from 'path';

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
  transpilePackages: ['plugins/**'],
  webpack: (config, { isServer }) => {
    // Add alias for plugins directory
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/plugins': path.resolve('./plugins'),
    };
    
    // Ensure webpack can handle dynamic imports from plugins directory
    config.module.rules.push({
      test: /\.(tsx?|jsx?)$/,
      include: [path.resolve('./plugins')],
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: ['next/babel'],
          },
        },
      ],
    });
    
    return config;
  },
};

export default nextConfig;
