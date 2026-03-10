/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.0.26:5004",
  },
};

module.exports = nextConfig;
