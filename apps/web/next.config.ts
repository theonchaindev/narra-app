import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bags-scout/shared", "@bags-scout/db"],
  images: {
    domains: ["pbs.twimg.com", "unavatar.io"],
  },
};

export default nextConfig;
