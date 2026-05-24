/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nextui-org/react', 'react-icons'],
  experimental: {
    optimizePackageImports: ['react-icons', '@nextui-org/react', 'framer-motion'],
  },
  swcMinify: true,
  reactStrictMode: false,
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    const rawBackendUrl = isDev 
      ? 'http://localhost/pWeB/WEBTECH/backend'
      : (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://welaund-production.up.railway.app');
    const backendUrl = rawBackendUrl
      .trim()
      .replace(/\/+$/, '')
      .replace(/^(?!https?:\/\/)/, 'https://');
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
