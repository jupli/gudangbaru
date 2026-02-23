import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createExcelBuffer, createPdfBuffer } from "@/lib/report-export";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";

  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
  });

  const rows = materials.map((m: (typeof materials)[number]) => ({
    Bahan: m.name,
    Kategori: m.category,
    Stok: m.currentStock,
    Satuan: m.unit,
    "Minimum Stok": m.minStock,
    "Supplier Utama": m.mainSupplier ?? "",
    "Lokasi Penyimpanan": m.storageLocation ?? "",
  }));

  if (format === "excel") {
    const buffer = await createExcelBuffer("Laporan Stok", rows);
    const uint8 = new Uint8Array(buffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="laporan-stok.xlsx"',
      },
    });
  }

  if (format === "pdf") {
    const buffer = await createPdfBuffer("Laporan Stok", rows);
    const uint8 = new Uint8Array(buffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="laporan-stok.pdf"',
      },
    });
  }

  return NextResponse.json(rows);
}
