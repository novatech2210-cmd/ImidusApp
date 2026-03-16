import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Exclude server-only packages from client bundle
  serverExternalPackages: ['mssql', 'tedious', 'sqltypes'],
};

export default nextConfig;
