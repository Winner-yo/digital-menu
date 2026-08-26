import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    dangerouslyAllowSVG: true,
  },
  experimental: {
    externalDir: true,
    outputFileTracingRoot: path.join(__dirname, '..'),
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs', 'qrcode', 'sharp'],
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  async rewrites() {
    if (process.env.VERCEL) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
