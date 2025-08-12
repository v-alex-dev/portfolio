import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" as any },
    ],
  },
};

export default nextConfig;
