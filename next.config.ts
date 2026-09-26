import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      basePath: "/port-map",
      assetPrefix: "/port-map",
      trailingSlash: true,
    }
  : {};

export default nextConfig;
