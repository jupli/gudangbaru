import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Force dynamic untuk mencegah caching
export const dynamic = 'force-dynamic';

// Definisikan tipe UserRole secara manual untuk menghindari masalah import enum
type UserRole = "ADMIN" | "WAREHOUSE" | "HEAD_CHEF";

export async function GET() {
  try {
    const email = "admin@gudang.local";
    
    // Cek apakah admin sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({
        message: "Admin user already exists",
        user: {
          email: existingUser.email,
          role: existingUser.role,
        },
      });
    }

    // Buat password hash
    const passwordHash = await bcrypt.hash("Admin123!", 10);

    // Buat user admin baru
    // Gunakan casting 'as any' untuk role jika TypeScript komplain tentang enum, 
    // tapi karena kita pakai string literal yang valid, harusnya aman.
    const newUser = await prisma.user.create({
      data: {
        name: "Admin Gudang",
        email,
        passwordHash,
        role: "ADMIN" as any, // Bypass type check enum jika perlu
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Admin user created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      credentials: {
        email: "admin@gudang.local",
        password: "Admin123!",
      },
    });
  } catch (error: any) {
    console.error("Error setting up admin:", error);
    return NextResponse.json(
      { error: "Failed to setup admin", details: error.message },
      { status: 500 }
    );
  }
}
