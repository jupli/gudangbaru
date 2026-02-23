import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { MaterialCategory, StockTransactionType } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) {
    redirect("/");
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [materials, nearlyExpiredLots, recentUsage] = await Promise.all([
    prisma.material.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.stockLot.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: {
          not: null,
        },
      },
      include: {
        material: true,
      },
      orderBy: {
        expiryDate: "asc",
      },
      take: 5,
    }),
    prisma.stockTransaction.groupBy({
      by: ["materialId"],
      where: {
        type: StockTransactionType.OUT,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: { quantity: true },
    }),
  ]);

  const totalDry = materials
    .filter(
      (m: (typeof materials)[number]) =>
        m.category === MaterialCategory.DRY,
    )
    .reduce(
      (sum: number, m: (typeof materials)[number]) =>
        sum + m.currentStock,
      0,
    );

  const totalWet = materials
    .filter(
      (m: (typeof materials)[number]) =>
        m.category === MaterialCategory.WET,
    )
    .reduce(
      (sum: number, m: (typeof materials)[number]) =>
        sum + m.currentStock,
      0,
    );

  const sortedByStock = [...materials]
    .sort(
      (
        a: (typeof materials)[number],
        b: (typeof materials)[number],
      ) => a.currentStock - b.currentStock,
    )
    .slice(0, 5);

  const lowStock = sortedByStock.filter(
    (m: (typeof materials)[number]) =>
      m.currentStock <= m.minStock,
  );

  const usageMap = Object.fromEntries(
    recentUsage.map((g) => [g.materialId, g._sum.quantity ?? 0]),
  ) as Record<string, number>;

  const usageChart = materials
    .map((m) => ({
      materialId: m.id,
      name: m.name,
      unit: m.unit,
      used: usageMap[m.id] ?? 0,
    }))
    .filter((m) => m.used > 0)
    .sort((a, b) => b.used - a.used)
    .slice(0, 6);

  const maxUsed = usageChart.reduce(
    (max, m) => (m.used > max ? m.used : max),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white">
              <span className="text-lg font-bold">G</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                Dashboard
              </p>
              <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                Sistem Gudang
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-right text-[11px] text-slate-500 sm:flex">
            <div className="flex items-end gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-slate-800">{user.name}</p>
                <p className="uppercase">{user.role}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1 text-xs">
            <a
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 font-medium text-sky-800"
            >
              <span className="text-base">🏠</span>
              <span>Dashboard</span>
            </a>
            <a
              href="/materials"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <span className="text-base">📦</span>
              <span>Master Bahan</span>
            </a>
            <a
              href="/receivings/new"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <span className="text-base">⬇️</span>
              <span>Penerimaan Barang</span>
            </a>
            <a
              href="/issues/new"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <span className="text-base">⬆️</span>
              <span>Pengeluaran Bahan</span>
            </a>
            <a
              href="/adjustments"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <span className="text-base">♻️</span>
              <span>Penyesuaian / Waste / Retur</span>
            </a>
            <a
              href="/stock"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <span className="text-base">📊</span>
              <span>Monitoring Stok</span>
            </a>
            <a
              href="/opname"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <span className="text-base">📝</span>
              <span>Stok Opname</span>
            </a>
            <a
              href="/reports"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <span className="text-base">📄</span>
              <span>Laporan</span>
            </a>
            <a
              href="/users"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <span className="text-base">👥</span>
              <span>Manajemen User</span>
            </a>
          </nav>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Total Stok Bahan Kering</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {totalDry.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Total Stok Bahan Basah</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {totalWet.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Jumlah Bahan Aktif</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {materials.length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Bahan Hampir Habis</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {lowStock.length}
            </p>
          </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              5 Bahan Hampir Habis
            </h2>
            <table className="w-full text-left text-xs">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-1">Bahan</th>
                  <th className="py-1 text-right">Stok</th>
                  <th className="py-1 text-right">Min</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-1">{m.name}</td>
                    <td className="py-1 text-right">
                      {m.currentStock.toFixed(2)} {m.unit}
                    </td>
                    <td className="py-1 text-right">
                      {m.minStock.toFixed(2)} {m.unit}
                    </td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-2 text-center text-slate-500"
                    >
                      Tidak ada bahan yang mendekati minimum.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              5 Bahan Hampir Expired
            </h2>
            <table className="w-full text-left text-xs">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-1">Bahan</th>
                  <th className="py-1">Batch</th>
                  <th className="py-1 text-right">Kadaluarsa</th>
                </tr>
              </thead>
              <tbody>
                {nearlyExpiredLots.map((lot: (typeof nearlyExpiredLots)[number]) => (
                  <tr key={lot.id} className="border-b last:border-0">
                    <td className="py-1">{lot.material.name}</td>
                    <td className="py-1">
                      {lot.quantityRemaining.toFixed(2)} {lot.unit}
                    </td>
                    <td className="py-1 text-right">
                      {lot.expiryDate
                        ? new Date(lot.expiryDate).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                  </tr>
                ))}
                {nearlyExpiredLots.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-2 text-center text-slate-500"
                    >
                      Belum ada batch yang mendekati kadaluarsa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </section>

          <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Top Pemakaian Bahan 30 Hari Terakhir
          </h2>
          {usageChart.length === 0 ? (
            <p className="text-xs text-slate-500">
              Belum ada data pemakaian bahan dalam 30 hari terakhir.
            </p>
          ) : (
            <div className="space-y-2">
              {usageChart.map((item) => (
                <div key={item.materialId}>
                  <div className="flex items-baseline justify-between text-[11px] text-slate-600">
                    <span className="font-medium text-slate-800">
                      {item.name}
                    </span>
                    <span>
                      {item.used.toFixed(2)} {item.unit}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-sky-500"
                      style={{
                        width:
                          maxUsed > 0
                            ? `${Math.max(
                                8,
                                Math.min(
                                  100,
                                  (item.used / maxUsed) * 100,
                                ),
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          </section>
        </main>
      </div>
    </div>
  );
}
