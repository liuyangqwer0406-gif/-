import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  webpack(config, { dev }) {
    config.module.rules.push(
      { test: /\.html$/i, resourceQuery: /raw/, type: "asset/source" },
      { test: /\.js$/i, resourceQuery: /raw/, type: "asset/source" },
      {
        test: /\.wgsl$/i,
        loader: "@vgpu/wgsl/loader-webpack",
        options: { minify: !dev },
      },
    );
    return config;
  },
};

export default nextConfig;
