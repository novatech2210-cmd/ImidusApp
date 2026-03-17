/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  turbopack: {
    root: path.join(__dirname, '..', '..'),  // points to ~/Desktop/TOAST (project root)
    // or if src/web is the true root, use __dirname
  },
};

module.exports = nextConfig;
