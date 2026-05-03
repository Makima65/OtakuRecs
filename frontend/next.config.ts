import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This forces Next.js to check for saved files every 1 second (fixes Docker hot-reloading)
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;