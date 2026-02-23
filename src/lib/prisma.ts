import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Gunakan env vars dari berbagai provider (Vercel Postgres, Prisma Postgres, dll)
// NOTE: Hardcoded fallback added for immediate fix, but user MUST set env var for security.
const connectionString = process.env.POSTGRES_PRISMA_URL || 
                        process.env.POSTGRES_URL || 
                        process.env.PRISMA_DATABASE_URL || 
                        process.env.DATABASE_URL ||
                        "postgres://2018d738174afadb64ebf4e2a470684f5a1855bacce6c97b9ac610ab8a745a70:sk_oEAe3cTE_OEOdMCMns7OQ@db.prisma.io:5432/postgres?sslmode=require";

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  console.warn("WARNING: Using hardcoded fallback connection string. Please set DATABASE_URL in Vercel Environment Variables.");
}

if (!connectionString) {
  const errorMessage = "No database connection string found. Please set DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL in Vercel.";
  console.error(errorMessage);
  
  // Di production (Vercel), kita hanya log error tapi jangan throw dulu
  // Ini penting agar build step (Next.js build) tidak gagal hanya karena env var belum diset
  // Koneksi akan gagal saat runtime jika benar-benar dipakai
}

const pool = new Pool({
  connectionString: connectionString,
  options: "-c search_path=public",
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
