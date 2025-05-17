/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['images.unsplash.com', 'randomuser.me', 'picsum.photos'],
  },
  // Use standalone for production, which supports client-side functionality
  output: 'standalone',
  // Configure rewrites to proxy API requests to the NestJS backend in development
  async rewrites() {
    const nestJsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      // Map frontend paths directly to NestJS paths with the 'api' prefix
      {
        source: '/api/arbitration/:path*',
        destination: `${nestJsUrl}/api/arbitration/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${nestJsUrl}/api/auth/:path*`,
      },
      {
        source: '/api/verify/:path*',
        destination: `${nestJsUrl}/api/verify/:path*`,
      },
      {
        source: '/api/verification/:path*',
        destination: `${nestJsUrl}/api/verification/:path*`,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  serverExternalPackages: ['@prisma/client']
}

export default nextConfig
