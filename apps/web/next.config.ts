import type { NextConfig } from "next";
import path from "path";

const uiSrc = path.resolve(__dirname, "../../packages/ui/src");

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@ui/components": path.join(uiSrc, "components"),
      "@ui/lib": path.join(uiSrc, "lib"),
      "@ui/hooks": path.join(uiSrc, "hooks"),
    };
    return config;
  },
};

export default nextConfig;
