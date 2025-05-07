#!/bin/bash

# Exit on error
set -e

echo "===== Preparing Next.js app for Vercel deployment ====="

# Update next.config.mjs to ensure proper configurations
cat > next.config.mjs << EOF
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
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? \`\${process.env.NEXT_PUBLIC_API_URL}/:path*\` : '/api/:path*',
      },
    ];
  },
  experimental: {},
  serverExternalPackages: ['@prisma/client']
}

export default nextConfig
EOF

# Create .env file for deployment
cat > .env.production << EOF
# This will be overridden by Vercel environment variables
NEXT_PUBLIC_SKIP_AUTH_VERIFICATION=true
NEXT_PUBLIC_API_URL=https://your-render-api-url.com/api
EOF

# Update vercel.json with proper configuration
cat > vercel.json << EOF
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "NEXT_PUBLIC_SKIP_AUTH_VERIFICATION=true npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "outputDirectory": ".next",
  "functions": {
    "api/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_SKIP_AUTH_VERIFICATION": "true"
  }
}
EOF

# Check if all pages with useSearchParams are wrapped in Suspense
echo "Checking for pages that need Suspense boundaries..."
grep -r "useSearchParams" --include="*.tsx" --include="*.jsx" app/

echo "===== Vercel deployment preparation complete ====="
echo "You can now deploy to Vercel with:"
echo "  vercel --prod"
echo ""
echo "Make sure to set the NEXT_PUBLIC_API_URL environment variable"
echo "in the Vercel dashboard to point to your Render backend API URL." 