import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable strict mode for better development
  reactStrictMode: true,

  // @napi-rs/canvas must run in Node.js runtime (not edge/browser)
  serverExternalPackages: ["@napi-rs/canvas"],

  // Allow serving images from public/backgrounds and public/output
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
