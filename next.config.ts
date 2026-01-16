import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure hot reload works properly
  reactStrictMode: true,
  // Improve file watching on Windows
  webpackDevMiddleware: (config) => {
    config.watchOptions = {
      poll: 1000, // Check for changes every second
      aggregateTimeout: 300, // Delay before rebuilding once the first file changed
    };
    return config;
  },
};

export default nextConfig;
