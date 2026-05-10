"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layouts/AppShell";

type CMCSItem = {
  id: number;
  code?: string;
  title: string;
  description?: string;
  level?: string;
  sector?: string;
};

type CompetencyUnit = {
  id: number;
  cmcs_id: number;
  code?: string;
  title: string;
  description?: string;
};

type WorkActivity = {
  id: number;
  competency_unit_id: number;
  code?: string;
  title: string;
  description?: string;
};

type PerformanceCriteria = {
  id: number;
  work_activity_id: number;
  criteria: string;
};

type PerformanceCriteriaItem = {
  id: number;
  performance_criteria_id: number;
  type: string;
  content: string;
};

export default function CMCSDetailPage() {
  const params = useParams();
  const cmcsId = params.id as string;

  const [cmcs, setCmcs] = useState<CMCSItem | null>(null);
  const [units, setUnits] = useState<CompetencyUnit[]>([]);
  const [activities, setActivities] = useState<Record<number, WorkActivity[]>>({});
  const [criteria, setCriteria] = useState<Record<number, PerformanceCriteria[]>>({});
  const [criteriaItems, setCriteriaItems] = useState<Record<number, PerformanceCriteriaItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"builder" | "document">("builder");

  const [unitCode, setUnitCode] = useState("");
  const [unitTitle, setUnitTitle] = useState("");
  const [unitDescription, setUnitDescription] = useState("");

  const [activeUnitId, setActiveUnitId] = useState<number | null>(null);
  const [activityCode, setActivityCode] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  const [activeActivityId, setActiveActivityId] = useState<number | null>(null);
  const [criteriaText, setCriteriaText] = useState("");

  const [activeCriteriaId, setActiveCriteriaId] = useState<number | null>(null);
  const [itemType, setItemType] = useState("knowledge");
  const [itemContent, setItemContent] = useState("");

    async function loadData() {
    setLoading(true);

    try {
        const cmcsResponse = await axios.get(
        `http://127.0.0.1:8000/cmcs/${cmcsId}`
        );

        setCmcs(cmcsResponse.data);

        const unitsResponse = await axios.get(
        `http://127.0.0.1:8000/competency-units/cmcs/${cmcsId}`
        );

        setUnits(unitsResponse.data);

        const activityMap: Record<number, WorkActivity[]> = {};
        const criteriaMap: Record<number, PerformanceCriteria[]> = {};
        const itemMap: Record<number, PerformanceCriteriaItem[]> = {};

        for (const unit of unitsResponse.data) {
        const activityResponse = await axios.get(
            `http://127.0.0.1:8000/work-activities/unit/${unit.id}`
        );

        activityMap[unit.id] = activityResponse.data;

        for (const activity of activityResponse.data) {
            const criteriaResponse = await axios.get(
            `http://127.0.0.1:8000/performance-criteria/activity/${activity.id}`
            );

            criteriaMap[activity.id] = criteriaResponse.data;

            for (const pc of criteriaResponse.data) {
            const itemResponse = await axios.get(
                `http://127.0.0.1:8000/performance-criteria-items/${pc.id}`
            );

            itemMap[pc.id] = itemResponse.data;
            }
        }
        }

        setActivities(activityMap);
        setCriteria(criteriaMap);
        setCriteriaItems(itemMap);
    } catch (error) {
        console.error("Failed to load CMCS detail data:", error);
    } finally {
        setLoading(false);
    }
    }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmcsId]);

  async function handleAddUnit(e: React.FormEvent) {
    e.preventDefault();

    if (!unitTitle.trim()) return;

    await axios.post("http://127.0.0.1:8000/competency-units/", {
      cmcs_id: Number(cmcsId),
      code: unitCode,
      title: unitTitle,
      description: unitDescription,
    });

    setUnitCode("");
    setUnitTitle("");
    setUnitDescription("");

    await loadData();
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();

    if (!activeUnitId || !activityTitle.trim()) return;

    await axios.post("http://127.0.0.1:8000/work-activities/", {
      competency_unit_id: activeUnitId,
      code: activityCode,
      title: activityTitle,
      description: activityDescription,
    });

    setActivityCode("");
    setActivityTitle("");
    setActivityDescription("");
    setActiveUnitId(null);

    await loadData();
  }

  async function handleAddCriteria(e: React.FormEvent) {
    e.preventDefault();

    if (!activeActivityId || !criteriaText.trim()) return;

    await axios.post("http://127.0.0.1:8000/performance-criteria/", {
      work_activity_id: activeActivityId,
      criteria: criteriaText,
    });

    setCriteriaText("");
    setActiveActivityId(null);

    await loadData();
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();

    if (!activeCriteriaId || !itemContent.trim()) return;

    await axios.post("http://127.0.0.1:8000/performance-criteria-items/", {
      performance_criteria_id: activeCriteriaId,
      type: itemType,
      content: itemContent,
    });

    setItemType("knowledge");
    setItemContent("");
    setActiveCriteriaId(null);

    await loadData();
  }

  async function handleDeleteUnit(id: number) {
    if (!window.confirm("Padam Competency Unit ini?")) return;

    await axios.delete(`http://127.0.0.1:8000/competency-units/${id}`);
    await loadData();
  }

  async function handleDeleteActivity(id: number) {
    if (!window.confirm("Padam Work Activity ini?")) return;

    await axios.delete(`http://127.0.0.1:8000/work-activities/${id}`);
    await loadData();
  }

  async function handleDeleteCriteria(id: number) {
    if (!window.confirm("Padam Performance Criteria ini?")) return;

    await axios.delete(`http://127.0.0.1:8000/performance-criteria/${id}`);
    await loadData();
  }

  async function handleDeleteItem(id: number) {
    if (!window.confirm("Padam item ini?")) return;

    await axios.delete(`http://127.0.0.1:8000/performance-criteria-items/${id}`);
    await loadData();
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading...</p>
      </AppShell>
    );
  }

  if (!cmcs) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-700">CMCS tidak dijumpai</h1>

          <Link
            href="/cmcs"
            className="mt-4 inline-block text-sm font-semibold text-blue-600"
          >
            ← Kembali ke senarai CMCS
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between gap-4">
            <Link href="/cmcs" className="text-sm font-semibold text-blue-600">
              ← Kembali ke CMCS
            </Link>

            <button
              onClick={() => window.print()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Print / Save PDF
            </button>
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
            CMCS Detail
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {cmcs.title}
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            {cmcs.description || "Tiada penerangan direkodkan."}
          </p>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setViewMode("builder")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                viewMode === "builder"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              Builder View
            </button>

            <button
              onClick={() => setViewMode("document")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                viewMode === "document"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              Document View
            </button>
          </div>
        </section>

        {viewMode === "document" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:shadow-none">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Standard Document Preview
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {cmcs.title}
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                {cmcs.description || "Tiada penerangan direkodkan."}
              </p>
            </div>

            <div className="mt-6 space-y-8">
              {units.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Belum ada kandungan standard.
                </p>
              ) : (
                units.map((unit) => (
                  <div key={unit.id} className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {unit.code || `CU-${String(unit.id).padStart(3, "0")}`} —{" "}
                        {unit.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {unit.description || "Tiada penerangan"}
                      </p>
                    </div>

                    {(activities[unit.id] || []).map((activity) => (
                      <div
                        key={activity.id}
                        className="ml-0 rounded-xl border border-slate-200 p-4 md:ml-6"
                      >
                        <h4 className="font-semibold text-slate-900">
                          {activity.code ||
                            `WA-${String(activity.id).padStart(3, "0")}`}{" "}
                          {activity.title}
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          {activity.description || "Tiada penerangan"}
                        </p>

                        <div className="mt-4 space-y-4">
                          {(criteria[activity.id] || []).length === 0 ? (
                            <p className="text-sm text-slate-400">
                              Belum ada Performance Criteria.
                            </p>
                          ) : (
                            (criteria[activity.id] || []).map((pc, index) => (
                              <div key={pc.id} className="rounded-lg bg-slate-50 p-4">
                                <p className="text-sm text-slate-700">
                                  <span className="mr-2 font-bold text-emerald-700">
                                    PC{index + 1}
                                  </span>
                                  {pc.criteria}
                                </p>

                                {(criteriaItems[pc.id] || []).length > 0 && (
                                  <div className="mt-3 grid gap-2">
                                    {(criteriaItems[pc.id] || []).map((item) => (
                                      <div
                                        key={item.id}
                                        className="rounded-md border border-slate-200 bg-white px-3 py-2"
                                      >
                                        <p className="text-xs font-bold uppercase text-indigo-700">
                                          {item.type}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-700">
                                          {item.content}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {viewMode === "builder" && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Kod CMCS</p>
                <p className="mt-2 text-xl font-bold text-blue-600">
                  {cmcs.code || `CMCS-${String(cmcs.id).padStart(3, "0")}`}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Level</p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {cmcs.level || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Sector</p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {cmcs.sector || "-"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Tambah Competency Unit
              </h2>

              <form onSubmit={handleAddUnit} className="mt-5 grid gap-4">
                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Kod CU, contoh: CU01"
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                />

                <input
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Tajuk Competency Unit"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                />

                <textarea
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Penerangan Competency Unit"
                  value={unitDescription}
                  onChange={(e) => setUnitDescription(e.target.value)}
                />

                <button
                  type="submit"
                  className="w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  + Simpan Competency Unit
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Senarai Competency Unit, Work Activity & Performance Criteria
                </h2>
              </div>

              {units.length === 0 ? (
                <div className="px-6 py-10 text-sm text-slate-500">
                  Tiada Competency Unit direkodkan lagi.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {units.map((unit) => (
                    <div key={unit.id} className="space-y-4 px-6 py-6">
                      <div className="grid gap-4 md:grid-cols-[100px_1fr_160px]">
                        <div className="font-bold text-blue-600">
                          {unit.code || `CU-${String(unit.id).padStart(3, "0")}`}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">{unit.title}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {unit.description || "Tiada penerangan"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setActiveUnitId(unit.id)}
                            className="h-fit rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                          >
                            + Activity
                          </button>

                          <button
                            onClick={() => handleDeleteUnit(unit.id)}
                            className="h-fit rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
                            Delete CU
                          </button>
                        </div>
                      </div>

                      {activeUnitId === unit.id && (
                        <form
                          onSubmit={handleAddActivity}
                          className="ml-0 grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 md:ml-24"
                        >
                          <input
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                            placeholder="Kod Activity, contoh: WA01"
                            value={activityCode}
                            onChange={(e) => setActivityCode(e.target.value)}
                          />

                          <input
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                            placeholder="Tajuk Work Activity"
                            value={activityTitle}
                            onChange={(e) => setActivityTitle(e.target.value)}
                          />

                          <textarea
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                            placeholder="Penerangan Work Activity"
                            value={activityDescription}
                            onChange={(e) => setActivityDescription(e.target.value)}
                          />

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Simpan Activity
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveUnitId(null)}
                              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="ml-0 space-y-3 md:ml-24">
                        {(activities[unit.id] || []).length === 0 ? (
                          <p className="text-sm text-slate-400">
                            Belum ada Work Activity.
                          </p>
                        ) : (
                          (activities[unit.id] || []).map((activity) => (
                            <div
                              key={activity.id}
                              className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    <span className="mr-2 text-blue-600">
                                      {activity.code ||
                                        `WA-${String(activity.id).padStart(3, "0")}`}
                                    </span>
                                    {activity.title}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {activity.description || "Tiada penerangan"}
                                  </p>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setActiveActivityId(activity.id)}
                                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    + Criteria
                                  </button>

                                  <button
                                    onClick={() => handleDeleteActivity(activity.id)}
                                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>

                              {activeActivityId === activity.id && (
                                <form
                                  onSubmit={handleAddCriteria}
                                  className="grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3"
                                >
                                  <textarea
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500"
                                    placeholder="Contoh: Safety requirement is identified based on project scope and regulatory requirement."
                                    value={criteriaText}
                                    onChange={(e) => setCriteriaText(e.target.value)}
                                  />

                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                    >
                                      Simpan Criteria
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setActiveActivityId(null)}
                                      className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </form>
                              )}

                              <div className="space-y-2 border-t border-slate-200 pt-3">
                                {(criteria[activity.id] || []).length === 0 ? (
                                  <p className="text-xs text-slate-400">
                                    Belum ada Performance Criteria.
                                  </p>
                                ) : (
                                  (criteria[activity.id] || []).map((pc, index) => (
                                    <div
                                      key={pc.id}
                                      className="rounded-lg bg-white px-3 py-3"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <p className="text-xs text-slate-700">
                                          <span className="mr-2 font-bold text-emerald-700">
                                            PC{index + 1}
                                          </span>
                                          {pc.criteria}
                                        </p>

                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => setActiveCriteriaId(pc.id)}
                                            className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                          >
                                            + Item
                                          </button>

                                          <button
                                            onClick={() => handleDeleteCriteria(pc.id)}
                                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>

                                      {activeCriteriaId === pc.id && (
                                        <form
                                          onSubmit={handleAddItem}
                                          className="mt-3 grid gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3"
                                        >
                                          <select
                                            value={itemType}
                                            onChange={(e) => setItemType(e.target.value)}
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                          >
                                            <option value="knowledge">Knowledge</option>
                                            <option value="skill">Skill</option>
                                            <option value="attitude">Attitude</option>
                                            <option value="safety">Safety</option>
                                            <option value="environment">Environment</option>
                                          </select>

                                          <textarea
                                            value={itemContent}
                                            onChange={(e) => setItemContent(e.target.value)}
                                            placeholder="Masukkan kandungan item..."
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                          />

                                          <div className="flex gap-2">
                                            <button
                                              type="submit"
                                              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
                                            >
                                              Simpan Item
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => setActiveCriteriaId(null)}
                                              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                                            >
                                              Batal
                                            </button>
                                          </div>
                                        </form>
                                      )}

                                      <div className="mt-3 space-y-2">
                                        {(criteriaItems[pc.id] || []).map((item) => (
                                          <div
                                            key={item.id}
                                            className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                          >
                                            <div>
                                              <p className="text-xs font-bold uppercase text-indigo-700">
                                                {item.type}
                                              </p>

                                              <p className="mt-1 text-xs text-slate-700">
                                                {item.content}
                                              </p>
                                            </div>

                                            <button
                                              onClick={() => handleDeleteItem(item.id)}
                                              className="text-xs font-semibold text-red-600"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
