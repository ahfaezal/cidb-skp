"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { API_BASE_URL } from "@/src/lib/api";

type Trade = {
  id: number;
  code: string;
  title: string;
};

type SavedGrouping = {
  id: number;
  trade_id: number;
  cmcs_id?: number | null;
  source_code: string;
  source_title: string;
  module_title: string;
  module_objective?: string;
  groups_json: string;
  status: string;
  module_id?: number | null;
};

type MappingBlock = {
  id: string;
  title: string;
  subtitle: string;
  items: string[];
  groupId: string;
};

type MappingGroup = {
  groupId: string;
  title: string;
  subtitle: string;
  blocks: MappingBlock[];
};

type ModuleCandidate = {
  id: string;
  grouping: SavedGrouping;
  group: MappingGroup;
  groupIndex: number;
};

function parseGroups(grouping: SavedGrouping): MappingGroup[] {
  try {
    const parsed = JSON.parse(grouping.groups_json) as MappingGroup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildDraftContent(candidate: ModuleCandidate | null) {
  if (!candidate) {
    return "";
  }

  const group = candidate.group;
  const grouping = candidate.grouping;
  const numberedSections = group.blocks
    .map((block, index) => {
      const items = block.items
        .filter(Boolean)
        .map((item, itemIndex) => `${index + 1}.${itemIndex + 1} ${item}`)
        .join("\n");
      return `${index + 1}) ${block.title}\n${block.subtitle || "Sub tajuk diambil daripada hasil mapping."}\n${items}`;
    })
    .join("\n\n");

  return [
    `Tajuk:\n${group.title}`,
    `Objektif:\n${grouping.module_objective || group.subtitle || "Membolehkan peserta memahami dan mengaplikasikan kandungan modul ini mengikut konteks tred."}`,
    `Penerangan:\nModul ini menghuraikan ${group.title.toLowerCase()} berdasarkan hasil mapping ${grouping.source_code} - ${grouping.source_title}. Kandungan disusun supaya fasilitator boleh membangunkan learning package, aktiviti pembelajaran dan assessment dengan lebih konsisten.`,
    numberedSections,
    "Rujukan:\n1. Dokumen CMCS CIDB berkaitan.\n2. SOP organisasi, spesifikasi projek dan amalan industri semasa.\n3. Standard teknikal, keselamatan dan dokumen kontrak yang berkaitan.",
    "Latihan:\n1. Huraikan skop utama modul ini dalam konteks kerja sebenar.\n2. Kenal pasti dokumen, pihak berkepentingan dan risiko utama.\n3. Sediakan contoh senarai semak atau proses kerja berdasarkan tajuk yang diberi.",
    "Skema Jawapan:\nJawapan perlu menyatakan skop kerja, langkah pelaksanaan, dokumen rujukan, kawalan risiko, bukti pematuhan dan cadangan penambahbaikan yang relevan dengan tred.",
  ].join("\n\n");
}

export default function ModuleBuilderPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [savedGroupings, setSavedGroupings] = useState<SavedGrouping[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [mode, setMode] = useState<"builder" | "document">("builder");
  const [draftContent, setDraftContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTrades() {
      const response = await axios.get(`${API_BASE_URL}/trades/`);

      if (!cancelled) {
        setTrades(response.data);
        setSelectedTradeId(response.data[0]?.id || null);
        setLoading(false);
      }
    }

    loadTrades().catch(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTradeId) return;
    let cancelled = false;

    async function loadGroupings() {
      const response = await axios.get(
        `${API_BASE_URL}/mapping-groupings/trade/${selectedTradeId}`,
      );

      if (!cancelled) {
        setSavedGroupings(response.data);
        setSelectedCandidateId("");
        setDraftContent("");
      }
    }

    loadGroupings().catch(() => {
      if (!cancelled) setSavedGroupings([]);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedTradeId]);

  const moduleCandidates = useMemo<ModuleCandidate[]>(
    () =>
      savedGroupings.flatMap((grouping) =>
        parseGroups(grouping).map((group, index) => ({
          id: `${grouping.id}:${group.groupId}`,
          grouping,
          group,
          groupIndex: index + 1,
        })),
      ),
    [savedGroupings],
  );

  const selectedCandidate =
    moduleCandidates.find((candidate) => candidate.id === selectedCandidateId) ||
    moduleCandidates[0] ||
    null;

  function generateDraft() {
    const content = buildDraftContent(selectedCandidate);
    setDraftContent(content);
    setMode("builder");
    setMessage("Huraian modul dijana daripada hasil mapping. Semak dan edit sebelum Document Mode.");
  }

  const selectedTrade = trades.find((trade) => trade.id === selectedTradeId);
  const documentSections = draftContent.split(/\n\n+/).filter(Boolean);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Module Builder
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Pembangunan Modul SKP
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Pilih hasil mapping, bina huraian modul, kemudian semak dalam
              Document Mode. Setiap Group daripada Mapping dianggap sebagai 1
              Modul.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedTradeId || ""}
              onChange={(event) => setSelectedTradeId(Number(event.target.value))}
              className="min-w-80 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
            >
              {trades.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  {trade.code} - {trade.title}
                </option>
              ))}
            </select>

            <select
              value={selectedCandidate?.id || ""}
              onChange={(event) => {
                setSelectedCandidateId(event.target.value);
                setDraftContent("");
                setMessage("");
              }}
              className="min-w-96 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
            >
              {moduleCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.grouping.source_code} / Group {candidate.groupIndex} - {candidate.group.title}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Selected Tred", selectedTrade?.code || "-"],
            ["Saved Mapping", savedGroupings.length],
            ["Calon Modul", moduleCandidates.length],
            ["Mode", mode === "builder" ? "Builder" : "Document"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Senarai Modul Dalam Pembangunan
              </h2>
            </div>

            <div className="max-h-[760px] divide-y divide-slate-100 overflow-y-auto">
              {loading ? (
                <p className="p-5 text-sm text-slate-500">Loading...</p>
              ) : moduleCandidates.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  Belum ada saved grouping. Simpan hasil Mapping dahulu.
                </p>
              ) : (
                moduleCandidates.map((candidate) => {
                  const isSelected = selectedCandidate?.id === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => {
                        setSelectedCandidateId(candidate.id);
                        setDraftContent("");
                        setMessage("");
                      }}
                      className={[
                        "w-full px-5 py-4 text-left transition",
                        isSelected ? "bg-blue-50" : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <p className="text-xs font-bold uppercase text-blue-600">
                        {candidate.grouping.source_code} / Group {candidate.groupIndex}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {candidate.group.title}
                      </p>
                      {candidate.group.subtitle && (
                        <p className="mt-2 text-xs font-semibold text-slate-600">
                          {candidate.group.subtitle}
                        </p>
                      )}
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-500">
                        {candidate.group.blocks.slice(0, 3).map((block) => (
                          <li key={block.id}>{block.title}</li>
                        ))}
                      </ul>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-blue-600">
                  {selectedCandidate
                    ? `${selectedCandidate.grouping.source_code} / Group ${selectedCandidate.groupIndex}`
                    : "Hasil Mapping"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedCandidate?.group.title || "Pilih hasil mapping"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedCandidate?.group.subtitle ||
                    "Pilih saved grouping untuk bina modul."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode("builder")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${
                    mode === "builder"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Builder Mode
                </button>
                <button
                  type="button"
                  onClick={() => setMode("document")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${
                    mode === "document"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Document Mode
                </button>
                <button
                  type="button"
                  onClick={generateDraft}
                  disabled={!selectedCandidate}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  Jana AI
                </button>
              </div>
            </div>

            {message && (
              <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                {message}
              </p>
            )}

            {mode === "builder" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase text-blue-700">
                    Editing Tools
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Highlight teks dalam kotak huraian, kemudian pilih tindakan
                    yang sesuai.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "Tambah Huraian",
                      "Jana Gambar",
                      "Carta",
                      "Jadual",
                      "Proses Flow",
                      "Rujukan",
                      "Latihan",
                    ].map((tool) => (
                      <button
                        key={tool}
                        type="button"
                        className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-100"
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={draftContent}
                  onChange={(event) => setDraftContent(event.target.value)}
                  className="min-h-[560px] w-full rounded-2xl border border-blue-300 bg-white p-5 font-serif text-sm leading-7 text-slate-900 outline-none focus:border-blue-600"
                  placeholder={[
                    "Tajuk:",
                    "",
                    "Objektif:",
                    "",
                    "Penerangan:",
                    "",
                    "1) Tajuk diambil daripada mapping",
                    "1.1 Sub tajuk diambil daripada mapping",
                    "1.2 Isi penting",
                    "",
                    "Rujukan:",
                    "Latihan:",
                    "Skema Jawapan:",
                  ].join("\n")}
                />
              </div>
            ) : (
              <div className="mt-6 bg-slate-100 p-6">
                <article className="mx-auto min-h-[760px] max-w-4xl bg-white px-12 py-10 font-serif text-slate-900 shadow-sm">
                  <p className="text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                    Learning Package
                  </p>
                  <h2 className="mt-3 text-center text-2xl font-bold">
                    {selectedCandidate?.group.title || "Dokumen Modul"}
                  </h2>
                  <p className="mt-2 text-center text-sm text-slate-500">
                    {selectedTrade
                      ? `${selectedTrade.code} - ${selectedTrade.title}`
                      : "SKP-CIDB Builder"}
                  </p>

                  <div className="mt-10 space-y-6 text-sm leading-7">
                    {documentSections.length === 0 ? (
                      <p className="text-slate-500">
                        Jana atau tulis huraian di Builder Mode dahulu.
                      </p>
                    ) : (
                      documentSections.map((section, index) => {
                        const [heading, ...rest] = section.split("\n");
                        return (
                          <section key={`${heading}-${index}`}>
                            <h3 className="font-bold">{heading}</h3>
                            <p className="mt-2 whitespace-pre-line">
                              {rest.join("\n")}
                            </p>
                          </section>
                        );
                      })
                    )}
                  </div>
                </article>
              </div>
            )}
          </main>
        </section>
      </div>
    </AppShell>
  );
}
