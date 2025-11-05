import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __db_prismaClient: PrismaClient | undefined;
}

export const prismaClient =
  globalThis.__db_prismaClient ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db_prismaClient = prismaClient;
}