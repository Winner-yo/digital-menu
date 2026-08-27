import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function databaseUrl(): string {
  let url = process.env.DATABASE_URL || '';
  url = url.replace(/&channel_binding=require/g, '').replace(/\?channel_binding=require&/, '?');
  url = url.replace(/\?channel_binding=require$/, '');
  const isPooled = url.includes('-pooler.') || url.includes('pgbouncer=true');
  if (isPooled && !url.includes('pgbouncer=')) {
    url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }
  if (isPooled && !url.includes('connection_limit=')) {
    url += (url.includes('?') ? '&' : '?') + 'connection_limit=1';
  }
  if (!url.includes('connect_timeout=')) {
    url += (url.includes('?') ? '&' : '?') + 'connect_timeout=15';
  }
  return url;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: { url: databaseUrl() },
    },
  });

global.__prisma = prisma;

export default prisma;
