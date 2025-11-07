import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   output: 'export',
   basePath: `/arthm-web-demo`,
  assetPrefix: `/arthm-web-demo/`,
  reactCompiler: true,
};

export default nextConfig;
