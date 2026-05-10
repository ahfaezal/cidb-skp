"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { API_BASE_URL } from "@/src/lib/api";

type SKPModule = {
  id: number;
  trade_id: number;
  competency_id?: number | null;
  code: string;
  title: string;
  objective?: string;
  description?: string;
  status: string;
};

type Trade = {
  id: number;
  code: string;
  title: string;
  sector?: string;
};

const MAPPING_DRAFT_MODULES = [
  {
    code: "M01",
    competencyCode: "C01",
    title: "Business Operation Management",
    objective:
      "Pengenalan, pemeriksaan struktur jambatan, pengurusan data, ujian beban, inovasi IR4.0 dan penambahbaikan berterusan.",
    packageCount: 1,
    sectionCount: 6,
  },
  {
    code: "M02",
    competencyCode: "C02",
    title: "Tendering Management",
    objective:
      "Pengenalpastian skop projek Bridge Works, penyediaan data kos dan pengurusan proses tender.",
    packageCount: 1,
    sectionCount: 3,
  },
  {
    code: "M03",
    competencyCode: "C03",
    title: "Contract Implementation & Management",
    objective:
      "Pengurusan anugerah kontrak, pensijilan bayaran, tuntutan dan penyelesaian pertikaian.",
    packageCount: 1,
    sectionCount: 3,
  },
  {
    code: "M04",
    competencyCode: "C04",
    title: "Project Planning & Scheduling",
    objective:
      "Penyediaan Work Breakdown Structure (WBS), program kerja dan jadual pelaksanaan Bridge Works.",
    packageCount: 1,
    sectionCount: 2,
  },
  {
    code: "M05",
    competencyCode: "C05",
    title: "Construction Operation Management",
    objective:
      "Kawalan kualiti, OSH, alam sekitar, trafik, pelaksanaan tapak dan demobilisation.",
    packageCount: 1,
    sectionCount: 5,
  },
  {
    code: "M06",
    competencyCode: "C06",
    title: "Project Handover",
    objective:
      "Dokumentasi penyerahan jambatan, liabiliti kecacatan, CMGD dan akaun akhir projek.",
    packageCount: 1,
    sectionCount: 3,
  },
  {
    code: "M07",
    competencyCode: "C07",
    title: "Additional Related Knowledge",
    objective:
      "Pengetahuan tambahan berkaitan pemeriksaan struktur, dokumentasi, ujian beban, IR4.0 dan penambahbaikan teknikal.",
    packageCount: 1,
    sectionCount: 5,
  },
];

export default function ModuleBuilderPage() {
  const [modules, setModules] = useState<SKPModule[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [moduleResponse, tradeResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/skp-modules/`),
        axios.get(`${API_BASE_URL}/trades/`),
      ]);

      if (!cancelled) {
        setModules(moduleResponse.data);
        setTrades(tradeResponse.data);
        setLoading(false);
      }
    }

    loadData().catch(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const draftCount = modules.filter((moduleItem) => moduleItem.status === "Draft").length;
  const developmentCount = modules.filter(
    (moduleItem) => moduleItem.status === "In Development",
  ).length;
  const reviewCount = modules.filter((moduleItem) =>
    moduleItem.status.toLowerCase().includes("review"),
  ).length;

  function getTrade(moduleItem: SKPModule) {
    return trades.find((trade) => trade.id === moduleItem.trade_id);
  }

  const railwayTrade = trades.find(
    (trade) =>
      trade.code === "RWY" ||
      trade.code === "E13" ||
      trade.title.toLowerCase().includes("railway"),
  );
  const displayModules = railwayTrade
    ? MAPPING_DRAFT_MODULES.map((draft) => {
        const existingModule =
          modules.find((moduleItem) => moduleItem.code === draft.code) ||
          modules.find((moduleItem) => moduleItem.trade_id === railwayTrade.id && draft.code === "M01");

        return {
          ...draft,
          id: existingModule?.id,
          trade: railwayTrade,
          status: existingModule?.status || "Mapping Draft",
          isExisting: Boolean(existingModule),
        };
      })
    : modules.map((moduleItem) => ({
        code: moduleItem.code,
        competencyCode: "",
        title: moduleItem.title,
        objective: moduleItem.objective || moduleItem.description || "Tiada objektif",
        packageCount: 0,
        sectionCount: 0,
        id: moduleItem.id,
        trade: getTrade(moduleItem),
        status: moduleItem.status,
        isExisting: true,
      }));

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Module Builder
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Pembangunan Modul SKP
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Pilih modul untuk buka Builder Mode dan Document Mode. Kandungan
            modul boleh dibina melalui blok nota, jadual, rajah, carta,
            gambar, rujukan dan latihan.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Total Modules", displayModules.length],
            ["Draft", railwayTrade ? displayModules.length : draftCount],
            ["In Development", developmentCount],
            ["Review Required", reviewCount],
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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Senarai Modul Dalam Pembangunan
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {loading ? (
              <div className="px-6 py-10 text-sm text-slate-500">Loading...</div>
            ) : displayModules.length === 0 ? (
              <div className="px-6 py-10 text-sm text-slate-500">
                Belum ada modul. Jana modul daripada Mapping dahulu.
              </div>
            ) : (
              displayModules.map((moduleItem) => (
                  <div
                    key={`${moduleItem.code}-${moduleItem.title}`}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[90px_1.5fr_1fr_170px_150px]"
                  >
                    <div className="font-bold text-blue-600">
                      {moduleItem.code}
                      {moduleItem.competencyCode && (
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {moduleItem.competencyCode}
                        </p>
                      )}
                    </div>

                    <div>
                      {moduleItem.id ? (
                        <Link
                          href={`/module-builder/${moduleItem.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600"
                        >
                          {moduleItem.title}
                        </Link>
                      ) : (
                        <p className="font-semibold text-slate-900">
                          {moduleItem.title}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {moduleItem.objective}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {moduleItem.packageCount} LP / {moduleItem.sectionCount} tajuk mapping
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      {moduleItem.trade
                        ? `${moduleItem.trade.code} - ${moduleItem.trade.title}`
                        : "Mapping Draft"}
                    </div>

                    <div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          moduleItem.status === "Mapping Draft"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {moduleItem.status}
                      </span>
                      {!moduleItem.isExisting && (
                        <p className="mt-2 text-xs text-slate-500">
                          Belum dijana ke database
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      {moduleItem.id ? (
                        <Link
                          href={`/module-builder/${moduleItem.id}`}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Open Builder
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500"
                        >
                          Draft Only
                        </button>
                      )}
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
