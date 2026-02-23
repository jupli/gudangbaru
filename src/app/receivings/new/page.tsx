"use client";

import { useEffect, useState } from "react";
import { MaterialCategory } from "@/generated/prisma/enums";

type Material = {
  id: string;
  name: string;
  unit: string;
  category: keyof typeof MaterialCategory;
};

type ReceivingItemForm = {
  materialId: string;
  quantityReceived: string;
  quantityAccepted: string;
  unit: string;
  status: "RECEIVED" | "PARTIAL" | "REJECTED";
  isWet: boolean;
  temperatureC: string;
  colorStatus: string;
  aromaStatus: string;
  textureStatus: string;
  packagingCondition: string;
  hasPest: boolean | null;
  humidityCondition: string;
  expiryDate: string;
  photoMaterialUrl: string;
  photoFormUrl: string;
  notes: string;
};

export default function NewReceivingPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceFileUrl, setInvoiceFileUrl] = useState("");

  const [items, setItems] = useState<ReceivingItemForm[]>([
    {
      materialId: "",
      quantityReceived: "",
      quantityAccepted: "",
      unit: "",
      status: "RECEIVED",
      isWet: true,
      temperatureC: "",
      colorStatus: "",
      aromaStatus: "",
      textureStatus: "",
      packagingCondition: "",
      hasPest: null,
      humidityCondition: "",
      expiryDate: "",
      photoMaterialUrl: "",
      photoFormUrl: "",
      notes: "",
    },
  ]);

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
          category: keyof typeof MaterialCategory;
        }[];
        setMaterials(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            unit: m.unit,
            category: m.category,
          })),
        );
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  function updateItem(index: number, patch: Partial<ReceivingItemForm>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        materialId: "",
        quantityReceived: "",
        quantityAccepted: "",
        unit: "",
        status: "RECEIVED",
        isWet: true,
        temperatureC: "",
        colorStatus: "",
        aromaStatus: "",
        textureStatus: "",
        packagingCondition: "",
        hasPest: null,
        humidityCondition: "",
        expiryDate: "",
        photoMaterialUrl: "",
        photoFormUrl: "",
        notes: "",
      },
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
      const payloadItems = items
        .filter((i) => i.materialId && i.quantityReceived)
        .map((i) => {
          const material = materials.find((m) => m.id === i.materialId);
          const isWet =
            material?.category === MaterialCategory.WET || i.isWet;

          const inspection: Record<string, unknown> = {};
          if (isWet) {
            inspection.temperatureC = i.temperatureC
              ? Number(i.temperatureC)
              : null;
            inspection.colorStatus = i.colorStatus || null;
            inspection.aromaStatus = i.aromaStatus || null;
            inspection.textureStatus = i.textureStatus || null;
          } else {
            inspection.packagingCondition = i.packagingCondition || null;
            inspection.hasPest =
              i.hasPest === null ? null : Boolean(i.hasPest);
            inspection.humidityCondition = i.humidityCondition || null;
          }

          inspection.expiryDate = i.expiryDate
            ? new Date(i.expiryDate).toISOString()
            : null;
          inspection.photoMaterialUrl = i.photoMaterialUrl || null;
          inspection.photoFormUrl = i.photoFormUrl || null;
          inspection.status = i.status;
          inspection.notes = i.notes || null;

          return {
            materialId: i.materialId,
            quantityReceived: Number(i.quantityReceived || "0"),
            quantityAccepted: Number(
              i.quantityAccepted || i.quantityReceived || "0",
            ),
            unit:
              i.unit ||
              materials.find((m) => m.id === i.materialId)?.unit ||
              "",
            status: i.status,
            isWet,
            inspection,
          };
        });

      const res = await fetch("/api/receivings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName,
          receiverName,
          invoiceNumber: invoiceNumber || null,
          invoiceFileUrl: invoiceFileUrl || null,
          receivedAt: new Date().toISOString(),
          items: payloadItems,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Gagal menyimpan penerimaan");
      }

      setSuccess("Penerimaan barang berhasil disimpan");
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
            Penerimaan Barang
          </h1>
          <a
            href="/dashboard"
            className="text-sm text-sky-700 hover:underline"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6 space-y-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-white p-4 shadow-sm"
        >
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Tanggal & Jam
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={new Date().toISOString().slice(0, 16)}
                readOnly
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Supplier
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Petugas Penerima
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Nomor Invoice
                </label>
                <input
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Link File Invoice (opsional)
                </label>
                <input
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={invoiceFileUrl}
                  onChange={(e) => setInvoiceFileUrl(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Detail & Pemeriksaan Bahan
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                + Tambah Baris
              </button>
            </div>

            <div className="max-h-[480px] overflow-auto text-xs">
              <table className="w-full border-collapse">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="py-1 text-left">Bahan</th>
                    <th className="py-1 text-right">Qty Datang</th>
                    <th className="py-1 text-right">Qty Diterima</th>
                    <th className="py-1 text-left">Status</th>
                    <th className="py-1 text-left">Pemeriksaan</th>
                    <th className="py-1" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const material = materials.find(
                      (m) => m.id === item.materialId,
                    );
                    const isWet =
                      material?.category === MaterialCategory.WET ||
                      item.isWet;

                    return (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-1 pr-1 align-top">
                          <select
                            className="mb-1 w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                            value={item.materialId}
                            onChange={(e) => {
                              const selected = materials.find(
                                (m) => m.id === e.target.value,
                              );
                              updateItem(index, {
                                materialId: e.target.value,
                                unit: selected?.unit ?? "",
                              });
                            }}
                            required
                          >
                            <option value="">Pilih bahan</option>
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <div className="text-[10px] text-slate-500">
                            {material
                              ? material.category === MaterialCategory.WET
                                ? "Bahan Basah"
                                : "Bahan Kering"
                              : "-"}
                          </div>
                        </td>
                        <td className="py-1 pr-1 align-top">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="mb-1 w-full rounded-md border border-slate-300 px-1 py-1 text-right text-xs"
                            value={item.quantityReceived}
                            onChange={(e) =>
                              updateItem(index, {
                                quantityReceived: e.target.value,
                              })
                            }
                            required
                          />
                          <div className="text-[10px] text-slate-500">
                            {item.unit || material?.unit || ""}
                          </div>
                        </td>
                        <td className="py-1 pr-1 align-top">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="mb-1 w-full rounded-md border border-slate-300 px-1 py-1 text-right text-xs"
                            value={item.quantityAccepted}
                            onChange={(e) =>
                              updateItem(index, {
                                quantityAccepted: e.target.value,
                              })
                            }
                          />
                          <div className="text-[10px] text-slate-500">
                            Diisi jika diterima sebagian
                          </div>
                        </td>
                        <td className="py-1 pr-1 align-top">
                          <select
                            className="mb-1 w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                            value={item.status}
                            onChange={(e) =>
                              updateItem(index, {
                                status:
                                  e.target
                                    .value as ReceivingItemForm["status"],
                              })
                            }
                          >
                            <option value="RECEIVED">Diterima</option>
                            <option value="PARTIAL">
                              Diterima Sebagian
                            </option>
                            <option value="REJECTED">Ditolak</option>
                          </select>
                          <textarea
                            className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                            rows={2}
                            placeholder="Catatan pemeriksaan"
                            value={item.notes}
                            onChange={(e) =>
                              updateItem(index, { notes: e.target.value })
                            }
                          />
                        </td>
                        <td className="py-1 pr-1 align-top">
                          {isWet ? (
                            <div className="space-y-1">
                              <input
                                type="number"
                                placeholder="Suhu (°C)"
                                className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                                value={item.temperatureC}
                                onChange={(e) =>
                                  updateItem(index, {
                                    temperatureC: e.target.value,
                                  })
                                }
                              />
                              <input
                                placeholder="Warna (normal/tidak)"
                                className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                                value={item.colorStatus}
                                onChange={(e) =>
                                  updateItem(index, {
                                    colorStatus: e.target.value,
                                  })
                                }
                              />
                              <input
                                placeholder="Aroma"
                                className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                                value={item.aromaStatus}
                                onChange={(e) =>
                                  updateItem(index, {
                                    aromaStatus: e.target.value,
                                  })
                                }
                              />
                              <input
                                placeholder="Tekstur"
                                className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                                value={item.textureStatus}
                                onChange={(e) =>
                                  updateItem(index, {
                                    textureStatus: e.target.value,
                                  })
                                }
                              />
                              <input
                                placeholder="Kondisi kemasan"
                                className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                                value={item.packagingCondition}
                                onChange={(e) =>
                                  updateItem(index, {
                                    packagingCondition: e.target.value,
                                  })
                                }
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <input
                                placeholder="Kondisi kemasan"
                                className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                                value={item.packagingCondition}
                                onChange={(e) =>
                                  updateItem(index, {
                                    packagingCondition: e.target.value,
                                  })
                                }
                              />
                              <select
                                className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                                value={
                                  item.hasPest === null
                                    ? ""
                                    : item.hasPest
                                      ? "YA"
                                      : "TIDAK"
                                }
                                onChange={(e) =>
                                  updateItem(index, {
                                    hasPest:
                                      e.target.value === ""
                                        ? null
                                        : e.target.value === "YA",
                                  })
                                }
                              >
                                <option value="">Ada hama?</option>
                                <option value="YA">Ya</option>
                                <option value="TIDAK">Tidak</option>
                              </select>
                              <input
                                placeholder="Kelembaban (normal/lembab)"
                                className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                                value={item.humidityCondition}
                                onChange={(e) =>
                                  updateItem(index, {
                                    humidityCondition: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}
                          <div className="mt-1 space-y-1">
                            <input
                              type="date"
                              className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                              aria-label="Tanggal kadaluarsa"
                              title="Tanggal kadaluarsa"
                              value={item.expiryDate}
                              onChange={(e) =>
                                updateItem(index, {
                                  expiryDate: e.target.value,
                                })
                              }
                            />
                            <input
                              placeholder="Link foto bahan/barang (opsional)"
                              className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                              value={item.photoMaterialUrl}
                              onChange={(e) =>
                                updateItem(index, {
                                  photoMaterialUrl: e.target.value,
                                })
                              }
                            />
                            <input
                              placeholder="Link foto formulir penerimaan (opsional)"
                              className="w-full rounded-md border border-slate-300 px-1 py-1 text-xs"
                              value={item.photoFormUrl}
                              onChange={(e) =>
                                updateItem(index, {
                                  photoFormUrl: e.target.value,
                                })
                              }
                            />
                          </div>
                        </td>
                        <td className="py-1 align-top text-center">
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

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
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Simpan Penerimaan"}
          </button>
        </form>
      </main>
    </div>
  );
}
