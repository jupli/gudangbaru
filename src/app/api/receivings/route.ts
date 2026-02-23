import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type ReceivingItemStatusValue = "RECEIVED" | "PARTIAL" | "REJECTED";

function normalizeStatus(raw: string): ReceivingItemStatusValue {
  const value = raw.toUpperCase();
  if (value === "RECEIVED" || value === "DITERIMA") {
    return "RECEIVED";
  }
  if (value === "PARTIAL" || value === "DITERIMA_SEBAGIAN") {
    return "PARTIAL";
  }
  return "REJECTED";
}

async function generateReceivingNumber() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `RCV-${y}${m}${d}-`;

  const last = await prisma.receiving.findFirst({
    where: {
      number: {
        startsWith: prefix,
      },
    },
    orderBy: { number: "desc" },
  });

  const lastSeq = last ? parseInt(last.number.slice(prefix.length), 10) || 0 : 0;
  const nextSeq = String(lastSeq + 1).padStart(3, "0");
  return `${prefix}${nextSeq}`;
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.receiving.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          material: true,
          inspection: true,
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

  const supplierName = String(body.supplierName ?? "").trim();
  const receiverName = String(body.receiverName ?? "").trim();
  const invoiceNumber = body.invoiceNumber
    ? String(body.invoiceNumber).trim()
    : null;
  const invoiceFileUrl = body.invoiceFileUrl
    ? String(body.invoiceFileUrl).trim()
    : null;
  const receivedAt = body.receivedAt
    ? new Date(body.receivedAt)
    : new Date();

  const items = Array.isArray(body.items) ? body.items : [];

  if (!supplierName || !receiverName || items.length === 0) {
    return NextResponse.json(
      { error: "Data penerimaan tidak lengkap" },
      { status: 400 },
    );
  }

  const number = await generateReceivingNumber();

  const result = await prisma.$transaction(
    async (tx) => {
      const receiving = await tx.receiving.create({
        data: {
          number,
          receivedAt,
          supplierName,
          receiverName,
          invoiceNumber,
          invoiceFileUrl,
          createdById: user.userId,
        },
      });

    for (const item of items) {
      const materialId = String(item.materialId);
      const quantityReceived = Number(item.quantityReceived ?? 0);
      const quantityAccepted = Number(item.quantityAccepted ?? 0);
      const unit = String(item.unit ?? "").trim();
      const rawStatus = String(item.status ?? "REJECTED");
      const status = normalizeStatus(rawStatus);

      if (!materialId || !unit || quantityReceived <= 0) {
        throw new Error("Item penerimaan tidak valid");
      }

      const receivingItem = await tx.receivingItem.create({
        data: {
          receivingId: receiving.id,
          materialId,
          quantityReceived,
          quantityAccepted,
          unit,
          status,
        },
      });

      const isWet = Boolean(item.isWet);

      const inspection = item.inspection ?? {};

      await tx.receivingInspection.create({
        data: ({
          receivingItemId: receivingItem.id,
          isWet,
          temperatureC: inspection.temperatureC ?? null,
          colorStatus: inspection.colorStatus ?? null,
          aromaStatus: inspection.aromaStatus ?? null,
          textureStatus: inspection.textureStatus ?? null,
          packagingCondition: inspection.packagingCondition ?? null,
          hasPest:
            typeof inspection.hasPest === "boolean"
              ? inspection.hasPest
              : null,
          humidityCondition: inspection.humidityCondition ?? null,
          expiryDate: inspection.expiryDate
            ? new Date(inspection.expiryDate)
            : null,
          photoMaterialUrl: inspection.photoMaterialUrl ?? null,
          photoFormUrl: inspection.photoFormUrl ?? null,
          status: inspection.status ?? rawStatus,
          notes: inspection.notes ?? null,
          createdAt: new Date(),
        } as unknown as Parameters<
          (typeof prisma.receivingInspection)["create"]
        >[0]["data"]),
      });

      if (status === "RECEIVED" || status === "PARTIAL") {
        if (quantityAccepted <= 0) {
          continue;
        }

        const stockLot = await tx.stockLot.create({
          data: {
            materialId,
            receivingItemId: receivingItem.id,
            quantityInitial: quantityAccepted,
            quantityRemaining: quantityAccepted,
            unit,
            expiryDate: inspection.expiryDate
              ? new Date(inspection.expiryDate)
              : null,
            status: "ACTIVE",
            receivedAt,
          },
        });

        await tx.stockTransaction.create({
          data: {
            materialId,
            type: "IN",
            quantity: quantityAccepted,
            unit,
            department: null,
            reference: receiving.number,
            userId: user.userId,
            stockLotId: stockLot.id,
          },
        });

        await tx.material.update({
          where: { id: materialId },
          data: {
            currentStock: {
              increment: quantityAccepted,
            },
          },
        });
      }
    }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE",
          entity: "Receiving",
          entityId: receiving.id,
          details: {
            number: receiving.number,
            supplierName,
            receiverName,
            invoiceNumber,
          },
        },
      });

      return receiving;
    },
    {
      timeout: 20000,
    },
  );

  return NextResponse.json(result, { status: 201 });
}
