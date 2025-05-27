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
  },
  // Use standalone for production, which supports client-side functionality
  output: 'standalone',
  // Configure rewrites to proxy API requests to the NestJS backend in development
  async rewrites() {
    return [
      // Rewrite all API routes to the backend
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/:path*` : '/api/:path*',
      },
    ];
  },
  experimental: {
    // Optimize hydration performance
    optimizeCss: true,
    // Enable experimental React features that help with hydration
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Reduce hydration mismatches by ensuring consistent rendering
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  serverExternalPackages: ['@prisma/client']
}

export default nextConfig
