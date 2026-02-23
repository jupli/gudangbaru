"use client";

import { useEffect, useState } from "react";
import { UserRole } from "@/generated/prisma/enums";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: keyof typeof UserRole;
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<keyof typeof UserRole>("WAREHOUSE");
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorPayload?.error ?? "Gagal memuat data user");
      }
      const data = (await res.json()) as {
        id: string;
        name: string;
        email: string;
        role: keyof typeof UserRole;
        isActive: boolean;
        createdAt: string;
      }[];
      setUsers(
        data.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
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
    loadUsers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Gagal membuat user");
      }
      setName("");
      setEmail("");
      setPassword("");
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan menyimpan",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: UserRow) {
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Gagal mengubah status user");
      }
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan mengubah user",
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Manajemen User
          </h1>
          <a
            href="/dashboard"
            className="text-sm text-sky-700 hover:underline"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6 space-y-6">
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Daftar User
            </h2>
            {loading && (
              <span className="text-xs text-slate-500">Memuat...</span>
            )}
          </div>
          {error && (
            <p className="mb-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="max-h-[360px] overflow-auto text-xs">
            <table className="w-full border-collapse">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="py-1 text-left">Nama</th>
                  <th className="py-1 text-left">Email</th>
                  <th className="py-1 text-left">Role</th>
                  <th className="py-1 text-left">Status</th>
                  <th className="py-1 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-1">{u.name}</td>
                    <td className="py-1">{u.email}</td>
                    <td className="py-1">
                      {u.role === "ADMIN"
                        ? "Admin"
                        : u.role === "WAREHOUSE"
                          ? "Staff Gudang"
                          : "Kepala Dapur"}
                    </td>
                    <td className="py-1">
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </td>
                    <td className="py-1 text-right">
                      <button
                        type="button"
                        onClick={() => toggleActive(u)}
                        className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                      >
                        {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-2 text-center text-slate-500"
                    >
                      Belum ada user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Tambah User Baru
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Nama
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Role
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as keyof typeof UserRole)
                }
              >
                <option value="ADMIN">Admin</option>
                <option value="WAREHOUSE">Staff Gudang</option>
                <option value="HEAD_CHEF">Kepala Dapur</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="mt-1 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan User"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
