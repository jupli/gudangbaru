import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [materials, recentUsage, recentPurchases, recentWaste, recentReturns] =
    await Promise.all([
      prisma.material.findMany(),
      prisma.stockTransaction.groupBy({
        by: ["materialId"],
        where: {
          type: "OUT",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { quantity: true },
      }),
      prisma.stockTransaction.groupBy({
        by: ["materialId"],
        where: {
          type: "IN",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { quantity: true },
      }),
      prisma.stockTransaction.groupBy({
        by: ["materialId"],
        where: {
          type: "WASTE",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { quantity: true },
      }),
      prisma.stockTransaction.groupBy({
        by: ["materialId"],
        where: {
          type: "RETURN",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { quantity: true },
      }),
    ]);

  const totalDry = materials
    .filter(
      (m: (typeof materials)[number]) =>
        m.category === "DRY",
    )
    .reduce(
      (sum: number, m: (typeof materials)[number]) =>
        sum + m.currentStock,
      0,
    );

  const totalWet = materials
    .filter(
      (m: (typeof materials)[number]) =>
        m.category === "WET",
    )
    .reduce(
      (sum: number, m: (typeof materials)[number]) =>
        sum + m.currentStock,
      0,
    );

  const now = new Date();
  const nearlyExpired = await prisma.stockLot.findMany({
    where: {
      status: "ACTIVE",
      expiryDate: {
        gte: now,
        lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      material: true,
    },
    orderBy: {
      expiryDate: "asc",
    },
    take: 5,
  });

  const lowStock = materials
    .filter(
      (m: (typeof materials)[number]) =>
        m.currentStock <= m.minStock && m.isActive,
    )
    .sort(
      (
        a: (typeof materials)[number],
        b: (typeof materials)[number],
      ) => a.currentStock - b.currentStock,
    )
    .slice(0, 5);

  const toMap = (groups: { materialId: string; _sum: { quantity: number | null } }[]) =>
    Object.fromEntries(
      groups.map((g) => [g.materialId, g._sum.quantity ?? 0]),
    );

  const usageMap = toMap(recentUsage);
  const purchaseMap = toMap(recentPurchases);
  const wasteMap = toMap(recentWaste);
  const returnMap = toMap(recentReturns);

  const usageChart = materials.map((m) => ({
    materialId: m.id,
    name: m.name,
    used: usageMap[m.id] ?? 0,
  }));

  return NextResponse.json({
    totalDry,
    totalWet,
    lowStock,
    nearlyExpired,
    usageChart,
    purchaseSummary: purchaseMap,
    wasteSummary: wasteMap,
    returnSummary: returnMap,
  });
}
