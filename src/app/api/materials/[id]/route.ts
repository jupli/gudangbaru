import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { MaterialCategory } from "@/generated/prisma/enums";

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

  return NextResponse.json(material);
}

export async function PUT(request: Request, { params }: Params) {
  const user = await requireUser(["ADMIN", "WAREHOUSE"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.material.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();

  const name =
    typeof body.name === "string" ? body.name.trim() || existing.name : existing.name;
  const unit =
    typeof body.unit === "string" ? body.unit.trim() || existing.unit : existing.unit;
  const category =
    typeof body.category === "string" ? body.category : existing.category;
  const minStock =
    typeof body.minStock === "number" ? body.minStock : existing.minStock;
  const mainSupplier =
    typeof body.mainSupplier === "string"
      ? body.mainSupplier || null
      : existing.mainSupplier;
  const storageLocation =
    typeof body.storageLocation === "string"
      ? body.storageLocation || null
      : existing.storageLocation;
  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : existing.isActive;

  if (
    category !== MaterialCategory.DRY &&
    category !== MaterialCategory.WET
  ) {
    return NextResponse.json(
      { error: "Kategori tidak valid" },
      { status: 400 },
    );
  }

  const material = await prisma.material.update({
    where: { id },
    data: {
      name,
      unit,
      category,
      minStock,
      mainSupplier,
      storageLocation,
      isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: "UPDATE",
      entity: "Material",
      entityId: material.id,
      details: {
        before: existing,
        after: material,
      },
    },
  });

  return NextResponse.json(material);
}
