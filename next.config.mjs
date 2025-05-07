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
  // Only use export in non-production environments
  ...(process.env.NODE_ENV !== 'production' && {
    output: 'export',
  }),
  // Configure rewrites to proxy API requests to the NestJS backend in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/:path*` : '/api/:path*',
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  }
}

export default nextConfig
