/** @type {import('next').NextConfig} */
const backendApiUrl = process.env.API_URL || 'http://localhost:5001/api/v1'

const nextConfig = {
  // Set Turbopack root to this directory (silences workspace root warning)
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 92],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ['172.26.112.1'],
  rewrites: async () => {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendApiUrl}/:path*`,
      },
    ]
  },
  headers: async () => {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
}

export default nextConfig
