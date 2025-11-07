import type { NextConfig } from "next";
const repo = process.env.NODE_ENV === 'production' ? '/arthm-web-demo' : '';
const nextConfig: NextConfig = {
  /* config options here */
   output: 'export',
   basePath: repo,
  assetPrefix: repo ? `${repo}/` : '',
   env: {
    NEXT_PUBLIC_BASE_PATH: repo,
  },
  reactCompiler: true,
};

export default nextConfig;
