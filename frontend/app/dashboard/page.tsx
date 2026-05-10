"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { API_BASE_URL } from "@/src/lib/api";

const roles = [
  "Super Admin",
  "Project Manager",
  "Pegawai CIDB",
  "Fasilitator",
  "Ahli Panel Pembangun",
  "Ahli Panel Penilai",
];

const workflowSteps = [
  "Trade Setup",
  "Mapping CMCS",
  "Deraf Kandungan Modul",
  "Semakan Panel",
  "Module Builder",
  "Pembangunan Soalan",
  "JTPK",
  "JPL",
  "Selesai",
];

type CMCSItem = {
  id: number;
  code?: string;
  title: string;
};

type Trade = {
  id: number;
  code: string;
  title: string;
  category_name?: string;
  sector?: string;
  facilitator_name?: string;
  workflow_status?: string;
  status?: string;
};

type SKPModule = {
  id: number;
  trade_id: number;
  code: string;
  title: string;
  status: string;
};

type DashboardData = {
  cmcs: CMCSItem[];
  trades: Trade[];
  modules: SKPModule[];
};

function normalizeStatus(status?: string) {
  return status || "Mapping Process";
}

function getTradeModules(modules: SKPModule[], tradeId: number) {
  return modules.filter((moduleItem) => moduleItem.trade_id === tradeId);
}

export default function DashboardPage() {
  const [selectedRole, setSelectedRole] = useState("Project Manager");
  const [data, setData] = useState<DashboardData>({
    cmcs: [],
    trades: [],
    modules: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      const [cmcsResponse, tradeResponse, moduleResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/cmcs/`),
        axios.get(`${API_BASE_URL}/trades/`),
        axios.get(`${API_BASE_URL}/skp-modules/`),
      ]);

      if (!cancelled) {
        setData({
          cmcs: cmcsResponse.data,
          trades: tradeResponse.data,
          modules: moduleResponse.data,
        });
        setLoading(false);
      }
    }

    loadDashboardData().catch(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const officialCmcsCount = data.cmcs.filter((item) => item.code?.startsWith("C")).length;
  const activeTrades = data.trades.filter((trade) => trade.status !== "Inactive");
  const draftModules = data.modules.filter((moduleItem) => moduleItem.status === "Draft");
  const reviewModules = data.modules.filter((moduleItem) =>
    moduleItem.status.toLowerCase().includes("review"),
  );

  const projectRows = useMemo(
    () =>
      activeTrades.map((trade) => {
        const tradeModules = getTradeModules(data.modules, trade.id);
        const completedModules = tradeModules.filter((moduleItem) =>
          moduleItem.status.toLowerCase().includes("complete"),
        );
        const progress =
          tradeModules.length === 0
            ? 15
            : Math.max(25, Math.round((completedModules.length / tradeModules.length) * 100));

        return {
          ...trade,
          modules: tradeModules,
          progress,
        };
      }),
    [activeTrades, data.modules],
  );

  const actionItems = [
    {
      title: "Sahkan CMCS Master",
      detail: `${officialCmcsCount} core competency rasmi tersedia untuk mapping.`,
      href: "/cmcs",
      status: officialCmcsCount >= 6 ? "Ready" : "Need setup",
    },
    {
      title: "Lengkapkan Trade/Tred",
      detail: `${activeTrades.length} tred aktif direkodkan untuk proses mapping.`,
      href: "/trades",
      status: activeTrades.length > 0 ? "Ready" : "Need setup",
    },
    {
      title: "Jalankan Mapping",
      detail: "Fasilitator perlu jana, edit dan save hasil mapping setiap competency.",
      href: "/mapping",
      status: "Action",
    },
    {
      title: "Bangunkan Modul",
      detail: `${draftModules.length} modul masih dalam draft.`,
      href: "/module-builder",
      status: draftModules.length > 0 ? "Action" : "Waiting",
    },
    {
      title: "Semakan Panel",
      detail: `${reviewModules.length} modul menunggu semakan.`,
      href: "/verification",
      status: reviewModules.length > 0 ? "Action" : "Waiting",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              SKP-CIDB Project Command Center
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Pusat kawalan pembangunan SKP daripada CMCS master, mapping,
              semakan panel, module builder, assessment, JTPK dan JPL.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-xs font-bold uppercase text-slate-500">
              Paparan Peranan
            </label>
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase text-blue-600">
            Current Workspace
          </p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selectedRole}</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-700">
                {selectedRole === "Super Admin"
                  ? "Akses penuh untuk CMCS master, pengguna, trade/tred dan semua workflow projek."
                  : selectedRole === "Fasilitator"
                    ? "Fokus kepada setup tred, mapping CMCS, grouping dan penyediaan deraf modul untuk panel."
                    : selectedRole === "Ahli Panel Pembangun"
                      ? "Fokus kepada pembangunan kandungan modul, nota pembelajaran dan bahan sokongan."
                      : selectedRole === "Ahli Panel Penilai"
                        ? "Fokus kepada semakan kandungan, assessment, skema jawapan dan rubrik."
                        : "Fokus kepada pemantauan status projek, semakan kemajuan dan kelulusan peringkat kerja."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <Link href="/cmcs" className="rounded-lg bg-white px-4 py-3 font-semibold text-blue-600">
                CMCS
              </Link>
              <Link href="/trades" className="rounded-lg bg-white px-4 py-3 font-semibold text-blue-600">
                Trade/Tred
              </Link>
              <Link href="/mapping" className="rounded-lg bg-white px-4 py-3 font-semibold text-blue-600">
                Mapping
              </Link>
              <Link href="/module-builder" className="rounded-lg bg-white px-4 py-3 font-semibold text-blue-600">
                Module Builder
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["CMCS Core", officialCmcsCount, "C01-C06 master reference"],
            ["Trade/Tred Aktif", activeTrades.length, "Pra-mapping setup"],
            ["Module Draft", draftModules.length, "Dalam pembangunan"],
            ["Review Required", reviewModules.length, "Menunggu semakan"],
          ].map(([title, value, desc]) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "-" : value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            SKP Development Workflow
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-9">
            {workflowSteps.map((item, index) => (
              <div
                key={item}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs font-bold text-blue-600">STEP {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Projek SKP Aktif
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Status setiap tred daripada setup hingga pembangunan modul.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {projectRows.length === 0 ? (
                <div className="p-5 text-sm text-slate-500">
                  Belum ada trade/tred aktif direkodkan.
                </div>
              ) : (
                projectRows.map((trade) => (
                  <div key={trade.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_180px_130px] lg:items-center">
                    <div>
                      <Link
                        href={`/trades/${trade.id}`}
                        className="font-bold text-blue-600"
                      >
                        {trade.code} - {trade.title}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        {trade.category_name || trade.sector || "Kategori belum lengkap"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Fasilitator: {trade.facilitator_name || "Belum ditetapkan"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Progress
                      </p>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${trade.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {trade.progress}%
                      </p>
                    </div>
                    <div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {normalizeStatus(trade.workflow_status)}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        {trade.modules.length} modul
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Action Required
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Perkara yang perlu diberi perhatian mengikut workflow.
              </p>
            </div>
            <div className="divide-y divide-slate-200">
              {actionItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="block p-5 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {item.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
