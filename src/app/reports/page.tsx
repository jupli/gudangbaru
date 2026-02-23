"use client";

import { useMemo } from "react";

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = now;
  const toStr = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toStr(start), end: toStr(end) };
}

export default function ReportsPage() {
  const range = useMemo(() => todayRange(), []);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Laporan Stok & Pemakaian
          </h1>
          <a
            href="/dashboard"
            className="text-sm text-sky-700 hover:underline"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6 space-y-4">
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Laporan Stok
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <a
              href="/api/reports/stock?format=excel"
              className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Unduh Excel
            </a>
            <a
              href="/api/reports/stock?format=pdf"
              className="rounded-md bg-sky-600 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Unduh PDF
            </a>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">
            Laporan Pembelian (Periode Berjalan)
          </h2>
          <p className="mb-2 text-xs text-slate-500">
            Periode: {range.start} s/d {range.end}
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            <a
              href={`/api/reports/purchases?format=excel&start=${range.start}&end=${range.end}`}
              className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Unduh Excel
            </a>
            <a
              href={`/api/reports/purchases?format=pdf&start=${range.start}&end=${range.end}`}
              className="rounded-md bg-sky-600 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Unduh PDF
            </a>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">
            Laporan Pemakaian Bahan (Periode Berjalan)
          </h2>
          <p className="mb-2 text-xs text-slate-500">
            Periode: {range.start} s/d {range.end}
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            <a
              href={`/api/reports/usage?format=excel&start=${range.start}&end=${range.end}`}
              className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Unduh Excel
            </a>
            <a
              href={`/api/reports/usage?format=pdf&start=${range.start}&end=${range.end}`}
              className="rounded-md bg-sky-600 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Unduh PDF
            </a>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">
            Laporan Waste / Retur (Periode Berjalan)
          </h2>
          <p className="mb-2 text-xs text-slate-500">
            Periode: {range.start} s/d {range.end}
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            <a
              href={`/api/reports/waste?format=excel&start=${range.start}&end=${range.end}`}
              className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Unduh Excel
            </a>
            <a
              href={`/api/reports/waste?format=pdf&start=${range.start}&end=${range.end}`}
              className="rounded-md bg-sky-600 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Unduh PDF
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

