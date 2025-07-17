import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode in development to prevent double rendering
  // Remove this in production
  reactStrictMode: false,
};

export default nextConfig;
