import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(materials);
}

export async function POST(request: Request) {
  const user = await requireUser(["ADMIN", "WAREHOUSE"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").toUpperCase();
  const unit = String(body.unit ?? "").trim();
  const minStock = Number(body.minStock ?? 0);
  const mainSupplier = body.mainSupplier ? String(body.mainSupplier) : null;
  const storageLocation = body.storageLocation
    ? String(body.storageLocation)
    : null;

  if (!name || !unit || !category) {
    return NextResponse.json(
      { error: "Nama, kategori, dan satuan wajib diisi" },
      { status: 400 },
    );
  }

  if (category !== "DRY" && category !== "WET") {
    return NextResponse.json(
      { error: "Kategori tidak valid" },
      { status: 400 },
    );
  }

  const material = await prisma.material.create({
    data: {
      name,
      category,
      unit,
      minStock,
      mainSupplier,
      storageLocation,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: "CREATE",
      entity: "Material",
      entityId: material.id,
      details: {
        name,
        category,
        unit,
        minStock,
        mainSupplier,
        storageLocation,
      },
    },
  });

  return NextResponse.json(material, { status: 201 });
}
