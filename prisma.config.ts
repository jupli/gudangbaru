import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    // Prioritaskan env vars dari berbagai provider (Vercel Postgres, Prisma Postgres, dll)
    url: process.env.POSTGRES_PRISMA_URL || 
         process.env.POSTGRES_URL || 
         process.env.PRISMA_DATABASE_URL || 
         process.env.DATABASE_URL,
  },
});
