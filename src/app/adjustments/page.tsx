"use client";

import { useEffect, useState } from "react";

type Material = {
  id: string;
  name: string;
  unit: string;
};

type Kind = "ADJUSTMENT" | "WASTE" | "RETURN";

export default function AdjustmentsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [kind, setKind] = useState<Kind>("ADJUSTMENT");
  const [direction, setDirection] = useState<"IN" | "OUT">("OUT");
  const [reason, setReason] = useState("");
   const [supplierName, setSupplierName] = useState("");
   const [photoMaterialUrl, setPhotoMaterialUrl] = useState("");
   const [photoFormUrl, setPhotoFormUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/materials");
        if (!res.ok) return;
        const data = (await res.json()) as {
          id: string;
          name: string;
          unit: string;
        }[];
        setMaterials(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            unit: m.unit,
          })),
        );
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (kind !== "ADJUSTMENT") {
      setDirection("OUT");
    }
  }, [kind]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/stock/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          quantity: Number(quantity || "0"),
          unit:
            materials.find((m) => m.id === materialId)?.unit ??
            "",
          kind,
          direction,
          reason,
          supplierName: kind === "RETURN" ? supplierName || null : null,
          photoMaterialUrl: kind === "RETURN" ? photoMaterialUrl || null : null,
          photoFormUrl: kind === "RETURN" ? photoFormUrl || null : null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ?? "Gagal menyimpan penyesuaian stok",
        );
      }

      setSuccess("Penyesuaian stok berhasil disimpan");
      setQuantity("");
      setReason("");
      setSupplierName("");
      setPhotoMaterialUrl("");
      setPhotoFormUrl("");
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
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Penyesuaian / Waste / Retur Stok
          </h1>
          <a
            href="/dashboard"
            className="text-sm text-sky-700 hover:underline"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Bahan
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                required
              >
                <option value="">Pilih bahan</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Jenis
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as Kind)
                }
              >
                <option value="ADJUSTMENT">Penyesuaian Stok</option>
                <option value="WASTE">Waste / Bahan Rusak</option>
                <option value="RETURN">Retur ke Supplier</option>
              </select>
            </div>
          </div>

          {kind === "RETURN" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Nama Supplier (Retur)
                </label>
                <input
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Contoh: PT Sumber Pangan Sejahtera"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Arah Perubahan
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={direction}
                onChange={(e) =>
                  setDirection(e.target.value as "IN" | "OUT")
                }
                disabled={kind !== "ADJUSTMENT"}
              >
                <option value="OUT">Kurangi Stok</option>
                <option value="IN">Tambah Stok</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Jumlah
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Alasan Penyesuaian
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {kind === "RETURN" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Foto kondisi barang (opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    try {
                      const form = new FormData();
                      form.append("file", file);
                      const res = await fetch("/api/uploads", {
                        method: "POST",
                        body: form,
                      });
                      const data = (await res.json()) as {
                        url?: string;
                        error?: string;
                      };
                      if (!res.ok || !data.url) {
                        throw new Error(
                          data.error ?? "Gagal mengunggah foto",
                        );
                      }
                      setPhotoMaterialUrl(data.url);
                    } catch {
                    }
                  }}
                />
                {photoMaterialUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-12 w-12 overflow-hidden rounded border border-slate-200 bg-slate-50">
                      <img
                        src={photoMaterialUrl}
                        alt="Preview foto retur"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <a
                      href={photoMaterialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[10px] text-sky-700 hover:underline"
                    >
                      Buka foto
                    </a>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Foto formulir retur (opsional)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="w-full text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    try {
                      const form = new FormData();
                      form.append("file", file);
                      const res = await fetch("/api/uploads", {
                        method: "POST",
                        body: form,
                      });
                      const data = (await res.json()) as {
                        url?: string;
                        error?: string;
                      };
                      if (!res.ok || !data.url) {
                        throw new Error(
                          data.error ?? "Gagal mengunggah formulir",
                        );
                      }
                      setPhotoFormUrl(data.url);
                    } catch {
                    }
                  }}
                />
                {photoFormUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-12 w-12 overflow-hidden rounded border border-slate-200 bg-slate-50">
                      <img
                        src={photoFormUrl}
                        alt="Preview formulir retur"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <a
                      href={photoFormUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[10px] text-sky-700 hover:underline"
                    >
                      Buka formulir
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

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
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </main>
    </div>
  );
}
