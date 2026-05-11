"use client";

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
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

const COMPETENCY_OPTIONS = [
  ["C01", "Business Operation Management"],
  ["C02", "Tendering Management"],
  ["C03", "Contract Implementation & Management"],
  ["C04", "Project Planning & Scheduling"],
  ["C05", "Construction Operation Management"],
  ["C06", "Project Handover"],
  ["C07", "Others"],
] as const;

function getCompetencyCode(grouping: SavedGrouping) {
  if (grouping.source_code === "TAMBAHAN") return "C07";
  return grouping.source_code;
}

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

function getInsertLabel(type: string) {
  const labels: Record<string, string> = {
    "Jana Gambar": "CADANGAN GAMBAR",
    Carta: "CARTA",
    Jadual: "JADUAL",
    "Proses Flow": "PROSES FLOW",
    "Tambah Huraian": "HURAIAN TAMBAHAN",
    Rujukan: "RUJUKAN TAMBAHAN",
    Latihan: "LATIHAN TAMBAHAN",
  };

  return labels[type] || "BAHAN SOKONGAN";
}

function parseMarkdownTableBlock(content: string) {
  const rows = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"))
    .filter((line) => !/^\|\s*[-:\s|]+\|?$/.test(line))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
    .filter((row) => row.length > 0);

  if (rows.length < 2) return null;

  return {
    headers: rows[0],
    body: rows.slice(1),
  };
}

function renderContentBlock(section: string, index: number) {
  const labelMatch = section.match(/^\[(.+?)\]\n([\s\S]*?)\n\[TAMAT .+?\]$/);

  if (labelMatch) {
    const label = labelMatch[1];
    const body = labelMatch[2].trim();
    const table = parseMarkdownTableBlock(body);

    if (label.includes("JADUAL") && table) {
      return (
        <section key={`block-${index}`} className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h4 className="text-sm font-bold uppercase text-slate-700">{label}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {table.headers.map((header, headerIndex) => (
                    <th
                      key={`${header}-${headerIndex}`}
                      className="px-4 py-3 font-bold text-slate-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.body.map((row, rowIndex) => (
                  <tr key={`table-row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${rowIndex}-${cellIndex}`}
                        className="px-4 py-3 align-top leading-6 text-slate-700"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    return (
      <section
        key={`block-${index}`}
        className="rounded-xl border border-blue-100 bg-blue-50 p-4"
      >
        <h4 className="text-sm font-bold uppercase text-blue-700">{label}</h4>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
          {body}
        </p>
      </section>
    );
  }

  const [heading, ...rest] = section.split("\n");

  return (
    <section key={`section-${index}`} className="space-y-2">
      <h3 className="font-bold text-slate-900">{heading}</h3>
      {rest.length > 0 && (
        <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
          {rest.join("\n")}
        </p>
      )}
    </section>
  );
}

export default function ModuleBuilderPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [savedGroupings, setSavedGroupings] = useState<SavedGrouping[]>([]);
  const [selectedCompetencyCode, setSelectedCompetencyCode] = useState("C01");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [mode, setMode] = useState<"builder" | "document">("builder");
  const [builderView, setBuilderView] = useState<"edit" | "preview">("edit");
  const [draftContent, setDraftContent] = useState("");
  const [message, setMessage] = useState("");
  const [activeTool, setActiveTool] = useState("");
  const [selectedEditorText, setSelectedEditorText] = useState("");
  const [insertSource, setInsertSource] = useState("");
  const [insertType, setInsertType] = useState("Jadual");
  const [insertResult, setInsertResult] = useState("");
  const [loading, setLoading] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

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

  const filteredCandidates = useMemo(
    () =>
      moduleCandidates.filter(
        (candidate) =>
          getCompetencyCode(candidate.grouping) === selectedCompetencyCode,
      ),
    [moduleCandidates, selectedCompetencyCode],
  );

  const selectedCandidate =
    filteredCandidates.find((candidate) => candidate.id === selectedCandidateId) ||
    filteredCandidates[0] ||
    null;

  function getMappingContext(candidate: ModuleCandidate | null) {
    if (!candidate) return "";

    return candidate.group.blocks
      .map((block, index) => {
        const items = block.items
          .filter(Boolean)
          .map((item) => `- ${item}`)
          .join("\n");
        return `${index + 1}. ${block.title}\nSub tajuk: ${block.subtitle || "-"}\n${items}`;
      })
      .join("\n\n");
  }

  function getSelectedEditorText() {
    const editor = editorRef.current;
    if (!editor) return "";
    return draftContent.slice(editor.selectionStart, editor.selectionEnd).trim();
  }

  function refreshSelectedEditorText() {
    setSelectedEditorText(getSelectedEditorText());
  }

  function insertIntoEditor(content: string, replaceSelection = false) {
    const editor = editorRef.current;

    if (!editor || !replaceSelection) {
      setDraftContent((current) =>
        current.trim() ? `${current.trim()}\n\n${content}` : content,
      );
      return;
    }

    const before = draftContent.slice(0, editor.selectionStart);
    const after = draftContent.slice(editor.selectionEnd);
    setDraftContent(`${before}${content}${after}`);
  }

  async function runAITool(action: string) {
    if (!selectedCandidate) {
      setMessage("Pilih group modul dahulu.");
      return;
    }

    const selectedText = getSelectedEditorText();
    setActiveTool(action);
    setMessage(`${action} sedang dijana...`);

    try {
      const response = await axios.post<{ content: string }>(
        `${API_BASE_URL}/module-builder-ai/generate`,
        {
          action,
          trade_title: selectedTrade
            ? `${selectedTrade.code} - ${selectedTrade.title}`
            : "",
          competency_code: getCompetencyCode(selectedCandidate.grouping),
          competency_title: selectedCandidate.grouping.source_title,
          group_title: selectedCandidate.group.title,
          group_subtitle: selectedCandidate.group.subtitle,
          mapping_context: getMappingContext(selectedCandidate),
          current_content: draftContent,
          selected_text: selectedText,
        },
      );

      if (action === "Jana AI") {
        setDraftContent(response.data.content);
      } else {
        insertIntoEditor(response.data.content, Boolean(selectedText));
      }

      setMode("builder");
      setBuilderView("edit");
      setSelectedEditorText("");
      setMessage(`${action} selesai. Semak dan edit kandungan sebelum Document Mode.`);
    } catch (err) {
      if (action === "Jana AI") {
        setDraftContent(buildDraftContent(selectedCandidate));
        setMessage("AI backend gagal, draf asas daripada mapping telah digunakan.");
      } else {
        setMessage(`${action} gagal. Cuba highlight teks yang lebih khusus atau semak backend AI.`);
      }
      console.error(err);
    } finally {
      setActiveTool("");
    }
  }

  function generateDraft() {
    runAITool("Jana AI");
    setMode("builder");
  }

  async function generateInsertBlock() {
    if (!selectedCandidate) {
      setMessage("Pilih group modul dahulu.");
      return;
    }

    if (!insertSource.trim()) {
      setMessage("Paste maklumat sumber di panel kanan dahulu.");
      return;
    }

    setActiveTool(insertType);
    setMessage(`${insertType} sedang dijana daripada maklumat panel kanan...`);

    try {
      const response = await axios.post<{ content: string }>(
        `${API_BASE_URL}/module-builder-ai/generate`,
        {
          action: insertType,
          trade_title: selectedTrade
            ? `${selectedTrade.code} - ${selectedTrade.title}`
            : "",
          competency_code: getCompetencyCode(selectedCandidate.grouping),
          competency_title: selectedCandidate.grouping.source_title,
          group_title: selectedCandidate.group.title,
          group_subtitle: selectedCandidate.group.subtitle,
          mapping_context: getMappingContext(selectedCandidate),
          current_content: draftContent,
          selected_text: insertSource,
        },
      );

      setInsertResult(response.data.content);
      setMessage(`${insertType} selesai. Semak hasil di panel kanan sebelum masukkan ke huraian.`);
    } catch (err) {
      setMessage(`${insertType} gagal dijana. Cuba pendekkan maklumat sumber atau semak backend AI.`);
      console.error(err);
    } finally {
      setActiveTool("");
    }
  }

  function insertGeneratedBlock() {
    if (!insertResult.trim()) {
      setMessage("Tiada hasil untuk dimasukkan.");
      return;
    }

    const blockToInsert = [
      `[${getInsertLabel(insertType)}]`,
      insertResult.trim(),
      `[TAMAT ${getInsertLabel(insertType)}]`,
    ].join("\n");

    const nextContent = draftContent.trim()
      ? `${draftContent.trim()}\n\n${blockToInsert}`
      : blockToInsert;

    setDraftContent(nextContent);
    setInsertResult("");
    setMode("builder");
    setBuilderView("preview");
    setMessage(`${getInsertLabel(insertType)} telah dimasukkan di hujung huraian.`);

    window.setTimeout(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      editor.scrollTop = editor.scrollHeight;
      editor.selectionStart = nextContent.length;
      editor.selectionEnd = nextContent.length;
    }, 0);
  }

  function renderResultPreview() {
    if (!insertResult.trim()) {
      return (
        <p className="text-sm text-slate-500">
          Preview visual akan dipaparkan selepas jana bahan sokongan.
        </p>
      );
    }

    const lines = insertResult.split("\n").filter((line) => line.trim());
    const tableLines = lines.filter((line) => line.trim().startsWith("|"));

    if (tableLines.length >= 2) {
      const rows = tableLines
        .filter((line) => !/^\|\s*-+/.test(line.trim()))
        .map((line) =>
          line
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim()),
        )
        .filter((row) => row.length > 0);
      const [head, ...body] = rows;

      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            {head && (
              <thead className="bg-slate-50">
                <tr>
                  {head.map((cell, index) => (
                    <th key={`${cell}-${index}`} className="px-3 py-2 font-bold text-slate-700">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100 bg-white">
              {body.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top text-slate-600">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
        <p className="whitespace-pre-line">{insertResult}</p>
      </div>
    );
  }

  const selectedTrade = trades.find((trade) => trade.id === selectedTradeId);
  const documentSections = draftContent.split(/\n\n+/).filter(Boolean);
  const renderedSections = documentSections.map((section, index) =>
    renderContentBlock(section, index),
  );

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
              value={selectedCompetencyCode}
              onChange={(event) => {
                setSelectedCompetencyCode(event.target.value);
                setSelectedCandidateId("");
                setDraftContent("");
                setMessage("");
              }}
              className="min-w-96 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
            >
              {COMPETENCY_OPTIONS.map(([code, title]) => (
                <option key={code} value={code}>
                  {code}: {title}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Selected Tred", selectedTrade?.code || "-"],
            ["Saved Mapping", savedGroupings.length],
            ["Calon Modul", filteredCandidates.length],
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

        <section className="grid gap-6 xl:grid-cols-[320px_1fr_360px]">
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Senarai Modul Dalam Pembangunan
              </h2>
            </div>

            <div className="max-h-[760px] divide-y divide-slate-100 overflow-y-auto">
              {loading ? (
                <p className="p-5 text-sm text-slate-500">Loading...</p>
              ) : filteredCandidates.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  Belum ada group untuk competency ini. Simpan hasil Mapping
                  dahulu atau pilih competency lain.
                </p>
              ) : (
                filteredCandidates.map((candidate) => {
                  const isSelected = selectedCandidate?.id === candidate.id;
                  const competencyCode = getCompetencyCode(candidate.grouping);
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
                        {competencyCode} / Group {candidate.groupIndex}
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
                    ? `${getCompetencyCode(selectedCandidate.grouping)} / Group ${selectedCandidate.groupIndex}`
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
                  disabled={!selectedCandidate || Boolean(activeTool)}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {activeTool === "Jana AI" ? "Menjana..." : "Jana AI"}
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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-blue-700">
                        Editing Tools
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Highlight teks dalam kotak huraian, kemudian pilih
                        tindakan yang sesuai.
                      </p>
                    </div>
                    <div className="flex rounded-xl bg-white p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setBuilderView("edit")}
                        className={`rounded-lg px-3 py-2 text-xs font-bold ${
                          builderView === "edit"
                            ? "bg-blue-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        Edit Teks
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuilderView("preview")}
                        className={`rounded-lg px-3 py-2 text-xs font-bold ${
                          builderView === "preview"
                            ? "bg-blue-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        Preview Modul
                      </button>
                    </div>
                  </div>
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
                        onClick={() => runAITool(tool)}
                        disabled={!selectedCandidate || Boolean(activeTool)}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-100"
                      >
                        {activeTool === tool ? "Menjana..." : tool}
                      </button>
                    ))}
                  </div>
                </div>

                {builderView === "edit" && selectedEditorText && (
                  <div className="sticky top-3 z-10 rounded-2xl border border-slate-300 bg-white p-4 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Teks Dipilih
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                          {selectedEditorText}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Tambah Huraian",
                          "Jana Gambar",
                          "Carta",
                          "Jadual",
                          "Proses Flow",
                        ].map((tool) => (
                          <button
                            key={`selected-${tool}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => runAITool(tool)}
                            disabled={!selectedCandidate || Boolean(activeTool)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {activeTool === tool ? "Menjana..." : tool}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {builderView === "edit" ? (
                  <textarea
                    ref={editorRef}
                    value={draftContent}
                    onChange={(event) => setDraftContent(event.target.value)}
                    onSelect={refreshSelectedEditorText}
                    onKeyUp={refreshSelectedEditorText}
                    onMouseUp={refreshSelectedEditorText}
                    className="min-h-[560px] w-full rounded-2xl border border-blue-300 bg-white p-5 font-serif text-sm leading-7 text-slate-900 outline-none focus:border-blue-600"
                    placeholder={[
                      "Tajuk",
                      "",
                      "Objektif Pembelajaran",
                      "",
                      "Penerangan Modul",
                      "",
                      "1. Tajuk diambil daripada mapping",
                      "1.1 Sub tajuk diambil daripada mapping",
                      "1.2 Isi penting",
                      "",
                      "Rujukan",
                      "Latihan",
                      "Skema Jawapan",
                    ].join("\n")}
                  />
                ) : (
                  <div className="min-h-[560px] space-y-6 rounded-2xl border border-slate-200 bg-white p-6 font-serif">
                    {renderedSections.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Jana atau tulis huraian di Edit Teks dahulu.
                      </p>
                    ) : (
                      renderedSections
                    )}
                  </div>
                )}
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
                      renderedSections
                    )}
                  </div>
                </article>
              </div>
            )}
          </main>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-blue-600">
                AI Insert Builder
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Jana Bahan Sokongan
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Paste petikan atau nota ringkas di sini, jana bahan sokongan,
                kemudian masukkan hasilnya ke huraian modul.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="text-xs font-bold uppercase text-slate-500">
                Jenis Bahan
              </label>
              <select
                value={insertType}
                onChange={(event) => {
                  setInsertType(event.target.value);
                  setInsertResult("");
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500"
              >
                <option value="Jana Gambar">Cadangan Gambar</option>
                <option value="Carta">Carta Ringkas</option>
                <option value="Jadual">Jadual Ringkas</option>
                <option value="Proses Flow">Proses Flow</option>
                <option value="Tambah Huraian">Tambah Huraian</option>
                <option value="Rujukan">Rujukan</option>
                <option value="Latihan">Latihan</option>
              </select>

              <label className="mt-4 block text-xs font-bold uppercase text-slate-500">
                Maklumat Sumber
              </label>
              <textarea
                value={insertSource}
                onChange={(event) => setInsertSource(event.target.value)}
                className="mt-2 min-h-44 w-full rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-500"
                placeholder="Paste perenggan, point penting, atau petikan huraian di sini."
              />

              <button
                type="button"
                onClick={generateInsertBlock}
                disabled={Boolean(activeTool) || !selectedCandidate}
                className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {activeTool === insertType ? "Menjana..." : `Jana ${insertType}`}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900">Hasil Jana</h3>
                <button
                  type="button"
                  onClick={insertGeneratedBlock}
                  disabled={!insertResult.trim()}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Masukkan
                </button>
              </div>

              <div className="mt-3">
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                  Preview
                </p>
                {renderResultPreview()}
              </div>

              <p className="mt-4 text-xs font-bold uppercase text-slate-500">
                Teks Boleh Edit
              </p>
              <textarea
                value={insertResult}
                onChange={(event) => setInsertResult(event.target.value)}
                className="mt-3 min-h-64 w-full rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-500"
                placeholder="Hasil gambar/carta/jadual/flow akan dipaparkan di sini untuk disemak."
              />
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
