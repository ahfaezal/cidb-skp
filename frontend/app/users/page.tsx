"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Trash2, UserPlus, X } from "lucide-react";

import { AppShell } from "@/components/layouts/AppShell";
import { API_BASE_URL } from "@/src/lib/api";
import { AuthUser, UserRole, useAuth } from "@/src/lib/auth";

const roleOptions: UserRole[] = [
  "Super Admin",
  "Project Manager",
  "Fasilitator",
  "Pegawai CIDB",
  "Pegawai Penilai",
  "Ahli Panel Pembangun",
];

export default function UsersPage() {
  const { authHeaders, user } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Fasilitator");
  const [projectRef, setProjectRef] = useState("SKP-CIDB");
  const [password, setPassword] = useState("User@12345");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || "Gagal memuat pengguna.");
      }

      setUsers((await response.json()) as AuthUser[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengguna.");
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  function resetForm() {
    setName("");
    setEmail("");
    setRole("Fasilitator");
    setProjectRef("SKP-CIDB");
    setPassword("User@12345");
    setEditingUserId(null);
  }

  function startEditUser(item: AuthUser) {
    setError("");
    setMessage("");
    setEditingUserId(item.id);
    setName(item.name);
    setEmail(item.email);
    setRole(item.role);
    setProjectRef(item.projectRef);
    setPassword("");
  }

  async function submitUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const isEditing = editingUserId !== null;
      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/auth/users/${editingUserId}`
          : `${API_BASE_URL}/auth/users`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            name,
            email,
            role,
            projectRef,
            password,
          }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || (isEditing ? "Gagal kemaskini pengguna." : "Gagal cipta pengguna."));
      }

      resetForm();
      setMessage(isEditing ? "Pengguna berjaya dikemaskini." : "Pengguna berjaya dicipta.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal simpan pengguna.");
    } finally {
      setIsLoading(false);
    }
  }

  async function removeUser(item: AuthUser) {
    if (item.id === user?.id) {
      setError("Super Admin tidak boleh remove akaun sendiri.");
      return;
    }

    const confirmed = window.confirm(`Remove pengguna ${item.name}? Tindakan ini tidak boleh dibuat asal.`);
    if (!confirmed) return;

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${item.id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || "Gagal remove pengguna.");
      }

      if (editingUserId === item.id) resetForm();
      setMessage("Pengguna berjaya dibuang.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal remove pengguna.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
            USER MANAGEMENT
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Pengurusan Pengguna</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Super Admin boleh cipta akaun pengguna dan tetapkan peranan untuk akses sistem.
          </p>
        </section>

        {user?.role !== "Super Admin" ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-semibold text-red-700">
            Halaman ini hanya untuk Super Admin.
          </div>
        ) : (
          <section className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
            <form
              onSubmit={submitUser}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingUserId ? "Edit Akaun" : "Cipta Akaun"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingUserId
                      ? "Kemaskini maklumat atau isi password baharu untuk reset."
                      : "Tetapkan role dan projek pengguna."}
                  </p>
                </div>
                {editingUserId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    title="Batal edit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="space-y-4">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="Nama penuh"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="Email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
                >
                  {roleOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <input
                  value={projectRef}
                  onChange={(event) => setProjectRef(event.target.value)}
                  required
                  placeholder="Project / batch"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required={!editingUserId}
                  placeholder={
                    editingUserId
                      ? "Password baharu, kosongkan jika tidak reset"
                      : "Password sementara"
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {message && (
                <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  {message}
                </div>
              )}
              {error && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingUserId ? "Simpan Perubahan" : "Cipta Pengguna"}
              </button>
              {editingUserId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal Edit
                </button>
              ) : null}
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900">Senarai Pengguna</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {users.map((item) => (
                  <div
                    key={item.id}
                    className={`grid gap-3 p-5 md:grid-cols-[1fr_180px_180px_160px] ${
                      editingUserId === item.id ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.email}</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{item.role}</div>
                    <div className="text-sm text-slate-600">{item.projectRef}</div>
                    <div className="flex flex-wrap items-start justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEditUser(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeUser(item)}
                        disabled={item.id === user?.id || isLoading}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        title={item.id === user?.id ? "Tidak boleh remove akaun sendiri" : "Remove pengguna"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">Belum ada pengguna dipaparkan.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
