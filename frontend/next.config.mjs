import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function vercelDistDir() {
  if (!process.env.VERCEL) return '.next';
  const initCwd = process.env.INIT_CWD;
  if (!initCwd) return '.next';
  if (path.resolve(initCwd) === path.resolve(__dirname)) return '.next';
  // Vercel project root is the monorepo root; Next runs from frontend/.
  return path.join('..', '.next');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: vercelDistDir(),
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
    outputFileTracingIncludes: {
      '/api/**': ['../backend/**/*'],
    },
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs', 'qrcode', 'sharp'],
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  webpack: (config) => {
    // Keep `@/` working even if TypeScript is not installed (Vercel + NODE_ENV=production).
    // Alias `@/` only — a bare `@` alias would break scoped packages like `@prisma/client`.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/': path.join(__dirname, 'src') + '/',
    };
    return config;
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
