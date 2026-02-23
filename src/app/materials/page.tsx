"use client";

import { useEffect, useState } from "react";
import { MaterialCategory } from "@/generated/prisma/enums";

type Material = {
  id: string;
  name: string;
  category: keyof typeof MaterialCategory;
  unit: string;
  minStock: number;
  mainSupplier: string | null;
  storageLocation: string | null;
  isActive: boolean;
  currentStock: number;
};

type FormState = {
  name: string;
  category: keyof typeof MaterialCategory | "";
  unit: string;
  minStock: string;
  mainSupplier: string;
  storageLocation: string;
};

export default function MaterialsPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    category: "",
    unit: "",
    minStock: "0",
    mainSupplier: "",
    storageLocation: "",
  });

  async function loadMaterials() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/materials");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Gagal memuat data bahan");
      }
      const data = (await res.json()) as Material[];
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan memuat data",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.category || !form.unit) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          unit: form.unit,
          minStock: Number(form.minStock || "0"),
          mainSupplier: form.mainSupplier || null,
          storageLocation: form.storageLocation || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Gagal menyimpan bahan");
      }

      setForm({
        name: "",
        category: "",
        unit: "",
        minStock: "0",
        mainSupplier: "",
        storageLocation: "",
      });
      await loadMaterials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan menyimpan",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Master Data Bahan
          </h1>
          <a
            href="/dashboard"
            className="text-sm text-sky-700 hover:underline"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row">
        <section className="w-full rounded-lg bg-white p-4 shadow-sm md:w-2/3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Daftar Bahan
            </h2>
            {loading && (
              <span className="text-xs text-slate-500">Memuat data...</span>
            )}
          </div>
          {error && (
            <p className="mb-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="max-h-[480px] overflow-auto text-xs">
            <table className="w-full border-collapse">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="py-1 text-left">Nama</th>
                  <th className="py-1 text-left">Kategori</th>
                  <th className="py-1 text-right">Stok</th>
                  <th className="py-1 text-right">Min</th>
                  <th className="py-1 text-left">Lokasi</th>
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
                      {m.storageLocation || m.mainSupplier || "-"}
                    </td>
                  </tr>
                ))}
                {!loading && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-2 text-center text-slate-500"
                    >
                      Belum ada data bahan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="w-full rounded-lg bg-white p-4 shadow-sm md:w-1/3">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Tambah Bahan
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Nama Bahan
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Kategori
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value as keyof typeof MaterialCategory,
                    }))
                  }
                  required
                >
                  <option value="">Pilih</option>
                  <option value={MaterialCategory.DRY}>Bahan Kering</option>
                  <option value={MaterialCategory.WET}>Bahan Basah</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Satuan
                </label>
                <input
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="kg, gram, liter, pcs"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Minimum Stok
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={form.minStock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minStock: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Supplier Utama
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={form.mainSupplier}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mainSupplier: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Lokasi Penyimpanan
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Rak, chiller, freezer, dry storage"
                value={form.storageLocation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, storageLocation: e.target.value }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Bahan"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
