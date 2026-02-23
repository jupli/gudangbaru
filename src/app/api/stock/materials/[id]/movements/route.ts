import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: { id },
  });

  if (!material) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const movements = await prisma.stockTransaction.findMany({
    where: { materialId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    material,
    movements,
  });
}
