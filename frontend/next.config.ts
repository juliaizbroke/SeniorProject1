import type { NextConfig } from "next";

const isElectron = process.env.ELECTRON === 'true';

const nextConfig: NextConfig = {
  output: isElectron ? 'export' : undefined,
  trailingSlash: isElectron,
  distDir: 'out',
  images: {
    unoptimized: isElectron,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/images/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: 'http://localhost:5001'
  },
  // Skip API routes during static export
  ...(isElectron && {
    skipTrailingSlashRedirect: true,
  }),
};

export default nextConfig;
