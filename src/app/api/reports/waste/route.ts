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

  const txs = await prisma.stockTransaction.findMany({
    where: {
      type: "WASTE",
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      material: true,
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const rows = txs.map((t: (typeof txs)[number]) => ({
    Tanggal: t.createdAt.toISOString().slice(0, 10),
    Bahan: t.material.name,
    "Qty Waste": t.quantity,
    Satuan: t.unit,
    Petugas: t.user?.name ?? "",
    Referensi: t.reference ?? "",
  }));

  const title = "Laporan Waste Bahan";

  if (format === "excel") {
    const buffer = await createExcelBuffer(title, rows);
    const uint8 = new Uint8Array(buffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="laporan-waste.xlsx"',
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
        "Content-Disposition": 'attachment; filename="laporan-waste.pdf"',
      },
    });
  }

  return NextResponse.json(rows);
}
