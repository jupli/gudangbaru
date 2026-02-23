import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

type AdjustmentKind = "ADJUSTMENT" | "WASTE" | "RETURN";

export async function POST(request: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const materialId = String(body.materialId ?? "");
  const quantity = Number(body.quantity ?? 0);
  const unit = String(body.unit ?? "").trim();
  const kind = String(body.kind ?? "ADJUSTMENT").toUpperCase() as AdjustmentKind;
  const direction = String(body.direction ?? "OUT").toUpperCase();
  const reason = String(body.reason ?? "").trim();
  const supplierName = body.supplierName
    ? String(body.supplierName).trim()
    : null;
  const photoMaterialUrl = body.photoMaterialUrl
    ? String(body.photoMaterialUrl).trim()
    : null;
  const photoFormUrl = body.photoFormUrl
    ? String(body.photoFormUrl).trim()
    : null;

  if (!materialId || !unit || quantity <= 0 || !reason) {
    return NextResponse.json(
      { error: "Material, jumlah, satuan, dan alasan wajib diisi" },
      { status: 400 },
    );
  }

  if (kind !== "ADJUSTMENT" && kind !== "WASTE" && kind !== "RETURN") {
    return NextResponse.json({ error: "Jenis penyesuaian tidak valid" }, { status: 400 });
  }

  if (kind !== "ADJUSTMENT" && direction === "IN") {
    return NextResponse.json(
      { error: "Waste dan retur hanya boleh mengurangi stok" },
      { status: 400 },
    );
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });

  if (!material) {
    return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
  }

  if ((direction === "OUT" || kind !== "ADJUSTMENT") && material.currentStock < quantity) {
    return NextResponse.json(
      { error: "Stok tidak mencukupi untuk dikurangi" },
      { status: 400 },
    );
  }

  const txType: AdjustmentKind =
    kind === "WASTE" ? "WASTE" : kind === "RETURN" ? "RETURN" : "ADJUSTMENT";

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.material.update({
      where: { id: material.id },
      data: {
        currentStock:
          direction === "IN"
            ? { increment: quantity }
            : { decrement: quantity },
      },
    });

    const movement = await tx.stockTransaction.create({
      data: {
        materialId: material.id,
        type: txType,
        quantity,
        unit,
        department: null,
        reference: kind,
        userId: user.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: kind,
        entity: "Material",
        entityId: material.id,
        details: {
          quantity,
          unit,
          direction,
          reason,
          supplierName: kind === "RETURN" ? supplierName : null,
          photoMaterialUrl: kind === "RETURN" ? photoMaterialUrl : null,
          photoFormUrl: kind === "RETURN" ? photoFormUrl : null,
        },
      },
    });

    return movement;
  });

  return NextResponse.json(result, { status: 201 });
}
