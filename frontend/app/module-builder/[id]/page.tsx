"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { API_BASE_URL } from "@/src/lib/api";

type SKPModule = {
  id: number;
  trade_id: number;
  code: string;
  title: string;
  objective?: string;
  description?: string;
  status: string;
};

type LearningPackage = {
  id: number;
  module_id: number;
  code: string;
  title: string;
  objective?: string;
  description?: string;
  content_outline?: string;
  references?: string;
  exercises?: string;
  answer_scheme?: string;
  status: string;
};

type ContentBlock = {
  id: number;
  module_id?: number | null;
  package_id?: number | null;
  block_type: string;
  title?: string;
  content?: string;
  metadata_json?: string;
  sort_order: number;
  ai_generated: boolean;
  review_status: string;
};

type InlineGeneratedBlock = {
  type: "Gambar" | "Rajah" | "Jadual" | "Carta";
  sourceText: string;
  content: string;
};

const MAPPING_EXPLANATION_SECTIONS = [
  {
    title: "Pengenalan",
    subtopics: [
      "Merangkumi reka bentuk, pembinaan, pemeriksaan dan penyelenggaraan jambatan bagi pelbagai jenis struktur seperti konkrit, keluli dan komposit.",
      "Fokus kepada kestabilan struktur, keselamatan beban, kaedah pembinaan dan kawalan mutu bahan.",
      "Menitikberatkan kepatuhan terhadap piawaian kejuruteraan dan peraturan keselamatan jalan.",
      "Menyokong kelancaran sistem pengangkutan dan hubungan antara kawasan.",
    ],
  },
  {
    title: "Pengurusan Pemeriksaan dan Ujian Struktur Jambatan",
    subtopics: [
      "Jenis pemeriksaan jambatan seperti routine inspection, principal inspection dan special inspection.",
      "Prosedur pemeriksaan visual dan ujian bukan musnah (NDT) seperti UPV, Rebound Hammer, Half-cell Potential dan Covermeter.",
      "Kaedah penilaian keadaan struktur jambatan menggunakan Bridge Condition Index (BCI).",
      "Standard rujukan seperti AASHTO Manual for Bridge Evaluation, JKR Bridge Inspection Manual dan BS EN 1504.",
      "Penyediaan Bridge Inspection Report mengikut format JKR atau LLM.",
    ],
  },
  {
    title: "Pengurusan Data dan Dokumentasi Jambatan",
    subtopics: [
      "Penggunaan Bridge Management System (BMS) untuk penyimpanan data struktur.",
      "Integrasi maklumat dengan sistem GIS, Digital Twin dan Drone Visual Mapping.",
      "Penyediaan inspection log sheet, defect photo record dan maintenance tracking sheet.",
      "Hubungan data pemeriksaan dengan tuntutan Interim Certificate dan Maintenance Contract.",
    ],
  },
  {
    title: "Pengurusan Ujian Beban dan Keselamatan Struktur",
    subtopics: [
      "Ujian beban statik dan dinamik seperti static load test dan dynamic response test.",
      "Analisis keputusan ujian untuk menilai kapasiti beban jambatan.",
      "Pengurusan risiko semasa ujian beban seperti safety barricade dan monitoring equipment.",
      "Prosedur kelulusan semula jambatan selepas kerja pembaikan atau pengukuhan struktur.",
    ],
  },
];
const BLOCK_TYPES = [
  { value: "lp_title", label: "TAJUK" },
  { value: "objective", label: "OBJEKTIF" },
  { value: "explanation", label: "PENERANGAN" },
  { value: "section", label: "Seksyen Bernombor" },
  { value: "subsection", label: "Subseksyen" },
  { value: "figure", label: "Rajah / Gambar" },
  { value: "table", label: "Jadual" },
  { value: "diagram", label: "Rajah Proses" },
  { value: "chart", label: "Carta" },
  { value: "reference", label: "RUJUKAN" },
  { value: "exercise", label: "LATIHAN" },
  { value: "answer_scheme", label: "SKEMA JAWAPAN" },
  { value: "appendix", label: "LAMPIRAN" },
];

const DOCUMENT_SEQUENCE = [
  "lp_title",
  "objective",
  "explanation",
  "section",
  "subsection",
  "figure",
  "table",
  "diagram",
  "chart",
  "reference",
  "exercise",
  "answer_scheme",
  "appendix",
];

export default function ModuleAuthoringPage() {
  const params = useParams();
  const moduleId = params.id as string;
  const [mode, setMode] = useState<"builder" | "document">("builder");
  const [moduleItem, setModuleItem] = useState<SKPModule | null>(null);
  const [packages, setPackages] = useState<LearningPackage[]>([]);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [activePackageId, setActivePackageId] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [blockType, setBlockType] = useState("explanation");
  const [blockTitle, setBlockTitle] = useState("");
  const [blockContent, setBlockContent] = useState("");
  const [blockOrder, setBlockOrder] = useState(1);
  const [aiPrompt, setAiPrompt] = useState("");
  const [subsectionDrafts, setSubsectionDrafts] = useState<Record<number, string>>({});
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, string>>({});
  const [selectedDraftKey, setSelectedDraftKey] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [inlineBlocks, setInlineBlocks] = useState<Record<string, InlineGeneratedBlock[]>>({});
  const [loading, setLoading] = useState(true);

  const activePackage = packages.find((item) => item.id === activePackageId);
  const moduleBlocks = blocks.filter((block) => !block.package_id);
  const packageBlocks = activePackageId
    ? blocks.filter((block) => block.package_id === activePackageId)
    : [];
  const visibleBlocks = activePackageId ? packageBlocks : moduleBlocks;
  const documentBlocks = [...visibleBlocks].sort((a, b) => {
    const typeOrder =
      DOCUMENT_SEQUENCE.indexOf(a.block_type) - DOCUMENT_SEQUENCE.indexOf(b.block_type);

    if (typeOrder !== 0) return typeOrder;

    return a.sort_order - b.sort_order;
  });
  const explanationBlocks = documentBlocks.filter((block) =>
    ["explanation", "section", "subsection", "figure", "table", "diagram", "chart"].includes(
      block.block_type,
    ),
  );
  const referenceBlocks = documentBlocks.filter(
    (block) => block.block_type === "reference",
  );
  const exerciseBlocks = documentBlocks.filter(
    (block) => block.block_type === "exercise",
  );
  const answerBlocks = documentBlocks.filter(
    (block) => block.block_type === "answer_scheme",
  );
  const titleBlocks = documentBlocks.filter((block) => block.block_type === "lp_title");
  const objectiveBlocks = documentBlocks.filter(
    (block) => block.block_type === "objective",
  );
  const sectionBlocks = documentBlocks.filter((block) => block.block_type === "section");
  const subsectionBlocks = documentBlocks.filter(
    (block) => block.block_type === "subsection",
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      try {
        const [moduleResponse, packageResponse, blockResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/skp-modules/${moduleId}`),
          axios.get(`${API_BASE_URL}/learning-packages/module/${moduleId}`),
          axios.get(`${API_BASE_URL}/module-content-blocks/module/${moduleId}`),
        ]);

        if (!cancelled) {
          setModuleItem(moduleResponse.data);
          setPackages(packageResponse.data);
          setBlocks(blockResponse.data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  async function refreshBlocks() {
    const response = await axios.get(
      `${API_BASE_URL}/module-content-blocks/module/${moduleId}`,
    );
    setBlocks(response.data);
  }

  function resetBlockForm() {
    setEditingBlockId(null);
    setBlockType("explanation");
    setBlockTitle("");
    setBlockContent("");
    setBlockOrder(visibleBlocks.length + 1);
  }

  function getBlockTypeLabel(type: string) {
    return BLOCK_TYPES.find((item) => item.value === type)?.label || type;
  }

  function getPrimaryTitle() {
    return activePackage?.title || moduleItem?.title || "";
  }

  function readBlockMeta(block: ContentBlock) {
    try {
      return block.metadata_json ? JSON.parse(block.metadata_json) : {};
    } catch {
      return {};
    }
  }

  function getSectionNumber(block: ContentBlock) {
    return Math.max(1, Math.floor(block.sort_order / 1000));
  }

  function getSectionSubsections(section: ContentBlock) {
    const sectionNumber = getSectionNumber(section);
    return subsectionBlocks
      .filter((block) => getSectionNumber(block) === sectionNumber)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function getSubsectionAssets(subsection: ContentBlock) {
    return visibleBlocks
      .filter((block) => readBlockMeta(block).parentSubsectionId === subsection.id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function getMappingSource() {
    return (
      activePackage?.content_outline ||
      activePackage?.description ||
      moduleItem?.description ||
      moduleItem?.objective ||
      ""
    );
  }

  function parseMappingSections(source: string) {
    const lines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const sections: { title: string; subtopics: string[] }[] = [];

    for (const line of lines) {
      const sectionMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
      const numberedSubtopicMatch = line.match(/^\d+\.\d+[.)]?\s+(.+)$/);
      const bulletMatch = line.match(/^[-*•]\s+(.+)$/);

      if (sectionMatch) {
        sections.push({ title: sectionMatch[2].trim(), subtopics: [] });
        continue;
      }

      if (numberedSubtopicMatch) {
        if (sections.length === 0) {
          sections.push({ title: getPrimaryTitle() || "Penerangan", subtopics: [] });
        }
        sections[sections.length - 1].subtopics.push(numberedSubtopicMatch[1].trim());
        continue;
      }

      if (bulletMatch) {
        if (sections.length === 0) {
          sections.push({ title: getPrimaryTitle() || "Penerangan", subtopics: [] });
        }
        sections[sections.length - 1].subtopics.push(bulletMatch[1].trim());
      }
    }

    if (sections.length === 0 && source.trim()) {
      sections.push({
        title: getPrimaryTitle() || "Penerangan",
        subtopics: source
          .split(/[.;]\s+/)
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 6),
      });
    }

    return sections;
  }

  async function createContentBlock(payload: Partial<ContentBlock>) {
    await axios.post(`${API_BASE_URL}/module-content-blocks/`, {
      module_id: Number(moduleId),
      package_id: activePackageId,
      block_type: payload.block_type || "explanation",
      title: payload.title || "",
      content: payload.content || "",
      metadata_json: payload.metadata_json || "",
      sort_order: payload.sort_order || visibleBlocks.length + 1,
      ai_generated: payload.ai_generated || false,
      review_status: payload.review_status || "Draft",
    });
  }

  async function generateSectionsFromMapping() {
    if (!activePackageId) {
      window.alert("Pilih Learning Package dahulu supaya ruang ini disimpan pada PL yang betul.");
      return;
    }

    if (
      sectionBlocks.length > 0 &&
      !window.confirm("Ruang Penerangan sudah wujud. Tambah lagi ruang daripada mapping?")
    ) {
      return;
    }

    const sections = parseMappingSections(getMappingSource());

    if (sections.length === 0) {
      window.alert("Tiada kandungan mapping ditemui untuk dijana.");
      return;
    }

    const startNumber =
      sectionBlocks.length === 0
        ? 1
        : Math.max(...sectionBlocks.map((block) => getSectionNumber(block))) + 1;

    for (const [sectionIndex, section] of sections.entries()) {
      const sectionNumber = startNumber + sectionIndex;
      await createContentBlock({
        block_type: "section",
        title: section.title,
        content: "",
        sort_order: sectionNumber * 1000,
        metadata_json: JSON.stringify({ source: "mapping" }),
      });

      for (const [subtopicIndex, subtopic] of section.subtopics.entries()) {
        await createContentBlock({
          block_type: "subsection",
          title: subtopic,
          content: "",
          sort_order: sectionNumber * 1000 + subtopicIndex + 1,
          metadata_json: JSON.stringify({ source: "mapping" }),
        });
      }
    }

    await refreshBlocks();
  }

  async function addManualSection() {
    const title = window.prompt("Tajuk bahagian Penerangan");
    if (!title?.trim()) return;

    const nextNumber =
      sectionBlocks.length === 0
        ? 1
        : Math.max(...sectionBlocks.map((block) => getSectionNumber(block))) + 1;

    await createContentBlock({
      block_type: "section",
      title: title.trim(),
      content: "",
      sort_order: nextNumber * 1000,
      metadata_json: JSON.stringify({ source: "manual" }),
    });
    await refreshBlocks();
  }

  async function addManualSubsection(section: ContentBlock) {
    const title = window.prompt(`Subtajuk untuk ${section.title}`);
    if (!title?.trim()) return;

    const subsections = getSectionSubsections(section);
    await createContentBlock({
      block_type: "subsection",
      title: title.trim(),
      content: "",
      sort_order: section.sort_order + subsections.length + 1,
      metadata_json: JSON.stringify({ source: "manual" }),
    });
    await refreshBlocks();
  }

  async function saveSubsectionNotes(subsection: ContentBlock) {
    const payload = {
      ...subsection,
      content: subsectionDrafts[subsection.id] ?? subsection.content ?? "",
    };
    await axios.put(`${API_BASE_URL}/module-content-blocks/${subsection.id}`, payload);
    await refreshBlocks();
  }

  function createScopedNote(section: ContentBlock, subsection: ContentBlock) {
    const siblings = getSectionSubsections(section)
      .filter((item) => item.id !== subsection.id)
      .map((item) => item.title)
      .join(", ");
    const draft = [
      `Nota pembelajaran untuk ${subsection.title}.`,
      `Skop nota ini dikunci kepada subtajuk ini sahaja di bawah bahagian ${section.title}.`,
      siblings
        ? `Elakkan menghuraikan tajuk lain seperti: ${siblings}. Tajuk tersebut perlu dihuraikan dalam ruang masing-masing.`
        : "",
      "Huraian dicadangkan:",
      `1. Terangkan maksud dan kepentingan ${subsection.title} dalam konteks ${getPrimaryTitle()}.`,
      "2. Nyatakan langkah kerja, dokumen, standard atau bukti yang berkaitan.",
      "3. Sertakan contoh situasi sebenar, risiko utama dan kaedah kawalan.",
      "4. Akhiri dengan ringkasan perkara yang peserta perlu kuasai.",
    ]
      .filter(Boolean)
      .join("\n\n");

    setSubsectionDrafts((current) => ({
      ...current,
      [subsection.id]: draft,
    }));
  }

  function updateSectionDraft(key: string, value: string) {
    setSectionDrafts((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function generateSectionDraft(key: string, title: string) {
    updateSectionDraft(
      key,
      [
        `${title}`,
        "",
        "Masukkan huraian pembelajaran di sini. Kandungan perlu menjelaskan konsep utama, kepentingan dalam konteks kerja sebenar, langkah kerja, dokumen sokongan, risiko utama dan bukti kompetensi yang perlu disediakan.",
        "",
        "Nota ini dijana sebagai draf awal dan perlu disemak oleh fasilitator serta panel sebelum dimuktamadkan.",
      ].join("\n"),
    );
  }

  function saveSectionDraft(key: string) {
    setSectionDrafts((current) => ({
      ...current,
      [`${key}_status`]: "Saved",
    }));
  }

  function captureHighlightedText(key: string) {
    const selection = window.getSelection()?.toString().trim() || "";

    if (!selection) return;

    setSelectedDraftKey(key);
    setSelectedText(selection);
  }

  function generateInlineBlock(type: InlineGeneratedBlock["type"]) {
    if (!selectedDraftKey || !selectedText) return;

    const contentByType = {
      Gambar: `Cadangan gambar: paparkan visual sebenar berkaitan "${selectedText}". Sertakan caption, sumber imej dan nota hak cipta.`,
      Rajah: `Rajah proses berdasarkan perenggan dipilih:\nInput / Keperluan -> Proses Kerja -> Semakan -> Output -> Rekod / Bukti`,
      Jadual: `Perkara | Huraian | Bukti\nSkop | ${selectedText} | Dokumen / rekod sokongan\nRisiko | Kenal pasti risiko utama | Kaedah kawalan\nOutput | Hasil yang perlu disediakan | Laporan / checklist`,
      Carta: `Komponen | Tahap\nKepentingan | Tinggi\nRisiko | Sederhana\nKeperluan dokumentasi | Tinggi`,
    };

    setInlineBlocks((current) => ({
      ...current,
      [selectedDraftKey]: [
        ...(current[selectedDraftKey] || []),
        {
          type,
          sourceText: selectedText,
          content: contentByType[type],
        },
      ],
    }));
    setSelectedText("");
    setSelectedDraftKey("");
  }

  function renderInlineBlocks(key: string) {
    const blocksForKey = inlineBlocks[key] || [];

    if (blocksForKey.length === 0) return null;

    return (
      <div className="mt-4 space-y-3">
        {blocksForKey.map((block, index) => (
          <div
            key={`${key}-${block.type}-${index}`}
            className="rounded-xl border border-blue-100 bg-blue-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-blue-700">
                  Blok {block.type}
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Dijana daripada teks dipilih: “{block.sourceText}”
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setInlineBlocks((current) => ({
                    ...current,
                    [key]: (current[key] || []).filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600"
              >
                Padam
              </button>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
              {block.content}
            </p>
          </div>
        ))}
      </div>
    );
  }

  async function createSubsectionAsset(
    section: ContentBlock,
    subsection: ContentBlock,
    type: "figure" | "table" | "diagram" | "chart",
  ) {
    const titleMap = {
      figure: `Rajah/Gambar: ${subsection.title}`,
      table: `Jadual: ${subsection.title}`,
      diagram: `Rajah Proses: ${subsection.title}`,
      chart: `Carta: ${subsection.title}`,
    };
    const contentMap = {
      figure:
        "Ruang visual untuk dimasukkan gambar tapak, komponen, dokumen, peralatan atau ilustrasi yang berkaitan dengan subtajuk ini.\nCaption: Nyatakan caption dan sumber imej.",
      table:
        "Bil | Perkara | Huraian | Bukti\n1 | Item utama | Huraian ringkas | Dokumen/rekod\n2 | Item sokongan | Huraian ringkas | Dokumen/rekod",
      diagram:
        `Input -> Proses ${subsection.title} -> Semakan -> Output -> Rekod`,
      chart:
        "Komponen | Keutamaan\nSkop kerja | Tinggi\nDokumen sokongan | Sederhana\nRisiko kritikal | Tinggi",
    };

    await createContentBlock({
      block_type: type,
      title: titleMap[type],
      content: contentMap[type],
      sort_order: subsection.sort_order * 100 + getSubsectionAssets(subsection).length + 1,
      metadata_json: JSON.stringify({
        parentSectionId: section.id,
        parentSubsectionId: subsection.id,
      }),
      ai_generated: true,
    });
    await refreshBlocks();
  }

  function editBlock(block: ContentBlock) {
    setEditingBlockId(block.id);
    setBlockType(block.block_type);
    setBlockTitle(block.title || "");
    setBlockContent(block.content || "");
    setBlockOrder(block.sort_order);
  }

  async function saveBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!blockContent.trim() && !blockTitle.trim()) return;

    const payload = {
      module_id: Number(moduleId),
      package_id: activePackageId,
      block_type: blockType,
      title: blockTitle,
      content: blockContent,
      metadata_json: "",
      sort_order: blockOrder,
      ai_generated: false,
      review_status: "Draft",
    };

    if (editingBlockId) {
      await axios.put(`${API_BASE_URL}/module-content-blocks/${editingBlockId}`, payload);
    } else {
      await axios.post(`${API_BASE_URL}/module-content-blocks/`, payload);
    }

    await refreshBlocks();
    resetBlockForm();
  }

  async function deleteBlock(id: number) {
    if (!window.confirm("Padam content block ini?")) return;
    await axios.delete(`${API_BASE_URL}/module-content-blocks/${id}`);
    await refreshBlocks();
  }

  function createAiDraft(kind: string) {
    const subject = activePackage?.title || moduleItem?.title || "modul ini";
    const objective = activePackage?.objective || moduleItem?.objective || "";
    const context = aiPrompt || activePackage?.content_outline || moduleItem?.description || "";

    if (kind === "note") {
      setBlockType("explanation");
      setBlockTitle(`Pengenalan ${subject}`);
      setBlockContent(
        [
          `Pengenalan kepada ${subject}.`,
          objective ? `Objektif pembelajaran: ${objective}` : "",
          context ? `Konteks pembangunan:\n${context}` : "",
          "Kandungan ini perlu disemak dan diperkukuh oleh panel mengikut keperluan tred.",
        ]
          .filter(Boolean)
          .join("\n\n"),
      );
    }

    if (kind === "objective") {
      setBlockType("objective");
      setBlockTitle("OBJEKTIF");
      setBlockContent(
        objective ||
          `Memberikan pemahaman yang jelas kepada peserta mengenai ${subject}, termasuk fungsi, kepentingan, risiko utama dan aplikasi dalam konteks kerja sebenar.`,
      );
    }

    if (kind === "table") {
      setBlockType("table");
      setBlockTitle(`Jadual Kandungan: ${subject}`);
      setBlockContent(
        "Bil | Perkara | Huraian | Bukti/Output\n1 | Skop kerja | Nyatakan skop khusus tred | Dokumen sokongan\n2 | Prosedur kerja | Susun langkah kerja utama | Checklist\n3 | Kawalan kualiti | Kaedah semakan dan pengesahan | Rekod semakan",
      );
    }

    if (kind === "diagram") {
      setBlockType("diagram");
      setBlockTitle(`Rajah Proses: ${subject}`);
      setBlockContent(
        "Input CMCS -> Tafsiran tred -> Deraf modul -> Semakan panel -> Pembangunan kandungan -> Assessment -> Review",
      );
    }

    if (kind === "chart") {
      setBlockType("chart");
      setBlockTitle(`Carta Kemajuan: ${subject}`);
      setBlockContent(
        "Komponen | Peratus\nMapping | 25\nModule Content | 35\nLearning Package | 25\nAssessment | 15",
      );
    }

    if (kind === "figure") {
      setBlockType("figure");
      setBlockTitle(`Rajah: ${subject}`);
      setBlockContent(
        `Cadangan rajah/gambar: visual yang menunjukkan ${subject}.\nCaption: Rajah menunjukkan konsep utama ${subject}.\nNota: Sertakan sumber imej dan semakan hak cipta sebelum export.`,
      );
    }

    if (kind === "reference") {
      setBlockType("reference");
      setBlockTitle("RUJUKAN");
      setBlockContent(
        "1. Akta, garis panduan, standard atau manual teknikal berkaitan.\n2. Dokumen operator / pengeluar sistem.\n3. Rujukan industri dan artikel teknikal yang disahkan panel.",
      );
    }

    if (kind === "exercise") {
      setBlockType("exercise");
      setBlockTitle(`Latihan: ${subject}`);
      setBlockContent(
        `Berdasarkan kandungan ${subject}, huraikan langkah kerja utama, dokumen yang diperlukan, risiko kritikal dan bukti kompetensi yang perlu disediakan.`,
      );
    }

    if (kind === "answer") {
      setBlockType("answer_scheme");
      setBlockTitle("SKEMA JAWAPAN");
      setBlockContent(
        "1. Jawapan perlu menyatakan konsep utama, fungsi sistem dan kaitan dengan operasi sebenar.\n2. Jawapan perlu menerangkan kepentingan integrasi, risiko dan kawalan.\n3. Jawapan perlu disokong dengan contoh dokumen, prosedur atau situasi kerja.",
      );
    }

    setBlockOrder(visibleBlocks.length + 1);
  }

  async function createLearningPackageTemplate() {
    if (!activePackageId) {
      window.alert("Pilih Learning Package dahulu sebelum jana template.");
      return;
    }

    const subject = activePackage?.title || moduleItem?.title || "Learning Package";
    const templateBlocks = [
      {
        block_type: "lp_title",
        title: "TAJUK",
        content: subject,
        sort_order: 1,
      },
      {
        block_type: "objective",
        title: "OBJEKTIF",
        content:
          activePackage?.objective ||
          `Memberikan pemahaman yang jelas kepada peserta mengenai ${subject} dalam konteks tred yang dibangunkan.`,
        sort_order: 2,
      },
      {
        block_type: "explanation",
        title: "PENERANGAN",
        content:
          activePackage?.description ||
          `Penerangan ini menghuraikan konsep, fungsi, kepentingan dan aplikasi ${subject}.`,
        sort_order: 3,
      },
      {
        block_type: "section",
        title: `1) PENGENALAN ${subject.toUpperCase()}`,
        content: activePackage?.content_outline || "Huraikan pengenalan dan skop kandungan.",
        sort_order: 4,
      },
      {
        block_type: "figure",
        title: "Rajah 1: Cadangan Rajah / Gambar",
        content: "Letakkan rajah atau gambar berkaitan bersama caption rasmi.",
        sort_order: 5,
      },
      {
        block_type: "reference",
        title: "RUJUKAN",
        content: activePackage?.references || "1. Masukkan rujukan utama di sini.",
        sort_order: 90,
      },
      {
        block_type: "exercise",
        title: "LATIHAN",
        content:
          activePackage?.exercises ||
          "Peserta dikehendaki menjawab semua soalan dengan merujuk kepada Pakej Latihan ini.",
        sort_order: 100,
      },
      {
        block_type: "answer_scheme",
        title: "SKEMA JAWAPAN (UNTUK PENGAJAR)",
        content: activePackage?.answer_scheme || "Masukkan cadangan jawapan di sini.",
        sort_order: 110,
      },
    ];

    for (const block of templateBlocks) {
      await axios.post(`${API_BASE_URL}/module-content-blocks/`, {
        module_id: Number(moduleId),
        package_id: activePackageId,
        metadata_json: "",
        ai_generated: false,
        review_status: "Draft",
        ...block,
      });
    }

    await refreshBlocks();
  }

  void setActivePackageId;
  void setAiPrompt;
  void saveBlock;
  void createAiDraft;
  void createLearningPackageTemplate;

  function renderBlock(block: ContentBlock, index: number, documentMode = false) {
    const headingNumber = `${index + 1}.`;
    const contentLines = (block.content || "").split(/\r?\n/).filter(Boolean);

    return (
      <div
        key={block.id}
        className={[
          "rounded-xl border border-slate-200 bg-white p-4",
          documentMode ? "shadow-none" : "shadow-sm",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-blue-600">
              {documentMode ? headingNumber : getBlockTypeLabel(block.block_type)}
              {block.ai_generated ? " - AI" : ""}
            </p>
            {block.title && (
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {block.title}
              </h3>
            )}
          </div>

          {!documentMode && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => editBlock(block)}
                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => deleteBlock(block.id)}
                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {block.block_type === "table" || block.block_type === "chart" ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            {contentLines.map((line, lineIndex) => (
              <div
                key={`${block.id}-${lineIndex}`}
                className={[
                  "grid grid-cols-4 gap-3 px-3 py-2 text-xs",
                  lineIndex === 0
                    ? "bg-slate-100 font-bold text-slate-700"
                    : "text-slate-600",
                ].join(" ")}
              >
                {line.split("|").map((cell, cellIndex) => (
                  <span key={`${block.id}-${lineIndex}-${cellIndex}`}>
                    {cell.trim()}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : block.block_type === "figure" ? (
          <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Ruang Rajah / Gambar
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
              {block.content}
            </p>
          </div>
        ) : (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
            {block.content}
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading...</p>
      </AppShell>
    );
  }

  if (!moduleItem) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-700">Modul tidak dijumpai</h1>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <Link href="/module-builder" className="text-sm font-semibold text-blue-600">
            Kembali ke Module Builder
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
            Module Authoring
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {moduleItem.code} - {moduleItem.title}
          </h1>
          <p className="mt-2 max-w-4xl text-slate-600">
            {moduleItem.objective || moduleItem.description || "Tiada objektif direkodkan."}
          </p>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("builder")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                mode === "builder" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Builder Mode
            </button>
            <button
              type="button"
              onClick={() => setMode("document")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                mode === "document" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Document Mode
            </button>
          </div>

          <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            Learning Package Workspace
          </span>
        </section>

        {mode === "builder" ? (
          <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-blue-600">
                      1. Tajuk
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {getPrimaryTitle() || "Belum ada tajuk"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Tajuk ini dibawa daripada keputusan mapping/module sebelum ini.
                    </p>
                  </div>
                </div>
                {titleBlocks.map((block, index) => renderBlock(block, index))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-blue-600">
                      2. Objektif
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => generateSectionDraft("objective", "Objektif pembelajaran")}
                      className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                    >
                      Jana AI
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSectionDraft("objective")}
                      className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={
                    sectionDrafts.objective ||
                    objectiveBlocks[0]?.content ||
                    activePackage?.objective ||
                    moduleItem.objective ||
                    ""
                  }
                  onChange={(event) => updateSectionDraft("objective", event.target.value)}
                  placeholder="Masukkan objektif pembelajaran untuk LP ini."
                  className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-blue-600">
                      3. Penerangan
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Seksyen dan subtajuk daripada mapping
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Setiap subtajuk mempunyai ruang nota sendiri supaya AI dan panel
                      tidak menghuraikan kandungan di luar skop.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={generateSectionsFromMapping}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      + Jana ruang daripada Mapping
                    </button>
                    <button
                      type="button"
                      onClick={addManualSection}
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      + Tambah Bahagian
                    </button>
                  </div>
                </div>

                {sectionBlocks.length === 0 ? (
                  <>
                    <div className="mt-5 space-y-5">
                      {MAPPING_EXPLANATION_SECTIONS.map((section, sectionIndex) => (
                        <div
                          key={section.title}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase text-blue-600">
                                {sectionIndex + 1}. Bahagian daripada mapping
                              </p>
                              <h4 className="mt-1 text-base font-bold text-slate-900">
                                {sectionIndex + 1}) {section.title}
                              </h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  generateSectionDraft(
                                    `explanation-${sectionIndex}`,
                                    section.title,
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                              >
                                Jana AI Nota
                              </button>
                              <button
                                type="button"
                                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => saveSectionDraft(`explanation-${sectionIndex}`)}
                                className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                              >
                                Save
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 space-y-4">
                            {section.subtopics.map((subtopic, subtopicIndex) => {
                              const draftKey = `explanation-${sectionIndex}-${subtopicIndex}`;

                              return (
                                <div
                                  key={subtopic}
                                  className="rounded-xl border border-slate-200 bg-white p-4"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-bold uppercase text-blue-600">
                                        {sectionIndex + 1}.{subtopicIndex + 1} Subtajuk
                                      </p>
                                      <h5 className="mt-1 font-bold text-slate-900">
                                        {subtopic}
                                      </h5>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => generateSectionDraft(draftKey, subtopic)}
                                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                                      >
                                        Jana AI
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => saveSectionDraft(draftKey)}
                                        className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                <div className="relative mt-4">
                                  <textarea
                                    value={sectionDrafts[draftKey] || ""}
                                    onChange={(event) =>
                                      updateSectionDraft(draftKey, event.target.value)
                                    }
                                    onMouseUp={() => captureHighlightedText(draftKey)}
                                    onKeyUp={() => captureHighlightedText(draftKey)}
                                    placeholder="Huraikan nota pembelajaran, contoh kerja sebenar, langkah, risiko, dokumen sokongan dan bukti kompetensi untuk subtajuk ini. Highlight mana-mana ayat/perenggan untuk jana gambar, rajah, jadual atau carta."
                                    className="min-h-40 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
                                  />
                                  {selectedDraftKey === draftKey && selectedText && (
                                    <div className="absolute right-3 top-3 flex flex-wrap gap-2 rounded-xl border border-blue-200 bg-white p-2 shadow-lg">
                                      {(["Gambar", "Rajah", "Jadual", "Carta"] as const).map(
                                        (type) => (
                                          <button
                                            key={type}
                                            type="button"
                                            onClick={() => generateInlineBlock(type)}
                                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                                          >
                                            Jana {type}
                                          </button>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                                {renderInlineBlocks(draftKey)}
                              </div>
                            );
                          })}
                          </div>
                        </div>
                      ))}
                    </div>
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    Belum ada ruang Penerangan. Klik “Jana ruang daripada Mapping”
                    untuk menjana seksyen seperti 1. Pengenalan, 2. Pengurusan
                    Pemeriksaan dan seterusnya.
                  </div>
                  </>
                ) : (
                  <div className="mt-5 space-y-5">
                    {sectionBlocks.map((section) => {
                      const sectionNumber = getSectionNumber(section);
                      const subsections = getSectionSubsections(section);

                      return (
                        <div
                          key={section.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold uppercase text-blue-600">
                                {sectionNumber}. Bahagian
                              </p>
                              <h4 className="mt-1 text-base font-bold text-slate-900">
                                {sectionNumber}) {section.title}
                              </h4>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => addManualSubsection(section)}
                                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 ring-1 ring-slate-200"
                              >
                                + Tambah Subtajuk
                              </button>
                              <button
                                type="button"
                                onClick={() => editBlock(section)}
                                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
                              >
                                Edit
                              </button>
                            </div>
                          </div>

                          {subsections.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                              Belum ada subtajuk untuk bahagian ini.
                            </div>
                          ) : (
                            <div className="mt-4 space-y-4">
                              {subsections.map((subsection, subsectionIndex) => {
                                const subsectionNumber = `${sectionNumber}.${
                                  subsectionIndex + 1
                                }`;
                                const assets = getSubsectionAssets(subsection);

                                return (
                                  <div
                                    key={subsection.id}
                                    className="rounded-xl border border-slate-200 bg-white p-4"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <p className="text-xs font-bold uppercase text-blue-600">
                                          {subsectionNumber} Subtajuk
                                        </p>
                                        <h5 className="mt-1 font-bold text-slate-900">
                                          {subsectionNumber}) {subsection.title}
                                        </h5>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => createScopedNote(section, subsection)}
                                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                                        >
                                          Jana Nota {subsectionNumber}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            createSubsectionAsset(section, subsection, "figure")
                                          }
                                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                                        >
                                          + Rajah
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            createSubsectionAsset(section, subsection, "table")
                                          }
                                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                                        >
                                          + Jadual
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => editBlock(subsection)}
                                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    </div>

                                    <textarea
                                      value={
                                        subsectionDrafts[subsection.id] ??
                                        subsection.content ??
                                        ""
                                      }
                                      onChange={(event) =>
                                        setSubsectionDrafts((current) => ({
                                          ...current,
                                          [subsection.id]: event.target.value,
                                        }))
                                      }
                                      placeholder={`Huraikan nota pembelajaran khusus untuk ${subsectionNumber} sahaja.`}
                                      className="mt-4 min-h-36 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
                                    />
                                    <div className="mt-3 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => saveSubsectionNotes(subsection)}
                                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                                      >
                                        Simpan Nota
                                      </button>
                                    </div>

                                    {assets.length > 0 && (
                                      <div className="mt-4 space-y-3">
                                        {assets.map((asset, assetIndex) =>
                                          renderBlock(asset, assetIndex),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-blue-600">
                      4. Rujukan
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Senarai rujukan rasmi
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => generateSectionDraft("reference", "Rujukan")}
                      className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                    >
                      Jana AI
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSectionDraft("reference")}
                      className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={sectionDrafts.reference || referenceBlocks[0]?.content || ""}
                  onChange={(event) => updateSectionDraft("reference", event.target.value)}
                  placeholder="Masukkan senarai rujukan standard, akta, manual, garis panduan, spesifikasi teknikal dan dokumen industri."
                  className="mt-4 min-h-32 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-blue-600">
                      5. Latihan (Soalan Subjektif)
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Soalan pengukuhan peserta
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => generateSectionDraft("exercise", "Latihan subjektif")}
                      className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                    >
                      Jana AI
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSectionDraft("exercise")}
                      className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={sectionDrafts.exercise || exerciseBlocks[0]?.content || ""}
                  onChange={(event) => updateSectionDraft("exercise", event.target.value)}
                  placeholder="Masukkan soalan subjektif untuk peserta. Contoh: huraikan proses, senaraikan dokumen, jelaskan risiko dan cadangkan tindakan kawalan."
                  className="mt-4 min-h-36 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-blue-600">
                      6. Skema Jawapan
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Panduan untuk pengajar
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => generateSectionDraft("answer", "Skema jawapan")}
                      className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                    >
                      Jana AI
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSectionDraft("answer")}
                      className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={sectionDrafts.answer || answerBlocks[0]?.content || ""}
                  onChange={(event) => updateSectionDraft("answer", event.target.value)}
                  placeholder="Masukkan skema jawapan untuk pengajar, termasuk poin utama, rubrik ringkas dan cadangan markah."
                  className="mt-4 min-h-36 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
                />
              </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto max-w-5xl border border-slate-200 bg-white">
              <div className="grid grid-cols-[1fr_180px] border-b border-slate-200 text-sm">
                <div className="p-4 font-bold text-slate-900">
                  KOD PL {activePackage?.code || "PL"}
                </div>
                <div className="border-l border-slate-200 p-4 text-right text-slate-600">
                  Muka Surat: 1/--
                </div>
              </div>

              <div className="p-8 text-center">
                <p className="text-lg font-bold uppercase text-slate-900">
                  PAKEJ LATIHAN
                </p>
                <p className="mt-3 text-xl font-bold uppercase text-slate-900">
                  {moduleItem.title}
                </p>
                <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 text-left">
                  <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
                    <div className="bg-slate-50 p-3 text-sm font-bold">KOD MODUL</div>
                    <div className="p-3 text-sm">{moduleItem.code}</div>
                  </div>
                  <div className="grid grid-cols-[160px_1fr]">
                    <div className="bg-slate-50 p-3 text-sm font-bold">
                      NO. SUB PAKEJ LATIHAN
                    </div>
                    <div className="space-y-2 p-3 text-sm">
                      {packages.length === 0 ? (
                        <p>Belum ada PL.</p>
                      ) : (
                        packages.map((packageItem) => (
                          <p key={packageItem.id}>
                            <span className="font-bold">{packageItem.code}</span>{" "}
                            {packageItem.title}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 p-8">
                <h2 className="text-xl font-bold uppercase text-slate-900">TAJUK</h2>
                <p className="mt-3 text-lg font-bold uppercase text-slate-900">
                  {titleBlocks[0]?.content || getPrimaryTitle()}
                </p>

                <h2 className="mt-8 text-xl font-bold uppercase text-slate-900">
                  OBJEKTIF
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                  {objectiveBlocks[0]?.content ||
                    activePackage?.objective ||
                    moduleItem.objective ||
                    "Tiada objektif direkodkan."}
                </p>

                <h2 className="mt-8 text-xl font-bold uppercase text-slate-900">
                  PENERANGAN
                </h2>
                <div className="mt-4 space-y-5">
                  {sectionBlocks.length === 0 && explanationBlocks.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Belum ada kandungan penerangan.
                    </p>
                  ) : sectionBlocks.length > 0 ? (
                    sectionBlocks.map((section) => {
                      const sectionNumber = getSectionNumber(section);
                      const subsections = getSectionSubsections(section);

                      return (
                        <div key={section.id} className="space-y-4">
                          <h3 className="text-lg font-bold text-slate-900">
                            {sectionNumber}) {section.title}
                          </h3>
                          {section.content && (
                            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                              {section.content}
                            </p>
                          )}
                          {subsections.map((subsection, subsectionIndex) => {
                            const subsectionNumber = `${sectionNumber}.${
                              subsectionIndex + 1
                            }`;
                            const assets = getSubsectionAssets(subsection);

                            return (
                              <div
                                key={subsection.id}
                                className="rounded-xl border border-slate-200 p-4"
                              >
                                <h4 className="font-bold text-slate-900">
                                  {subsectionNumber}) {subsection.title}
                                </h4>
                                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                                  {subsection.content || "Nota pembelajaran belum diisi."}
                                </p>
                                {assets.length > 0 && (
                                  <div className="mt-4 space-y-3">
                                    {assets.map((asset, assetIndex) =>
                                      renderBlock(asset, assetIndex, true),
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  ) : (
                    explanationBlocks.map((block, index) =>
                      renderBlock(block, index, true),
                    )
                  )}
                </div>

                <h2 className="mt-10 text-xl font-bold uppercase text-slate-900">
                  RUJUKAN
                </h2>
                <div className="mt-4 space-y-3">
                  {referenceBlocks.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada rujukan.</p>
                  ) : (
                    referenceBlocks.map((block, index) =>
                      renderBlock(block, index, true),
                    )
                  )}
                </div>

                <h2 className="mt-10 text-xl font-bold uppercase text-slate-900">
                  LATIHAN
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Peserta dikehendaki menjawab semua soalan dengan merujuk
                  kepada Pakej Latihan ini.
                </p>
                <div className="mt-4 space-y-3">
                  {exerciseBlocks.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada latihan.</p>
                  ) : (
                    exerciseBlocks.map((block, index) =>
                      renderBlock(block, index, true),
                    )
                  )}
                </div>

                <h2 className="mt-10 text-xl font-bold uppercase text-slate-900">
                  SKEMA JAWAPAN (UNTUK PENGAJAR)
                </h2>
                <div className="mt-4 space-y-3">
                  {answerBlocks.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Belum ada skema jawapan.
                    </p>
                  ) : (
                    answerBlocks.map((block, index) =>
                      renderBlock(block, index, true),
                    )
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
