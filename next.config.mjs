/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  distDir: '.next',
  experimental: {
    turbopack: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
