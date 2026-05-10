"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { API_BASE_URL } from "@/src/lib/api";

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
  workflow_status?: string;
};

type CMCSItem = {
  id: number;
  code?: string;
  title: string;
  description?: string;
};

type MappingAIDraft = {
  trade_specific_content: string;
  draft_module_title: string;
  draft_objective: string;
  draft_content_outline: string;
  suggested_learning_packages: string;
  suggested_assessment_areas: string;
  mapping_notes: string;
  blocks?: {
    title: string;
    subtitle: string;
    items: string[];
  }[];
};

type Mapping = {
  id: number;
  trade_id: number;
  cmcs_id: number;
  competency_unit_id?: number | null;
  mapping_notes?: string;
  trade_specific_content?: string;
  draft_module_title?: string;
  draft_objective?: string;
  draft_content_outline?: string;
  suggested_learning_packages?: string;
  suggested_assessment_areas?: string;
  relevance_level: string;
  cmcs_title?: string;
  competency_unit_code?: string;
  competency_unit_title?: string;
};

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
  content_outline?: string;
  status: string;
};

type MappingSection = {
  mappingId: number;
  mappingCode: string;
  cmcsTitle: string;
  title: string;
  bullets: string[];
};

type MatrixRow = {
  no: string;
  coreCompetency: string;
  workActivities: string[];
  sections: {
    title: string;
    bullets: string[];
  }[];
};

type SectionClusterDraft = {
  cluster: string;
  moduleCode: string;
  packageCode: string;
  title: string;
  status: string;
};

type CompetencyGroupingDraft = {
  mode: "none" | "section";
  status: string;
};

type GeneratedBlock = {
  id: string;
  title: string;
  subtitle: string;
  items: string[];
  groupId?: string;
};

function getTradeLabel(trade: Trade) {
  return `${trade.code} - ${trade.title}`;
}

const SAMPLE_MATRIX_ROWS = [
  {
    no: "C01",
    coreCompetency: "Business Operation Management",
    workActivities: [
      "Manage business operation compliances requirements",
      "Perform business financial management",
      "Perform human resources management",
      "Establish marketing activity",
      "Perform asset management",
      "Carry out construction innovation",
    ],
    sections: [
      {
        title: "Pengenalan",
        bullets: [
          "Merangkumi reka bentuk, pembinaan, pemeriksaan dan penyelenggaraan jambatan bagi pelbagai jenis struktur seperti konkrit, keluli dan komposit.",
          "Fokus kepada kestabilan struktur, keselamatan beban, kaedah pembinaan dan kawalan mutu bahan.",
          "Menitikberatkan kepatuhan terhadap piawaian kejuruteraan dan peraturan keselamatan jalan.",
          "Menyokong kelancaran sistem pengangkutan dan hubungan antara kawasan.",
        ],
      },
      {
        title: "Pengurusan Pemeriksaan dan Ujian Struktur Jambatan",
        bullets: [
          "Jenis pemeriksaan jambatan seperti routine inspection, principal inspection dan special inspection.",
          "Prosedur pemeriksaan visual dan ujian bukan musnah (NDT) seperti Ultrasonic Pulse Velocity (UPV), Rebound Hammer, Half-cell Potential dan Covermeter.",
          "Kaedah penilaian keadaan struktur jambatan menggunakan Bridge Condition Index (BCI).",
          "Standard rujukan seperti AASHTO Manual for Bridge Evaluation, JKR Bridge Inspection Manual dan BS EN 1504.",
          "Penyediaan Bridge Inspection Report mengikut format JKR atau LLM.",
        ],
      },
      {
        title: "Pengurusan Data dan Dokumentasi Jambatan",
        bullets: [
          "Penggunaan Bridge Management System (BMS) untuk penyimpanan data struktur.",
          "Integrasi maklumat dengan sistem GIS, Digital Twin dan Drone Visual Mapping.",
          "Penyediaan inspection log sheet, defect photo record dan maintenance tracking sheet.",
          "Hubungan data pemeriksaan dengan tuntutan Interim Certificate dan Maintenance Contract.",
        ],
      },
      {
        title: "Pengurusan Ujian Beban dan Keselamatan Struktur",
        bullets: [
          "Ujian beban statik dan dinamik seperti static load test dan dynamic response test.",
          "Analisis keputusan ujian untuk menilai kapasiti beban jambatan.",
          "Pengurusan risiko semasa ujian beban seperti safety barricade dan monitoring equipment.",
          "Prosedur kelulusan semula jambatan selepas kerja pembaikan atau pengukuhan struktur.",
        ],
      },
      {
        title: "Aplikasi Inovasi dan Teknologi IR4.0 dalam Bridge Works",
        bullets: [
          "Penggunaan IoT sensors untuk pemantauan tekanan dan getaran struktur.",
          "Penerapan AI-based predictive maintenance untuk ramalan kerosakan.",
          "Sistem real-time monitoring dashboard bagi pengurusan jambatan berisiko tinggi.",
          "Penggunaan drone dan LiDAR scanning untuk pemetaan permukaan dan semakan retakan halus.",
        ],
      },
      {
        title: "Pengurusan Isu Teknikal dan Penambahbaikan Berterusan",
        bullets: [
          "Strategi pembaikan berulang seperti recurring defect management.",
          "Pengiraan kos pembaikan semula berdasarkan keputusan ujian.",
          "Penyediaan Root Cause Analysis (RCA) untuk kegagalan struktur jambatan.",
          "Penambahbaikan berterusan (Kaizen) dalam proses pemeriksaan, penyelenggaraan dan dokumentasi.",
        ],
      },
    ],
  },
  {
    no: "C02",
    coreCompetency: "Tendering Management",
    workActivities: [
      "Identify project scope",
      "Prepare cost data, estimating and pricing",
      "Perform tendering process",
    ],
    sections: [
      {
        title: "Pengenalpastian Skop Projek Bridge Works",
        bullets: [
          "Jenis jambatan seperti RC bridge, steel bridge dan suspension/composite bridge.",
          "Komponen struktur seperti asas, tiang, bentang tengah, parapet dan expansion joint.",
          "Skop kerja seperti pembinaan baharu, penggantian bearing, pengecatan dan repair crack.",
          "Penilaian keadaan struktur seperti inspection, load test dan corrosion survey.",
          "Kajian tapak seperti keadaan tanah, laluan trafik, sungai, utiliti bawah tanah.",
        ],
      },
      {
        title: "Penyediaan Data Kos, Estimasi dan Penentuan Harga",
        bullets: [
          "Pengiraan kos bahan dan buruh seperti formwork, reinforcement dan concrete.",
          "Bill of Quantities (BQ) dan analisis kadar unit seperti rate analysis.",
          "Penentuan margin untung dan risiko mengikut lokasi dan jenis jambatan.",
        ],
      },
      {
        title: "Pengurusan Proses Tender",
        bullets: [
          "Proses tender kerajaan dan swasta seperti open tender, limited tender dan e-bidding.",
          "Penyediaan dokumen tender lengkap seperti method statement, warranty letter dan product datasheet.",
          "Penilaian teknikal dan komersial serta lawatan tapak.",
          "Rundingan harga dan penyediaan tender submission package.",
        ],
      },
    ],
  },
  {
    no: "C03",
    coreCompetency: "Contract Implementation & Management",
    workActivities: [
      "Manage contract award / acceptance",
      "Manage contract requirements and contract documentation",
      "Manage contract certification and requirements",
      "Prepare contract payments / claims",
      "Manage contract determination",
      "Coordinate dispute resolution",
    ],
    sections: [
      {
        title: "Pengurusan Anugerah dan Dokumentasi Kontrak",
        bullets: [
          "Proses LOA dan keperluan performance bond untuk kerja jambatan.",
          "Jenis kontrak seperti Lump Sum, Measured Work dan Design & Build.",
          "Kawalan tarikh mula, tempoh kontrak dan LAD (Liquidated Ascertained Damages).",
          "Penyediaan Addendum dan Variation Agreement.",
        ],
      },
      {
        title: "Pengurusan Pensijilan dan Tuntutan Bayaran",
        bullets: [
          "Prosedur Interim Certificate dan Interim Payment Claim (IPC).",
          "Penyediaan laporan kemajuan seperti progress report dan site records.",
          "Pengurusan Variation Order (VO), tuntutan kos tambahan dan delay claims.",
        ],
      },
      {
        title: "Penamatan Kontrak dan Penyelesaian Pertikaian",
        bullets: [
          "Sebab penamatan seperti kelewatan kritikal, ketidakpatuhan dan force majeure.",
          "Pengiraan kos penamatan dan remobilisasi.",
          "Kaedah penyelesaian pertikaian seperti ADR, arbitration dan litigation.",
          "Pengurusan bukti seperti evidence documentation dan without prejudice communication.",
        ],
      },
    ],
  },
  {
    no: "C04",
    coreCompetency: "Project Planning & Scheduling",
    workActivities: ["Prepare Work Breakdown Structure (WBS)", "Prepare work programme and scheduling"],
    sections: [
      {
        title: "Penyediaan Work Breakdown Structure (WBS)",
        bullets: [
          "Struktur kerja seperti asas, tiang, rasuk, dek, parapet dan saliran jambatan.",
          "Penjadualan aktiviti pembinaan seperti pile driving, concreting, launching girder dan finishing.",
          "WBS penyelenggaraan seperti pemeriksaan, pembersihan, penggantian komponen dan cat perlindungan.",
          "Integrasi WBS dengan BQ dan Inspection Report.",
        ],
      },
      {
        title: "Penyediaan Jadual Kerja",
        bullets: [
          "Gunakan bar chart, Gantt chart atau CPM Method.",
          "Menyusun aktiviti kritikal seperti kerja asas, kerja atas air dan deck casting.",
          "Penjadualan kerja malam dan penyelarasan trafik.",
          "Delay notification dan koordinasi dengan pihak ketiga seperti utility dan road authority.",
        ],
      },
    ],
  },
  {
    no: "C05",
    coreCompetency: "Construction Operation Management",
    workActivities: [
      "Perform project quality management",
      "Perform Occupational Safety and Health (OSH) management",
      "Perform environmental protection and enhancement",
      "Perform traffic management",
      "Perform physical mobilisation",
      "Perform construction activities",
      "Perform construction monitoring and control",
      "Perform demobilisation",
    ],
    sections: [
      {
        title: "Kawalan Kualiti Projek Bridge Works",
        bullets: [
          "Penyediaan Inspection Test Plan (ITP) bagi kerja konkrit dan keluli.",
          "Ujian bahan seperti cube test, rebar test dan ultrasonic test.",
          "Kawalan mutu kerja pemasangan rasuk, precast segment dan bearing alignment.",
          "Pengurusan laporan ujian tapak dan quality record register.",
        ],
      },
      {
        title: "Pengurusan Keselamatan dan Kesihatan (OSH)",
        bullets: [
          "HIRARC bagi kerja di ketinggian dan atas air.",
          "Permit kerja seperti Permit-To-Work bagi confined space dan kerja mengangkat berat.",
          "Emergency Response Plan (ERP) dan latihan penyelamatan.",
          "Kawalan risiko bahan kimia seperti epoxy dan coating.",
        ],
      },
      {
        title: "Pengurusan Alam Sekitar dan Trafik",
        bullets: [
          "Kawalan hakisan, sisa konkrit dan surface run-off mengikut EQA 1974.",
          "Pengurusan scheduled waste seperti paint thinner dan epoxy.",
          "Traffic Management Plan (TMP) semasa pembinaan atau penyelenggaraan.",
        ],
      },
      {
        title: "Pelaksanaan & Pemantauan Tapak",
        bullets: [
          "Aktiviti utama seperti formwork erection, concreting, stressing, finishing dan inspection.",
          "Dokumentasi harian seperti site diary dan photo record.",
          "Pengurusan isu teknikal seperti alignment deviation, honeycomb repair dan corrosion.",
        ],
      },
      {
        title: "Demobilisation",
        bullets: [
          "Pembersihan tapak dan penyerahan semula laluan trafik.",
          "Pengeluaran peralatan dan bahan baki.",
          "Penyediaan Site Closure Report dan As-Built Record.",
        ],
      },
    ],
  },
  {
    no: "C06",
    coreCompetency: "Project Handover",
    workActivities: [
      "Prepare handover document",
      "Defect liability management and Certificate of Making Good Defects (CMGD)",
      "Prepare final account document",
    ],
    sections: [
      {
        title: "Dokumentasi Penyerahan Jambatan",
        bullets: [
          "As-built drawings, laporan ujian akhir seperti load test, UPV dan rebar scanning.",
          "Penyediaan handover checklist dan commissioning report.",
          "Proses serahan kepada pihak berkuasa seperti JKR, LLM atau local authority.",
          "Penyediaan laporan latihan penyelenggaraan kepada pengguna atau pengendali.",
        ],
      },
      {
        title: "Liabiliti Kecacatan & CMGD",
        bullets: [
          "Penyediaan defect list dan tindakan pembaikan.",
          "Proses pengesahan CMGD (Certificate of Making Good Defects).",
          "Pemantauan jambatan dalam tempoh DLP (Defect Liability Period).",
        ],
      },
      {
        title: "Akaun Akhir Projek",
        bullets: [
          "Penyediaan Final Account Report dan sokongan dokumen seperti BQ, VO dan claim letters.",
          "Rundingan kos akhir dengan konsultan atau klien.",
          "Penyediaan Final Statement of Account dan pengesahan pembayaran terakhir.",
        ],
      },
    ],
  },
  {
    no: "C07",
    coreCompetency: "Additional Related Knowledge",
    workActivities: ["Additional Related Knowledge"],
    sections: [
      {
        title: "Pengurusan Pemeriksaan dan Ujian Struktur Jambatan",
        bullets: [
          "Jenis pemeriksaan jambatan seperti routine inspection, principal inspection dan special inspection.",
          "Prosedur pemeriksaan visual dan ujian bukan musnah (NDT) seperti UPV, Rebound Hammer, Half-cell Potential dan Covermeter.",
          "Kaedah penilaian keadaan struktur jambatan menggunakan Bridge Condition Index (BCI).",
          "Standard rujukan seperti AASHTO Manual for Bridge Evaluation, JKR Bridge Inspection Manual dan BS EN 1504.",
        ],
      },
      {
        title: "Pengurusan Data dan Dokumentasi Jambatan",
        bullets: [
          "Penggunaan Bridge Management System (BMS) untuk penyimpanan data struktur.",
          "Integrasi maklumat dengan sistem GIS, Digital Twin dan Drone Visual Mapping.",
          "Penyediaan inspection log sheet, defect photo record dan maintenance tracking sheet.",
          "Hubungan data pemeriksaan dengan tuntutan Interim Certificate dan Maintenance Contract.",
        ],
      },
      {
        title: "Pengurusan Ujian Beban dan Keselamatan Struktur",
        bullets: [
          "Ujian beban statik dan dinamik seperti static load test dan dynamic response test.",
          "Analisis keputusan ujian untuk menilai kapasiti beban jambatan.",
          "Pengurusan risiko semasa ujian beban seperti safety barricade dan monitoring equipment.",
          "Prosedur kelulusan semula jambatan selepas kerja pembaikan atau pengukuhan struktur.",
        ],
      },
      {
        title: "Aplikasi Inovasi dan Teknologi IR4.0 dalam Bridge Works",
        bullets: [
          "Penggunaan IoT sensors untuk pemantauan tekanan dan getaran struktur.",
          "Penerapan AI-based predictive maintenance untuk ramalan kerosakan.",
          "Sistem real-time monitoring dashboard bagi pengurusan jambatan berisiko tinggi.",
          "Penggunaan drone dan LiDAR scanning untuk pemetaan permukaan dan semakan retakan halus.",
        ],
      },
      {
        title: "Pengurusan Isu Teknikal dan Penambahbaikan Berterusan",
        bullets: [
          "Strategi pembaikan berulang seperti recurring defect management.",
          "Pengiraan kos pembaikan semula berdasarkan keputusan ujian.",
          "Penyediaan Root Cause Analysis (RCA) untuk kegagalan struktur jambatan.",
          "Penambahbaikan berterusan dalam proses pemeriksaan, penyelenggaraan dan dokumentasi.",
        ],
      },
    ],
  },
];

function parseMappingSections(mapping: Mapping): MappingSection[] {
  const source = [
    mapping.trade_specific_content,
    mapping.draft_content_outline,
    mapping.suggested_learning_packages,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections: MappingSection[] = [];
  const mappingCode = mapping.competency_unit_code || `CMCS-${mapping.cmcs_id}`;

  for (const line of lines) {
    const headingMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);

    if (headingMatch) {
      sections.push({
        mappingId: mapping.id,
        mappingCode,
        cmcsTitle: mapping.cmcs_title || `CMCS-${mapping.cmcs_id}`,
        title: headingMatch[2].trim(),
        bullets: [],
      });
      continue;
    }

    if (bulletMatch) {
      if (sections.length === 0) {
        sections.push({
          mappingId: mapping.id,
          mappingCode,
          cmcsTitle: mapping.cmcs_title || `CMCS-${mapping.cmcs_id}`,
          title: mapping.draft_module_title || mapping.cmcs_title || "Hasil mapping",
          bullets: [],
        });
      }

      sections[sections.length - 1].bullets.push(bulletMatch[1].trim());
    }
  }

  if (sections.length === 0 && source.trim()) {
    sections.push({
      mappingId: mapping.id,
      mappingCode,
      cmcsTitle: mapping.cmcs_title || `CMCS-${mapping.cmcs_id}`,
      title: mapping.draft_module_title || mapping.cmcs_title || "Hasil mapping",
      bullets: source
        .split(/[.;]\s+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8),
    });
  }

  return sections;
}

export default function MappingPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [cmcsItems, setCmcsItems] = useState<CMCSItem[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [selectedCmcsId, setSelectedCmcsId] = useState<number | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [modules, setModules] = useState<SKPModule[]>([]);
  const [packages, setPackages] = useState<LearningPackage[]>([]);
  const [aiDraft, setAiDraft] = useState<MappingAIDraft | null>(null);
  const [generatedBlocks, setGeneratedBlocks] = useState<GeneratedBlock[]>([]);
  const [blockGroups, setBlockGroups] = useState<Record<string, string>>({});
  const [generatingAI, setGeneratingAI] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [competencyGrouping, setCompetencyGrouping] = useState<
    Record<string, CompetencyGroupingDraft>
  >({});
  const [savedMatrixRows, setSavedMatrixRows] = useState<Record<string, boolean>>({});
  const [sectionClusters, setSectionClusters] = useState<Record<string, SectionClusterDraft>>({});
  const [loading, setLoading] = useState(true);

  const selectedTrade = trades.find((trade) => trade.id === selectedTradeId);
  const selectedCmcs = cmcsItems.find((item) => item.id === selectedCmcsId);
  const groupedBlocks = useMemo(() => {
    const groups = new Map<string, GeneratedBlock[]>();

    generatedBlocks.forEach((block, index) => {
      const key = blockGroups[block.id] || `group-${index + 1}`;
      groups.set(key, [...(groups.get(key) || []), block]);
    });

    return [...groups.entries()];
  }, [blockGroups, generatedBlocks]);
  const useSampleMatrix =
    selectedTrade?.code === "RWY" ||
    selectedTrade?.code === "E13" ||
    Boolean(selectedTrade?.title.toLowerCase().includes("railway"));
  const matrixRows: MatrixRow[] = useMemo(
    () =>
      useSampleMatrix
        ? SAMPLE_MATRIX_ROWS
        : mappings.map((mapping, index) => ({
            no: `C${String(index + 1).padStart(2, "0")}`,
            coreCompetency: mapping.cmcs_title || `CMCS-${mapping.cmcs_id}`,
            workActivities: [
              mapping.competency_unit_title || "Semua competency unit",
            ],
            sections: parseMappingSections(mapping).map((section) => ({
              title: section.title,
              bullets: section.bullets,
            })),
          })),
    [mappings, useSampleMatrix],
  );
  const mappingSections = useMemo(
    () =>
      matrixRows.flatMap((row) =>
        row.sections.map((section) => ({
          mappingId: 0,
          mappingCode: row.no,
          cmcsTitle: row.coreCompetency,
          title: section.title,
          bullets: section.bullets,
        })),
      ),
    [matrixRows],
  );
  const transferredRows = matrixRows.filter((row) => savedMatrixRows[row.no]);

  function getSectionKey(rowNo: string, sectionIndex: number) {
    return `${rowNo}-${sectionIndex}`;
  }

  function getDefaultSectionCluster(
    row: MatrixRow,
    rowIndex: number,
    sectionIndex: number,
  ): SectionClusterDraft {
    return {
      cluster: `${row.no}-LP${sectionIndex + 1}`,
      moduleCode: modules[0]?.code || `M${String(rowIndex + 1).padStart(2, "0")}`,
      packageCode: `PL${String(sectionIndex + 1).padStart(2, "0")}`,
      title: row.sections[sectionIndex]?.title || row.coreCompetency,
      status: "Draft Grouping",
    };
  }

  function getSectionCluster(row: MatrixRow, rowIndex: number, sectionIndex: number) {
    const key = getSectionKey(row.no, sectionIndex);
    return sectionClusters[key] || getDefaultSectionCluster(row, rowIndex, sectionIndex);
  }

  function getCompetencyGrouping(rowNo: string): CompetencyGroupingDraft {
    return competencyGrouping[rowNo] || { mode: "section", status: "Draft Grouping" };
  }

  function setNoGrouping(row: MatrixRow) {
    setCompetencyGrouping((current) => ({
      ...current,
      [row.no]: {
        mode: "none",
        status: "Ready to Save",
      },
    }));
  }

  function setSectionGrouping(row: MatrixRow) {
    setCompetencyGrouping((current) => ({
      ...current,
      [row.no]: {
        mode: "section",
        status: "Draft Grouping",
      },
    }));
  }

  function saveCompetencyGrouping(row: MatrixRow) {
    const current = getCompetencyGrouping(row.no);
    setCompetencyGrouping((existing) => ({
      ...existing,
      [row.no]: {
        ...current,
        status: "Final Saved",
      },
    }));
  }

  function saveMatrixRow(row: MatrixRow) {
    setSavedMatrixRows((current) => ({
      ...current,
      [row.no]: true,
    }));
  }

  function getCmcsLabel(item: CMCSItem) {
    return item.code || `CMCS-${String(item.id).padStart(3, "0")}`;
  }

  function splitAIDraftIntoBlocks(draft: MappingAIDraft): GeneratedBlock[] {
    if (draft.blocks?.length) {
      return draft.blocks.map((block, index) => ({
        id: `block-${index + 1}`,
        title: block.title,
        subtitle: block.subtitle,
        items: block.items,
        groupId: `group-${index + 1}`,
      }));
    }

    const lines = draft.draft_content_outline
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const blocks: GeneratedBlock[] = [];

    lines.forEach((line, index) => {
      const headingMatch = line.match(/^(\d+)[.)]\s*(.+)$/);
      const bulletMatch = line.match(/^[-*•]\s*(.+)$/);
      const subtitleMatch = line.match(/^sub[\s-]?tajuk\s*:\s*(.+)$/i);

      if (headingMatch) {
        blocks.push({
          id: `block-${index + 1}`,
          title: headingMatch[2],
          subtitle: "",
          items: [],
          groupId: `group-${blocks.length + 1}`,
        });
        return;
      }

      if (blocks.length === 0) {
        blocks.push({
          id: `block-${index + 1}`,
          title: draft.draft_module_title || `Item ${index + 1}`,
          subtitle: "",
          items: [],
          groupId: "group-1",
        });
      }

      const currentBlock = blocks[blocks.length - 1];

      if (subtitleMatch) {
        currentBlock.subtitle = subtitleMatch[1];
        return;
      }

      currentBlock.items = [
        ...currentBlock.items,
        bulletMatch ? bulletMatch[1] : line,
      ];
    });

    if (blocks.length === 0) {
      blocks.push({
        id: "block-1",
        title: draft.draft_module_title || "Hasil Jana AI",
        subtitle: "",
        items: [draft.trade_specific_content],
        groupId: "group-1",
      });
    }

    return blocks;
  }

  function updateGeneratedBlock(
    blockId: string,
    update: Partial<GeneratedBlock>,
  ) {
    setGeneratedBlocks((current) =>
      current.map((block) =>
        block.id === blockId ? { ...block, ...update } : block,
      ),
    );
  }

  function updateGeneratedBlockItem(
    blockId: string,
    itemIndex: number,
    value: string,
  ) {
    setGeneratedBlocks((current) =>
      current.map((block) =>
        block.id === blockId
          ? {
              ...block,
              items: block.items.map((item, index) =>
                index === itemIndex ? value : item,
              ),
            }
          : block,
      ),
    );
  }

  function addGeneratedBlockItem(blockId: string) {
    setGeneratedBlocks((current) =>
      current.map((block) =>
        block.id === blockId
          ? { ...block, items: [...block.items, ""] }
          : block,
      ),
    );
  }

  function groupBlock(blockId: string, targetGroupId?: string) {
    setBlockGroups((current) => {
      const fallbackGroup = `group-${Object.keys(current).length + 1}`;

      return {
        ...current,
        [blockId]: targetGroupId || current[blockId] || fallbackGroup,
      };
    });
  }

  async function generateMappingAI() {
    if (!selectedTradeId || !selectedCmcsId) {
      setWorkspaceMessage("Pilih tred dan CMCS reference dahulu.");
      return;
    }

    setGeneratingAI(true);
    setWorkspaceMessage("");

    try {
      const response = await axios.post<MappingAIDraft>(
        `${API_BASE_URL}/trade-cmcs-mappings/ai-draft`,
        {
          trade_id: selectedTradeId,
          cmcs_id: selectedCmcsId,
          competency_unit_id: null,
        },
      );
      const blocks = splitAIDraftIntoBlocks(response.data);

      setAiDraft(response.data);
      setGeneratedBlocks(blocks);
      setBlockGroups(
        Object.fromEntries(blocks.map((block) => [block.id, block.groupId || block.id])),
      );
    } catch (err) {
      setWorkspaceMessage("Jana AI gagal. Semak backend atau API key.");
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  }

  async function saveMappingWorkspace() {
    if (!selectedTradeId || !selectedCmcsId || !aiDraft) {
      setWorkspaceMessage("Jana AI dahulu sebelum save.");
      return;
    }

    setSavingWorkspace(true);
    setWorkspaceMessage("");

    const groupedSummary = groupedBlocks
      .map(
        ([groupId, blocks], index) =>
          `Group ${index + 1} (${groupId})\n${blocks
            .map((block) => `- ${block.title}`)
            .join("\n")}`,
      )
      .join("\n\n");

    try {
      await axios.post(`${API_BASE_URL}/trade-cmcs-mappings/`, {
        trade_id: selectedTradeId,
        cmcs_id: selectedCmcsId,
        competency_unit_id: null,
        relevance_level: "High",
        mapping_notes: `${aiDraft.mapping_notes}\n\nGrouping:\n${groupedSummary}`,
        trade_specific_content: aiDraft.trade_specific_content,
        draft_module_title: aiDraft.draft_module_title,
        draft_objective: aiDraft.draft_objective,
        draft_content_outline: generatedBlocks
          .map((block, index) =>
            [
              `${index + 1}. ${block.title}`,
              block.subtitle ? `Sub Tajuk: ${block.subtitle}` : "",
              ...block.items.map((item) => `- ${item}`),
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n"),
        suggested_learning_packages: groupedSummary,
        suggested_assessment_areas: aiDraft.suggested_assessment_areas,
      });

      setWorkspaceMessage("Mapping dan grouping berjaya disimpan.");
      setSavedMatrixRows((current) => ({
        ...current,
        [selectedCmcs?.code || String(selectedCmcsId)]: true,
      }));

      const mappingResponse = await axios.get(
        `${API_BASE_URL}/trade-cmcs-mappings/trade/${selectedTradeId}`,
      );
      setMappings(mappingResponse.data);
    } catch (err) {
      setWorkspaceMessage(
        "Save gagal. Mapping mungkin sudah wujud untuk CMCS ini.",
      );
      console.error(err);
    } finally {
      setSavingWorkspace(false);
    }
  }

  function updateSectionCluster(
    row: MatrixRow,
    rowIndex: number,
    sectionIndex: number,
    update: Partial<SectionClusterDraft>,
  ) {
    const key = getSectionKey(row.no, sectionIndex);
    setSectionClusters((current) => ({
      ...current,
      [key]: {
        ...getDefaultSectionCluster(row, rowIndex, sectionIndex),
        ...current[key],
        ...update,
      },
    }));
  }

  function editSectionClusterTitle(row: MatrixRow, rowIndex: number, sectionIndex: number) {
    const cluster = getSectionCluster(row, rowIndex, sectionIndex);
    const title = window.prompt("Nama tajuk LP / grouping", cluster.title);

    if (!title?.trim()) return;

    updateSectionCluster(row, rowIndex, sectionIndex, {
      title: title.trim(),
      status: "Final Editing",
    });
  }

  function finalizeSectionCluster(row: MatrixRow, rowIndex: number, sectionIndex: number) {
    updateSectionCluster(row, rowIndex, sectionIndex, { status: "Final Saved" });
  }

  function getGroupedOutputs() {
    const groups = new Map<
      string,
      {
        moduleCode: string;
        packageCode: string;
        title: string;
        status: string;
        rowNo: string;
        competency: string;
        sections: { title: string; bullets: string[] }[];
      }
    >();

    transferredRows.forEach((row, rowIndex) => {
      const competencyDecision = getCompetencyGrouping(row.no);

      if (competencyDecision.mode === "none") {
        groups.set(`${row.no}-NO-GROUPING`, {
          moduleCode: modules[0]?.code || `M${String(rowIndex + 1).padStart(2, "0")}`,
          packageCode: "PL01",
          title: row.coreCompetency,
          status: competencyDecision.status,
          rowNo: row.no,
          competency: row.coreCompetency,
          sections: row.sections,
        });
        return;
      }

      row.sections.forEach((section, sectionIndex) => {
        const cluster = getSectionCluster(row, rowIndex, sectionIndex);
        const key = cluster.cluster || `${row.no}-LP${sectionIndex + 1}`;

        if (!groups.has(key)) {
          groups.set(key, {
            moduleCode: cluster.moduleCode,
            packageCode: cluster.packageCode,
            title: cluster.title || row.coreCompetency,
            status: cluster.status,
            rowNo: row.no,
            competency: row.coreCompetency,
            sections: [],
          });
        }

        groups.get(key)?.sections.push(section);
      });
    });

    return [...groups.values()];
  }

  useEffect(() => {
    let cancelled = false;

    async function loadTrades() {
      try {
        const [tradeResponse, cmcsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/trades/`),
          axios.get(`${API_BASE_URL}/cmcs/`),
        ]);
        if (!cancelled) {
          const queryTradeId = Number(
            new URLSearchParams(window.location.search).get("tradeId"),
          );
          const hasQueryTrade = tradeResponse.data.some(
            (trade: Trade) => trade.id === queryTradeId,
          );

          setTrades(tradeResponse.data);
          setCmcsItems(cmcsResponse.data);
          setSelectedCmcsId(cmcsResponse.data[0]?.id || null);
          setSelectedTradeId(
            hasQueryTrade ? queryTradeId : tradeResponse.data[0]?.id || null,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTrades();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTradeId) return;
    let cancelled = false;

    async function loadMappingWorkspace() {
      const [mappingResponse, moduleResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/trade-cmcs-mappings/trade/${selectedTradeId}`),
        axios.get(`${API_BASE_URL}/skp-modules/trade/${selectedTradeId}`),
      ]);

      const packageResponses = await Promise.all(
        moduleResponse.data.map((moduleItem: SKPModule) =>
          axios.get(`${API_BASE_URL}/learning-packages/module/${moduleItem.id}`),
        ),
      );

      if (!cancelled) {
        setMappings(mappingResponse.data);
        setModules(moduleResponse.data);
        setPackages(packageResponses.flatMap((response) => response.data));
      }
    }

    loadMappingWorkspace();

    return () => {
      cancelled = true;
    };
  }, [selectedTradeId]);

  if (loading) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading...</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              CMCS Transformation Mapping
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Mapping CMCS kepada Bidang/Tred SKP
            </h1>
            <p className="mt-2 max-w-4xl text-slate-600">
              Workspace ini menyusun hasil mapping CMCS kepada kandungan khusus
              tred, kemudian fasilitator dan panel menentukan grouping kepada
              Module dan Learning Package sebelum dihantar ke Module Builder.
            </p>
          </div>

          <select
            value={selectedTradeId || ""}
            onChange={(event) => setSelectedTradeId(Number(event.target.value))}
            className="min-w-72 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
          >
            {trades.map((trade) => (
              <option key={trade.id} value={trade.id}>
                {getTradeLabel(trade)}
              </option>
            ))}
          </select>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Selected Tred", selectedTrade?.code || "-"],
            ["CMCS Mapped", String(matrixRows.length)],
            ["Mapping Sections", String(mappingSections.length)],
            ["Module / PL", `${modules.length} / ${packages.length}`],
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

        <section className="grid gap-6 xl:grid-cols-[360px_1fr_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                CMCS Reference
              </h2>
            </div>

            <div className="max-h-[760px] divide-y divide-slate-100 overflow-y-auto">
              {cmcsItems.map((item) => {
                const isSelected = selectedCmcsId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedCmcsId(item.id);
                      setAiDraft(null);
                      setGeneratedBlocks([]);
                      setBlockGroups({});
                      setWorkspaceMessage("");
                    }}
                    className={[
                      "w-full px-5 py-4 text-left transition",
                      isSelected ? "bg-blue-50" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <p className="text-xs font-bold uppercase text-blue-600">
                      {getCmcsLabel(item)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                      {item.description || "Tiada penerangan"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Trade Interpretation
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pilih CMCS reference, jana AI, semak blok kandungan dan tekan
                  Grouping pada item yang hendak digabungkan.
                </p>
              </div>

              <button
                type="button"
                onClick={generateMappingAI}
                disabled={!selectedTradeId || !selectedCmcsId || generatingAI}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {generatingAI ? "Menjana..." : "Jana AI"}
              </button>
            </div>

            {selectedCmcs ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Selected Reference
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {getCmcsLabel(selectedCmcs)} {selectedCmcs.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {selectedCmcs.description || "Tiada penerangan"}
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Pilih CMCS reference di panel kiri.
              </div>
            )}

            <div className="mt-6 space-y-4">
              {generatedBlocks.length === 0 ? (
                <div className="min-h-[460px] rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
                  Blok hasil AI akan dipaparkan di sini. Setiap blok boleh
                  diedit dan digabungkan sebelum disimpan.
                </div>
              ) : (
                generatedBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <input
                        value={block.title}
                        onChange={(event) =>
                          updateGeneratedBlock(block.id, {
                            title: event.target.value,
                          })
                        }
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                        placeholder="Tajuk ringkas blok"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={blockGroups[block.id] || block.groupId || ""}
                          onChange={(event) => groupBlock(block.id, event.target.value)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                        >
                          {generatedBlocks.map((option, optionIndex) => (
                            <option
                              key={option.id}
                              value={blockGroups[option.id] || option.groupId || option.id}
                            >
                              Group {optionIndex + 1}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => groupBlock(block.id)}
                          className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                        >
                          Grouping
                        </button>
                      </div>
                    </div>

                    <input
                      value={block.subtitle}
                      onChange={(event) =>
                        updateGeneratedBlock(block.id, {
                          subtitle: event.target.value,
                        })
                      }
                      className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                      placeholder="Sub tajuk / skop utama blok"
                    />

                    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Sub-sub Tajuk / Isi Penting
                      </p>
                      {block.items.map((item, itemIndex) => (
                        <input
                          key={`${block.id}-${itemIndex}`}
                          value={item}
                          onChange={(event) =>
                            updateGeneratedBlockItem(
                              block.id,
                              itemIndex,
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                          placeholder={`Isi penting ${itemIndex + 1}`}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => addGeneratedBlockItem(block.id)}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50"
                      >
                        + Tambah Isi
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {workspaceMessage && (
              <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                {workspaceMessage}
              </p>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-blue-600">
                Hasil Grouping
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Sahkan sebelum Module Builder
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Item yang berkongsi group akan digabungkan sebagai cadangan LP
                yang sama. Fasilitator/panel boleh ubah group sebelum save.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-bold text-slate-900">Grouping Box</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {groupedBlocks.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">
                    Belum ada hasil grouping.
                  </p>
                ) : (
                  groupedBlocks.map(([groupId, blocks], index) => (
                    <div key={groupId} className="p-5">
                      <p className="text-xs font-bold uppercase text-blue-600">
                        Group {index + 1}
                      </p>
                      <h4 className="mt-1 font-bold text-slate-900">
                        {blocks[0]?.title || "Untitled Group"}
                      </h4>
                      {blocks[0]?.subtitle && (
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {blocks[0].subtitle}
                        </p>
                      )}
                      <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-600">
                        {blocks.map((block) => (
                          <li key={block.id}>
                            <span className="font-semibold text-slate-800">
                              {block.title}
                            </span>
                            {block.subtitle && (
                              <p className="mt-1 text-slate-700">
                                {block.subtitle}
                              </p>
                            )}
                            {block.items.length > 0 && (
                              <ul className="mt-2 list-disc space-y-1 pl-5">
                                {block.items.map((item, itemIndex) => (
                                  <li key={`${block.id}-group-${itemIndex}`}>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={saveMappingWorkspace}
              disabled={savingWorkspace || generatedBlocks.length === 0}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingWorkspace ? "Menyimpan..." : "Save Mapping & Grouping"}
            </button>

            <Link
              href="/module-builder"
              className="block rounded-xl bg-slate-100 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              Ke Module Builder
            </Link>
          </div>
        </section>

        <section className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                1. Mapping Matrix CMCS vs {selectedTrade?.title || "Tred"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Paparan ini meniru logik jadual manual: Core Competency, Work
                Activity CMCS dan tafsiran khusus tred.
              </p>
              {useSampleMatrix && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  Data lengkap ini dimasukkan daripada rajah contoh untuk menilai
                  proses matrix, section dan grouping.
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <div className="grid grid-cols-[70px_260px_320px_1fr_190px] border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                <div className="p-4">No.</div>
                <div className="border-l border-slate-200 p-4">Core Competency</div>
                <div className="border-l border-slate-200 p-4">Work Activity CMCS</div>
                <div className="border-l border-slate-200 p-4">
                  {selectedTrade?.title || "Trade/Tred"} Interpretation
                </div>
              <div className="border-l border-slate-200 p-4">Tindakan</div>
              </div>

              {matrixRows.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  Belum ada mapping untuk tred ini.
                </div>
              ) : (
                matrixRows.map((row) => (
                  <div
                    key={row.no}
                    className="grid grid-cols-[70px_260px_320px_1fr_190px] border-b border-slate-200 text-sm"
                  >
                    <div className="p-4 font-bold text-slate-700">
                      {row.no}
                    </div>
                    <div className="border-l border-slate-200 p-4">
                      <p className="font-bold text-slate-900">
                        {row.coreCompetency}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Relevance: High
                      </p>
                    </div>
                    <div className="border-l border-slate-200 p-4">
                      <ol className="list-decimal space-y-2 pl-5 text-slate-700">
                        {row.workActivities.map((activity) => (
                          <li key={activity}>{activity}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="border-l border-slate-200 p-4">
                      <div className="space-y-4">
                        {row.sections.map((section, sectionIndex) => (
                          <div key={`${row.no}-${section.title}`}>
                            <p className="font-bold text-slate-900">
                              {sectionIndex + 1}. {section.title}
                            </p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-700">
                              {section.bullets.map((bullet) => (
                                <li key={bullet}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-l border-slate-200 p-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {savedMatrixRows[row.no] ? "Saved" : "Draft"}
                      </span>
                      <div className="mt-4 grid gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            window.alert(
                              `Jana AI untuk ${row.no} - ${row.coreCompetency}. AI akan fokus kepada work activity CMCS dan tafsiran tred bagi competency ini sahaja.`,
                            )
                          }
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                        >
                          Jana AI
                        </button>
                        {selectedTradeId && (
                          <Link
                            href={`/trades/${selectedTradeId}`}
                            className="rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-700"
                          >
                            Edit Mapping
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => saveMatrixRow(row)}
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="hidden gap-6 xl:grid-cols-[1fr_420px]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                2. Hasil Mapping Section
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Setiap tajuk di bawah ialah calon kandungan yang akan diputuskan
                sama ada masuk satu LP, beberapa LP, atau modul berlainan.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {transferredRows.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  Belum ada competency dipindahkan ke Hasil Mapping Section.
                  Tekan butang Save pada competency di Mapping Matrix untuk
                  menghantar maklumat ke bahagian ini.
                </div>
              ) : (
                transferredRows.map((row, rowIndex) => (
                    <div key={`section-${row.no}`} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-blue-600">
                            {row.no} - Competency Section
                          </p>
                          <h3 className="mt-1 text-base font-bold text-slate-900">
                            {row.coreCompetency}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {row.sections.length} tajuk mapping daripada matrix
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            Matrix Saved
                          </span>
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                            {getCompetencyGrouping(row.no).status}
                          </span>
                          <button
                            type="button"
                            onClick={() => setNoGrouping(row)}
                            className={`rounded-lg px-3 py-2 text-xs font-bold ${
                              getCompetencyGrouping(row.no).mode === "none"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            Tiada Grouping
                          </button>
                          <button
                            type="button"
                            onClick={() => setSectionGrouping(row)}
                            className={`rounded-lg px-3 py-2 text-xs font-bold ${
                              getCompetencyGrouping(row.no).mode === "section"
                                ? "bg-blue-600 text-white"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            Grouping Tajuk
                          </button>
                          <button
                            type="button"
                            onClick={() => saveCompetencyGrouping(row)}
                            className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        {row.sections.map((section, sectionIndex) => {
                          const cluster = getSectionCluster(row, rowIndex, sectionIndex);
                          const competencyDecision = getCompetencyGrouping(row.no);
                          const isSectionGrouping = competencyDecision.mode === "section";
                          const clusterOptions = row.sections.map((item, optionIndex) => ({
                            value: `${row.no}-LP${optionIndex + 1}`,
                            label: `Gabung dengan ${optionIndex + 1}. ${item.title}`,
                          }));

                          return (
                            <div
                              key={`${row.no}-output-${section.title}`}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <h4 className="font-bold text-slate-900">
                                    {sectionIndex + 1}. {section.title}
                                  </h4>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {isSectionGrouping
                                      ? `Cluster: ${cluster.moduleCode} / ${cluster.packageCode}`
                                      : `Tiada grouping: semua tajuk masuk ${modules[0]?.code || "M01"} / PL01`}
                                  </p>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-[180px_120px_120px]">
                                  <select
                                    value={cluster.cluster}
                                    disabled={!isSectionGrouping}
                                    onChange={(event) =>
                                      updateSectionCluster(row, rowIndex, sectionIndex, {
                                        cluster: event.target.value,
                                        packageCode: `PL${String(
                                          Number(event.target.value.split("LP")[1] || 1),
                                        ).padStart(2, "0")}`,
                                      })
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    {clusterOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      editSectionClusterTitle(row, rowIndex, sectionIndex)
                                    }
                                    disabled={!isSectionGrouping}
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                                  >
                                    Edit Nama
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      finalizeSectionCluster(row, rowIndex, sectionIndex)
                                    }
                                    disabled={!isSectionGrouping}
                                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                                {section.bullets.map((bullet) => (
                                  <li key={bullet}>{bullet}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-blue-600">
                3. Grouping Decision
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Fasilitator / Panel tentukan Module dan LP
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Hasil mapping tidak terus menjadi modul. Panel perlu tentukan
                sama ada section ini cukup untuk satu LP, perlu dipecah kepada
                beberapa LP, atau menjadi modul lain.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-bold text-slate-900">
                  Cadangan Grouping Awal
                </h3>
              </div>
              <div className="divide-y divide-slate-200">
                {getGroupedOutputs().length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">
                    Tiada cadangan grouping lagi. Save competency di Mapping
                    Matrix dahulu.
                  </p>
                ) : (
                  getGroupedOutputs().map((group, index) => (
                    <div
                      key={`group-${group.rowNo}-${group.packageCode}-${index}`}
                      className="grid gap-3 p-5 text-sm"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {group.packageCode}. {group.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {group.sections.length} tajuk mapping digabungkan
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Sumber Competency
                        </p>
                        <p className="mt-1 font-bold text-slate-900">
                          {group.rowNo}. {group.competency}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-bold uppercase text-slate-500">
                            Module
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {group.moduleCode}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-bold uppercase text-slate-500">
                            Learning Package
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {group.packageCode}
                          </p>
                        </div>
                      </div>
                      <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
                        {group.sections.map((section) => (
                          <li key={`${group.packageCode}-${section.title}`}>
                            {section.title}
                          </li>
                        ))}
                      </ul>
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                          group.status === "Final Saved"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {group.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">Decision Output</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  Selepas grouping disahkan, sistem akan menjana Module/LP dan
                  menghantar section yang dipilih ke Builder Mode.
                </p>
                <p className="rounded-xl bg-blue-50 p-3 text-blue-800">
                  Module Builder akan menggunakan setiap LP untuk membina 6
                  bahagian: Tajuk, Objektif, Penerangan, Rujukan, Latihan dan
                  Skema Jawapan.
                </p>
              </div>
              {modules[0] && (
                <Link
                  href={`/module-builder/${modules[0].id}`}
                  className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"
                >
                  Buka Module Builder
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
