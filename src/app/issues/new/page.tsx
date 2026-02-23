"use client";

import { useEffect, useState } from "react";

type Material = {
  id: string;
  name: string;
  unit: string;
};

type IssueItemForm = {
  materialId: string;
  quantity: string;
  usageNote: string;
  photoMaterialUrl: string;
};

export default function NewIssuePage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [items, setItems] = useState<IssueItemForm[]>([
    { materialId: "", quantity: "", usageNote: "", photoMaterialUrl: "" },
  ]);
  const [department, setDepartment] = useState("DAPUR");
  const [notes, setNotes] = useState("");
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
        // ignore, error handled on submit
      }
    }
    load();
  }, []);

  function updateItem(index: number, patch: Partial<IssueItemForm>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { materialId: "", quantity: "", usageNote: "", photoMaterialUrl: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        issueDate: new Date().toISOString(),
        department,
        notes: notes || null,
        items: items
          .filter((i) => i.materialId && i.quantity)
          .map((i) => ({
            materialId: i.materialId,
            quantity: Number(i.quantity),
            unit:
              materials.find((m) => m.id === i.materialId)?.unit ?? "",
            usageNote: i.usageNote || null,
            photoMaterialUrl: i.photoMaterialUrl || null,
          })),
      };

      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Gagal menyimpan transaksi keluar");
      }

      setSuccess("Transaksi barang keluar berhasil disimpan");
      setItems([
        { materialId: "", quantity: "", usageNote: "", photoMaterialUrl: "" },
      ]);
      setNotes("");
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
            Transaksi Barang Keluar
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
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Tanggal
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
                Departemen
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="DAPUR">Dapur</option>
                <option value="BAR">Bar</option>
                <option value="PASTRY">Pastry</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Keterangan Umum
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Detail Bahan
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                + Tambah Baris
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="py-1 text-left">Bahan</th>
                    <th className="py-1 text-right">Qty</th>
                    <th className="py-1 text-left">Keterangan</th>
                    <th className="py-1 text-left">Link Foto Bahan</th>
                    <th className="py-1" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-1 pr-1">
                        <select
                          className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                          value={item.materialId}
                          onChange={(e) =>
                            updateItem(index, {
                              materialId: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="">Pilih bahan</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full rounded-md border border-slate-300 px-1 py-1 text-right text-xs"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, {
                              quantity: e.target.value,
                            })
                          }
                          required
                        />
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                          placeholder="Keterangan pemakaian"
                          value={item.usageNote}
                          onChange={(e) =>
                            updateItem(index, {
                              usageNote: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full text-[11px]"
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
                              updateItem(index, {
                                photoMaterialUrl: data.url,
                              });
                            } catch {
                              // abaikan, error umum akan muncul saat submit jika perlu
                            }
                          }}
                        />
                        {item.photoMaterialUrl && (
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-12 w-12 overflow-hidden rounded border border-slate-200 bg-slate-50">
                              <img
                                src={item.photoMaterialUrl}
                                alt="Preview foto bahan"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <a
                              href={item.photoMaterialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate text-[10px] text-sky-700 hover:underline"
                            >
                              Buka foto
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="py-1 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            {submitting ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </form>
      </main>
    </div>
  );
}
