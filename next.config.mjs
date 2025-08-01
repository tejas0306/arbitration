/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Use standalone mode for full API route support
  output: 'standalone',
  // Configure rewrites to correctly handle API routes
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/:path*` : 'http://localhost:3001/:path*',
      },
    ];
  },
  // Use empty basePath
  basePath: '',
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  // Exclude problematic packages from client-side bundling
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude pan-aadhaar-ocr from client-side bundling
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
}

export default nextConfig
