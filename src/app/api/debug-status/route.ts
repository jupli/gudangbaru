import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic untuk mencegah caching
export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.POSTGRES_PRISMA_URL || 
                          process.env.POSTGRES_URL || 
                          process.env.PRISMA_DATABASE_URL || 
                          process.env.DATABASE_URL;

  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    PRISMA_DATABASE_URL: !!process.env.PRISMA_DATABASE_URL,
    hasConnectionString: !!connectionString,
    // Tampilkan 10 karakter pertama connection string jika ada (untuk verifikasi format)
    connectionStringPrefix: connectionString ? connectionString.substring(0, 15) + "..." : "undefined"
  };

  try {
    // Cek koneksi basic
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, isActive: true }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      envCheck,
      data: {
        userCount,
        users
      }
    });
  } catch (error: any) {
    console.error("Debug DB Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      envCheck,
      code: error.code,
      meta: error.meta,
      details: "Jika error code adalah P2010 atau table not found, berarti migrasi database belum dijalankan. Jika 'DatabaseNotReachable' ke 127.0.0.1, berarti Environment Variable belum diset di Vercel."
    }, { status: 500 });
  }
}
