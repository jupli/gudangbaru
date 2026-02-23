import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

type OpnameItemInput = {
  materialId: string;
  physicalQuantity: number;
  reason?: string | null;
};

export async function GET() {
  const user = await requireUser(["ADMIN", "WAREHOUSE"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.stockOpname.findMany({
    orderBy: { opnameDate: "desc" },
    include: {
      items: {
        include: {
          material: true,
        },
      },
    },
  });

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await requireUser(["ADMIN", "WAREHOUSE"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const opnameDate = body.opnameDate ? new Date(body.opnameDate) : new Date();
  const notes = body.notes ? String(body.notes).trim() : null;
  const items = Array.isArray(body.items) ? (body.items as OpnameItemInput[]) : [];

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Item stock opname wajib diisi" },
      { status: 400 },
    );
  }

  for (const item of items) {
    if (!item.materialId || typeof item.physicalQuantity !== "number") {
      return NextResponse.json(
        { error: "Data item opname tidak valid" },
        { status: 400 },
      );
    }
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const opname = await tx.stockOpname.create({
      data: {
        opnameDate,
        notes,
        createdById: user.userId,
      },
    });

    for (const raw of items) {
      const material = await tx.material.findUnique({
        where: { id: raw.materialId },
      });

      if (!material) {
        throw new Error("Bahan tidak ditemukan");
      }

      const systemQuantity = material.currentStock;
      const physicalQuantity = raw.physicalQuantity;
      const difference = physicalQuantity - systemQuantity;
      const reason = raw.reason ? String(raw.reason).trim() : null;

      if (difference !== 0 && !reason) {
        throw new Error(
          `Alasan wajib diisi untuk selisih bahan ${material.name}`,
        );
      }

      await tx.stockOpnameItem.create({
        data: {
          stockOpnameId: opname.id,
          materialId: material.id,
          systemQuantity,
          physicalQuantity,
          difference,
          reason,
        },
      });

      if (difference !== 0) {
        await tx.material.update({
          where: { id: material.id },
          data: {
            currentStock: physicalQuantity,
          },
        });

        await tx.stockTransaction.create({
          data: {
            materialId: material.id,
            type: "STOCK_OPNAME",
            quantity: Math.abs(difference),
            unit: material.unit,
            department: null,
            reference: opname.id,
            userId: user.userId,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: user.userId,
        action: "STOCK_OPNAME",
        entity: "StockOpname",
        entityId: opname.id,
        details: {
          notes,
        },
      },
    });

    return opname;
  });

  return NextResponse.json(result, { status: 201 });
}
