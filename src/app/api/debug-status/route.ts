import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic untuk mencegah caching
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Cek koneksi basic
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, isActive: true }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
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
      code: error.code,
      meta: error.meta,
      details: "Jika error code adalah P2010 atau table not found, berarti migrasi database belum dijalankan."
    }, { status: 500 });
  }
}
