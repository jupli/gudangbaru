import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Gunakan env vars dari berbagai provider (Vercel Postgres, Prisma Postgres, dll)
const connectionString = process.env.POSTGRES_PRISMA_URL || 
                        process.env.POSTGRES_URL || 
                        process.env.PRISMA_DATABASE_URL || 
                        process.env.DATABASE_URL;

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
