// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname, // ensures Turbopack uses this directory
  },
};

module.exports = nextConfig;
