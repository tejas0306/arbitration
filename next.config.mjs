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
  },
  output: 'export',
  // Disable server-side rendering and static optimization
  experimental: {
    // This will allow client components with server-only hooks in certain environments
    appDir: true,
  }
}

export default nextConfig
