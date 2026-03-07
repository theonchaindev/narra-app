import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bags-scout/shared", "@bags-scout/db"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/*.node"],
  },
  images: {
    domains: ["pbs.twimg.com", "unavatar.io"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
