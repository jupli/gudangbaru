import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function getLevel(current: number, min: number) {
  if (current <= 0) return "RED";
  if (current < min) return "RED";
  if (current <= min * 1.5) return "YELLOW";
  return "GREEN";
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const materials = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const data = materials.map((m: (typeof materials)[number]) => ({
    ...m,
    level: getLevel(m.currentStock, m.minStock),
  }));

  return NextResponse.json(data);
}
