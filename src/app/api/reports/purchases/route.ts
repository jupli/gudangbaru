import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createExcelBuffer, createPdfBuffer } from "@/lib/report-export";

function getDateRange(url: URL) {
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");

  if (startParam && endParam) {
    return {
      start: new Date(startParam),
      end: new Date(endParam),
    };
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = now;
  return { start, end };
}

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const { start, end } = getDateRange(url);

  const items = await prisma.receivingItem.findMany({
    where: {
      receiving: {
        receivedAt: {
          gte: start,
          lte: end,
        },
      },
    },
    include: {
      material: true,
      receiving: true,
    },
  });

  const rows = items.map((i: (typeof items)[number]) => ({
    Tanggal: i.receiving.receivedAt.toISOString().slice(0, 10),
    Nomor: i.receiving.number,
    Supplier: i.receiving.supplierName,
    Bahan: i.material.name,
    Kategori: i.material.category,
    "Qty Diterima": i.quantityAccepted,
    Satuan: i.unit,
  }));

  const title = "Laporan Pembelian";

  if (format === "excel") {
    const buffer = await createExcelBuffer(title, rows);
    const uint8 = new Uint8Array(buffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="laporan-pembelian.xlsx"',
      },
    });
  }

  if (format === "pdf") {
    const buffer = await createPdfBuffer(title, rows);
    const uint8 = new Uint8Array(buffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="laporan-pembelian.pdf"',
      },
    });
  }

  return NextResponse.json(rows);
}
