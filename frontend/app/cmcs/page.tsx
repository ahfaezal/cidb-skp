"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import Link from "next/link";

type CMCSItem = {
  id: number;
  code?: string;
  title: string;
  description?: string;
  level?: string;
  sector?: string;
  created_at?: string;
};

type OfficialImportSummary = {
  source: string;
  competency_count: number;
  unit_count: number;
  knowledge_count: number;
  competencies: {
    code: string;
    title: string;
    description: string;
    objective: string;
    unit_count: number;
    knowledge_count: number;
  }[];
};

export default function CMCSPage() {
  const [cmcsData, setCmcsData] = useState<CMCSItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("Level 3");
  const [sector, setSector] = useState("Construction");
  const [loading, setLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<OfficialImportSummary | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  async function getCMCSData() {
    const response = await axios.get("http://127.0.0.1:8000/cmcs/");
    setCmcsData(response.data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getCMCSData();
  }, []);

  function resetForm() {
    setEditingId(null);
    setCode("");
    setTitle("");
    setDescription("");
    setLevel("Level 3");
    setSector("Construction");
    setMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) return;

    setLoading(true);

    if (editingId) {
      await axios.put(`http://127.0.0.1:8000/cmcs/${editingId}`, {
        code: code.trim() || null,
        title,
        description,
        level,
        sector,
      });
    } else {
      await axios.post("http://127.0.0.1:8000/cmcs/", {
        code: code.trim() || null,
        title,
        description,
        level,
        sector,
      });
    }

    resetForm();
    await getCMCSData();
    setLoading(false);
  }

  function handleEdit(item: CMCSItem) {
    setEditingId(item.id);
    setCode(item.code || "");
    setTitle(item.title);
    setDescription(item.description || "");
    setLevel(item.level || "Level 3");
    setSector(item.sector || "Construction");
  }

  async function handlePreviewImport() {
    setMessage("");
    const response = await axios.get("http://127.0.0.1:8000/cmcs/official-import/preview");
    setImportPreview(response.data);
  }

  async function handleImportOfficialCMCS() {
    const confirmImport = window.confirm(
      "Import CMCS rasmi C01-C06? Data nested rasmi di bawah C01-C06 akan diganti dengan struktur daripada dokumen rasmi."
    );

    if (!confirmImport) return;

    setImporting(true);
    setMessage("");

    try {
      await axios.post("http://127.0.0.1:8000/cmcs/official-import");
      await getCMCSData();
      const response = await axios.get("http://127.0.0.1:8000/cmcs/official-import/preview");
      setImportPreview(response.data);
      setMessage("CMCS rasmi berjaya diimport ke database.");
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmDelete = window.confirm("Padam CMCS ini?");

    if (!confirmDelete) return;

    await axios.delete(`http://127.0.0.1:8000/cmcs/${id}`);

    await getCMCSData();
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            CMCS Master Data
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Contractor Management Competency Standard
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Pangkalan data utama CMCS yang akan digunakan untuk membina mapping,
            struktur modul, kandungan SKP dan assessment.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Official CMCS Importer
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Import CMCS rasmi daripada dokumen CIDB-01:2024
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  Import ini akan membina master reference C01 hingga C06
                  beserta Competency Unit, Work Activity dan Knowledge item untuk
                  digunakan semasa mapping.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePreviewImport}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50"
                >
                  Preview Import
                </button>
                <button
                  type="button"
                  onClick={handleImportOfficialCMCS}
                  disabled={importing}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? "Mengimport..." : "Import to Database"}
                </button>
              </div>
            </div>

            {importPreview && (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Core Competency
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {importPreview.competency_count}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Competency Unit
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {importPreview.unit_count}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Knowledge Item
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {importPreview.knowledge_count}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 md:col-span-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Preview
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {importPreview.competencies.map((item) => (
                      <div
                        key={item.code}
                        className="rounded-xl border border-slate-100 p-3"
                      >
                        <p className="text-sm font-bold text-blue-600">
                          {item.code}
                        </p>
                        <p className="font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.unit_count} CU / {item.knowledge_count} knowledge item
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {message && (
              <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {message}
              </p>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? "Kemaskini CMCS" : "Tambah CMCS"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <input
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Kod rasmi CMCS, contoh: C01"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />

            <input
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Tajuk CMCS"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Penerangan CMCS"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              />

              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Menyimpan..."
                  : editingId
                  ? "Update CMCS"
                  : "+ Simpan CMCS"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-fit rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Senarai Core Competency
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {cmcsData.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 px-6 py-5 md:grid-cols-[100px_1fr_160px_220px]"
              >
                <div className="font-bold text-blue-600">
                  {item.code || `CMCS-${String(item.id).padStart(3, "0")}`}
                </div>

                <div>
                  <Link
                    href={`/cmcs/${item.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.description || "Tiada penerangan"}
                  </p>
                </div>

                <div className="text-sm text-slate-600">
                  Level: {item.level || "-"}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {item.sector || "Active"}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
