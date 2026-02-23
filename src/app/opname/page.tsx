"use client";

import { useEffect, useState } from "react";

type MaterialRow = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
};

type OpnameItemForm = {
  materialId: string;
  physicalQuantity: string;
  reason: string;
};

export default function StockOpnamePage() {
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [items, setItems] = useState<OpnameItemForm[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/stock/materials");
        if (!res.ok) {
          throw new Error("Gagal memuat data stok");
        }
        const data = (await res.json()) as {
          id: string;
          name: string;
          unit: string;
          currentStock: number;
        }[];
        const rows: MaterialRow[] = data.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          currentStock: Number(m.currentStock ?? 0),
        }));
        setMaterials(rows);
        setItems(
          rows.map((m) => ({
            materialId: m.id,
            physicalQuantity: m.currentStock.toString(),
            reason: "",
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
    load();
  }, []);

  function updateItem(id: string, patch: Partial<OpnameItemForm>) {
    setItems((prev) =>
      prev.map((item) =>
        item.materialId === id ? { ...item, ...patch } : item,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const mapped = items.map((item) => {
        const material = materials.find((m) => m.id === item.materialId);
        const physical = Number(item.physicalQuantity || "0");
        const system = material?.currentStock ?? 0;
        const diff = physical - system;
        return {
          materialId: item.materialId,
          physicalQuantity: physical,
          reason: diff !== 0 ? item.reason || "" : item.reason || null,
        };
      });

      const res = await fetch("/api/opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opnameDate: new Date().toISOString(),
          notes: notes || null,
          items: mapped,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Gagal menyimpan stock opname");
      }

      setSuccess("Stock opname berhasil disimpan");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Stock Opname
          </h1>
          <a
            href="/dashboard"
            className="text-sm text-sky-700 hover:underline"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Tanggal Opname
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={new Date().toISOString().slice(0, 10)}
                readOnly
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Catatan
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              Hasil Hitung Fisik
            </h2>
            {loading ? (
              <p className="text-xs text-slate-500">Memuat data stok...</p>
            ) : (
              <div className="max-h-[480px] overflow-auto">
                <table className="w-full border-collapse text-xs">
                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="py-1 text-left">Bahan</th>
                      <th className="py-1 text-right">Stok Sistem</th>
                      <th className="py-1 text-right">Hasil Fisik</th>
                      <th className="py-1 text-right">Selisih</th>
                      <th className="py-1 text-left">Alasan Selisih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => {
                      const item = items.find(
                        (row) => row.materialId === m.id,
                      );
                      const physical = Number(item?.physicalQuantity || "0");
                      const diff = physical - m.currentStock;
                      return (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="py-1">{m.name}</td>
                          <td className="py-1 text-right">
                            {m.currentStock.toFixed(2)} {m.unit}
                          </td>
                          <td className="py-1 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-24 rounded-md border border-slate-300 px-1 py-1 text-right text-xs"
                              value={item?.physicalQuantity ?? ""}
                              onChange={(e) =>
                                updateItem(m.id, {
                                  physicalQuantity: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="py-1 text-right">
                            {diff.toFixed(2)} {m.unit}
                          </td>
                          <td className="py-1">
                            <input
                              className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                              value={item?.reason ?? ""}
                              onChange={(e) =>
                                updateItem(m.id, { reason: e.target.value })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && materials.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-2 text-center text-slate-500"
                        >
                          Belum ada bahan aktif.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-600" role="status">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Simpan Stock Opname"}
          </button>
        </form>
      </main>
    </div>
  );
}
