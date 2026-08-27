import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function databaseUrl(): string {
  let url = String(process.env['DATABASE_URL'] ?? '').trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  url = url.replace(/\r|\n/g, '');
  url = url.replace(/&channel_binding=require/g, '');
  url = url.replace(/\?channel_binding=require&/, '?');
  url = url.replace(/\?channel_binding=require$/, '');
  return url;
}

function getPrisma(): PrismaClient {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: { url: databaseUrl() },
      },
    });
  }
  return global.__prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver) as unknown;
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
