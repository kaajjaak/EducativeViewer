import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
