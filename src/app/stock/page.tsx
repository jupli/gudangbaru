"use client";

import { useEffect, useState } from "react";

type MaterialRow = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  category: string;
  level: "GREEN" | "YELLOW" | "RED";
};

function levelLabel(level: MaterialRow["level"]) {
  if (level === "GREEN") return "Aman";
  if (level === "YELLOW") return "Mendekati minimum";
  return "Di bawah minimum";
}

function levelColor(level: MaterialRow["level"]) {
  if (level === "GREEN") return "bg-emerald-100 text-emerald-800";
  if (level === "YELLOW") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function StockPage() {
  const [items, setItems] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stock/materials");
      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorPayload?.error ?? "Gagal memuat data stok");
      }
      const data = (await res.json()) as {
        id: string;
        name: string;
        unit: string;
        currentStock: number;
        minStock: number;
        category: string;
        level: MaterialRow["level"];
      }[];
      setItems(
        data.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          currentStock: Number(m.currentStock ?? 0),
          minStock: Number(m.minStock ?? 0),
          category: m.category,
          level: m.level,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan memuat data",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Monitoring Stok
          </h1>
          <a
            href="/dashboard"
            className="text-sm text-sky-700 hover:underline"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Hijau = aman
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Kuning = mendekati minimum
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Merah = di bawah minimum
            </span>
          </div>
          <button
            type="button"
            onClick={load}
            className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
          >
            Refresh
          </button>
        </div>

        {error && (
          <p className="mb-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="max-h-[520px] overflow-auto text-xs">
          <table className="w-full border-collapse">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="py-1 text-left">Bahan</th>
                <th className="py-1 text-left">Kategori</th>
                <th className="py-1 text-right">Stok</th>
                <th className="py-1 text-right">Min</th>
                <th className="py-1 text-left">Level</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-1">{m.name}</td>
                  <td className="py-1">
                    {m.category === "DRY" ? "Bahan Kering" : "Bahan Basah"}
                  </td>
                  <td className="py-1 text-right">
                    {m.currentStock.toFixed(2)} {m.unit}
                  </td>
                  <td className="py-1 text-right">
                    {m.minStock.toFixed(2)} {m.unit}
                  </td>
                  <td className="py-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${levelColor(m.level)}`}
                    >
                      {levelLabel(m.level)}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-2 text-center text-slate-500">
                    Belum ada bahan aktif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
