import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Pastikan DATABASE_URL diset di environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  const errorMessage = "DATABASE_URL is not set in environment variables. Please configure it in Vercel Settings -> Environment Variables.";
  console.error(errorMessage);
  
  // Di production (Vercel), kita ingin error ini muncul jelas di log
  if (process.env.NODE_ENV === "production") {
    throw new Error(errorMessage);
  }
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
