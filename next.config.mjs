/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable hot reload in Docker
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Enable experimental features for better development experience
  // experimental: {
  //   // Enable React Fast Refresh
  //   reactRefresh: true,
  // },
  env: {
    API_BASE_URL: process.env.API_BASE_URL
  },
};

export default nextConfig;
