import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@bags-scout/shared", "@bags-scout/db"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  images: {
    domains: ["pbs.twimg.com", "unavatar.io"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
