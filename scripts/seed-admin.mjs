import pkg from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const { PrismaClient, UserRole } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c search_path=public",
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@gudang.local";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("Admin sudah ada:", email);
    return;
  }

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const user = await prisma.user.create({
    data: {
      name: "Admin Gudang",
      email,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log("Admin dibuat:");
  console.log("Email:", user.email);
  console.log("Password:", "Admin123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
