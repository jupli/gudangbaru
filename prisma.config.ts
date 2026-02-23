import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    // Prioritaskan POSTGRES_PRISMA_URL (untuk Vercel Postgres) atau fallback ke DATABASE_URL
    url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL,
  },
});
