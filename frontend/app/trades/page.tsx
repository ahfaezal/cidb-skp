"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import {
  CIDB_CATEGORIES,
  OTHER_CATEGORY_CODE,
  getCidbCategory,
  getCidbField,
} from "@/lib/cidbCodes";

type Trade = {
  id: number;
  code: string;
  title: string;
  description?: string;
  sector?: string;
  category_code?: string;
  category_name?: string;
  field_title?: string;
  facilitator_name?: string;
  custom_category?: string;
  custom_field_title?: string;
  status: string;
  workflow_status: string;
  created_at?: string;
};

const API_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_CATEGORY_CODE = "CE";
const DEFAULT_STATUS = "Active";
const DEFAULT_WORKFLOW_STATUS = "Mapping Process";

function inferCategoryCode(trade: Trade) {
  if (trade.category_code) return trade.category_code;

  const codePrefix = trade.code.match(/^[A-Z]+/)?.[0];
  const matchedCategory = CIDB_CATEGORIES.find((category) =>
    category.fields.some((field) => field.code === trade.code)
  );

  return matchedCategory?.code || codePrefix || OTHER_CATEGORY_CODE;
}

function getFirstFieldCode(categoryCode: string) {
  return getCidbCategory(categoryCode)?.fields[0]?.code || "";
}

function getTradeCategoryLabel(trade: Trade) {
  if (trade.category_code === OTHER_CATEGORY_CODE) {
    return trade.custom_category || trade.category_name || "Lain-lain";
  }

  return trade.category_name || trade.sector || "-";
}

function getTradeFieldLabel(trade: Trade) {
  return trade.field_title || trade.custom_field_title || "Belum dinyatakan";
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryCode, setCategoryCode] = useState(DEFAULT_CATEGORY_CODE);
  const [fieldCode, setFieldCode] = useState(getFirstFieldCode(DEFAULT_CATEGORY_CODE));
  const [customCategory, setCustomCategory] = useState("");
  const [customFieldCode, setCustomFieldCode] = useState("");
  const [customFieldTitle, setCustomFieldTitle] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [facilitatorName, setFacilitatorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedCategory = useMemo(
    () => getCidbCategory(categoryCode),
    [categoryCode]
  );
  const selectedField = useMemo(
    () => getCidbField(categoryCode, fieldCode),
    [categoryCode, fieldCode]
  );
  const isOtherCategory = categoryCode === OTHER_CATEGORY_CODE;

  async function loadTrades() {
    const response = await axios.get(`${API_BASE_URL}/trades/`);
    setTrades(response.data);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchTrades() {
      const response = await axios.get(`${API_BASE_URL}/trades/`);

      if (!cancelled) {
        setTrades(response.data);
      }
    }

    fetchTrades();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setCategoryCode(DEFAULT_CATEGORY_CODE);
    setFieldCode(getFirstFieldCode(DEFAULT_CATEGORY_CODE));
    setCustomCategory("");
    setCustomFieldCode("");
    setCustomFieldTitle("");
    setTitle("");
    setDescription("");
    setFacilitatorName("");
    setError("");
  }

  function handleCategoryChange(nextCategoryCode: string) {
    setCategoryCode(nextCategoryCode);
    setFieldCode(getFirstFieldCode(nextCategoryCode));
    setCustomCategory("");
    setCustomFieldCode("");
    setCustomFieldTitle("");
  }

  function handleEdit(trade: Trade) {
    const nextCategoryCode = inferCategoryCode(trade);
    const knownField = getCidbField(nextCategoryCode, trade.code);

    setEditingId(trade.id);
    setCategoryCode(knownField ? nextCategoryCode : OTHER_CATEGORY_CODE);
    setFieldCode(knownField?.code || "");
    setCustomCategory(trade.custom_category || "");
    setCustomFieldCode(knownField ? "" : trade.code);
    setCustomFieldTitle(trade.custom_field_title || trade.field_title || "");
    setTitle(trade.title);
    setDescription(trade.description || "");
    setFacilitatorName(trade.facilitator_name || "");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const normalizedCode = isOtherCategory
      ? customFieldCode.trim().toUpperCase()
      : fieldCode.trim().toUpperCase();
    const normalizedTitle = title.trim();
    const categoryName = isOtherCategory
      ? customCategory.trim()
      : selectedCategory?.title || "";
    const fieldTitle = isOtherCategory
      ? customFieldTitle.trim()
      : selectedField?.title || "";

    if (!categoryName || !normalizedCode || !fieldTitle || !normalizedTitle) {
      setError("Kategori, Kod Bidang, Nama Trade/Tred dan tajuk Kod Bidang diperlukan.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        code: normalizedCode,
        title: normalizedTitle,
        description,
        sector: categoryName,
        category_code: categoryCode,
        category_name: categoryName,
        field_title: fieldTitle,
        facilitator_name: facilitatorName,
        custom_category: isOtherCategory ? customCategory.trim() : "",
        custom_field_title: isOtherCategory ? customFieldTitle.trim() : "",
        status: DEFAULT_STATUS,
        workflow_status: DEFAULT_WORKFLOW_STATUS,
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/trades/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/trades/`, payload);
      }

      resetForm();
      await loadTrades();
    } catch (err) {
      setError("Gagal menyimpan tred. Semak Kod Bidang supaya tidak berulang.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Padam tred ini?")) return;

    await axios.delete(`${API_BASE_URL}/trades/${id}`);
    await loadTrades();
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Trade/Tred Builder
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Trade-Specific Competency Structure
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Lengkapkan maklumat asas bidang/tred sebelum proses mapping CMCS,
            pembangunan modul, learning package dan assessment.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Tred</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {trades.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-3">
            <p className="text-sm font-semibold text-slate-900">
              Mapping Path
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Trade/Tred Setup {"->"} CMCS Mapping Matrix {"->"} Grouping Module/LP{" "}
              {"->"} Module Builder {"->"} Assessment
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? "Kemaskini Trade/Tred" : "Tambah Trade/Tred"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Kategori
                <select
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                  value={categoryCode}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {CIDB_CATEGORIES.map((category) => (
                    <option key={category.code} value={category.code}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>

              {isOtherCategory ? (
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Nyatakan kategori
                  <input
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Contoh: Specialist Railway Systems"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </label>
              ) : (
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Kod Bidang
                  <select
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                    value={fieldCode}
                    onChange={(e) => setFieldCode(e.target.value)}
                  >
                    {selectedCategory?.fields.map((field) => (
                      <option key={field.code} value={field.code}>
                        {field.code} - {field.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {isOtherCategory && (
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Kod Bidang
                  <input
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Contoh: RLY01"
                    value={customFieldCode}
                    onChange={(e) => setCustomFieldCode(e.target.value.toUpperCase())}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Nama Kod Bidang
                  <input
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Contoh: Sistem persinyalan rel khusus"
                    value={customFieldTitle}
                    onChange={(e) => setCustomFieldTitle(e.target.value)}
                  />
                </label>
              </div>
            )}

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Nama Trade/Tred
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                placeholder="Contoh: Railway Signalling & Communication"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Penerangan tred dan skop kompetensi
              <textarea
                className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                placeholder="Terangkan skop kompetensi, sempadan tred dan fokus pembangunan SKP."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Nama Fasilitator
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
                placeholder="Nama fasilitator bertanggungjawab"
                value={facilitatorName}
                onChange={(e) => setFacilitatorName(e.target.value)}
              />
            </label>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Menyimpan..."
                  : editingId
                    ? "Update Trade/Tred"
                    : "+ Simpan Trade/Tred"}
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
              Senarai Trade/Tred
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {trades.length === 0 ? (
              <div className="px-6 py-10 text-sm text-slate-500">
                Belum ada tred direkodkan.
              </div>
            ) : (
              trades.map((trade) => (
                <div
                  key={trade.id}
                  className="grid gap-4 px-6 py-5 md:grid-cols-[110px_1.3fr_1fr_180px_160px_190px]"
                >
                  <div>
                    <p className="font-bold text-blue-600">{trade.code}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {getTradeFieldLabel(trade)}
                    </p>
                  </div>

                  <div>
                    <Link
                      href={`/trades/${trade.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {trade.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {trade.description || "Tiada penerangan"}
                    </p>
                  </div>

                  <div className="text-sm text-slate-600">
                    {getTradeCategoryLabel(trade)}
                  </div>

                  <div className="text-sm text-slate-600">
                    {trade.facilitator_name || "-"}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {trade.workflow_status || DEFAULT_WORKFLOW_STATUS}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      {trade.status || DEFAULT_STATUS}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(trade)}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(trade.id)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
