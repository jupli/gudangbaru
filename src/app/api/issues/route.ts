import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type IssueItemInput = {
  materialId: string;
  quantity: number;
  unit: string;
  usageNote?: string | null;
  photoMaterialUrl?: string | null;
};

type IssueTxClient = Pick<typeof prisma, "stockLot" | "stockTransaction" | "material">;

async function consumeStockFIFO(
  tx: IssueTxClient,
  options: {
    materialId: string;
    quantity: number;
    unit: string;
    department: string;
    reference: string;
    userId: string;
    issueItemId: string;
  },
) {
  const lots = await tx.stockLot.findMany({
    where: {
      materialId: options.materialId,
      status: "ACTIVE",
      quantityRemaining: {
        gt: 0,
      },
    },
    orderBy: [
      { expiryDate: "asc" },
      { receivedAt: "asc" },
    ],
  });

  let remaining = options.quantity;

  for (const lot of lots) {
    if (remaining <= 0) break;

    const take = Math.min(remaining, lot.quantityRemaining);
    remaining -= take;

    await tx.stockLot.update({
      where: { id: lot.id },
      data: {
        quantityRemaining: {
          decrement: take,
        },
        status:
          lot.quantityRemaining - take <= 0 ? "EMPTY" : lot.status,
      },
    });

    await tx.stockTransaction.create({
      data: {
        materialId: options.materialId,
        type: "OUT",
        quantity: take,
        unit: options.unit,
        department: options.department,
        reference: options.reference,
        userId: options.userId,
        stockLotId: lot.id,
        issueItemId: options.issueItemId,
      },
    });
  }

  if (remaining > 0) {
    throw new Error("Stok tidak mencukupi");
  }

  await tx.material.update({
    where: { id: options.materialId },
    data: {
      currentStock: {
        decrement: options.quantity,
      },
    },
  });
}

export async function POST(request: Request) {
  const user = await requireUser(["ADMIN", "WAREHOUSE", "HEAD_CHEF"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
  const department = String(body.department ?? "").trim();
  const notes = body.notes ? String(body.notes).trim() : null;
  const items = Array.isArray(body.items) ? (body.items as IssueItemInput[]) : [];

  if (!department || items.length === 0) {
    return NextResponse.json(
      { error: "Departemen dan item wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.create({
        data: {
          issueDate,
          department,
          notes,
          createdById: user.userId,
        },
      });

      for (const raw of items) {
        const materialId = String(raw.materialId);
        const quantity = Number(raw.quantity ?? 0);
        const unit = String(raw.unit ?? "").trim();
        const usageNote = raw.usageNote ? String(raw.usageNote).trim() : null;
        const photoMaterialUrl = raw.photoMaterialUrl
          ? String(raw.photoMaterialUrl).trim()
          : null;

        if (!materialId || !unit || quantity <= 0) {
          throw new Error("Item keluar tidak valid");
        }

        const material = await tx.material.findUnique({
          where: { id: materialId },
        });

        if (!material) {
          throw new Error("Bahan tidak ditemukan");
        }

        if (material.currentStock < quantity) {
          throw new Error(
            `Stok bahan ${material.name} tidak mencukupi`,
          );
        }

        const issueItem = await tx.issueItem.create({
          data: {
            issueId: issue.id,
            materialId,
            quantity,
            unit,
            usageNote,
            photoMaterialUrl,
          },
        });

        await consumeStockFIFO(tx, {
          materialId,
          quantity,
          unit,
          department,
          reference: issue.id,
          userId: user.userId,
          issueItemId: issueItem.id,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "ISSUE",
          entity: "Issue",
          entityId: issue.id,
          details: {
            department,
            notes,
          },
        },
      });

      return issue;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat transaksi keluar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
