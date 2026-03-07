import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bags-scout/shared", "@bags-scout/db"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    domains: ["pbs.twimg.com", "unavatar.io"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
