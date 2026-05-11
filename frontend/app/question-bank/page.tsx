import { AppShell } from "@/components/layouts/AppShell";

const detectedTopics = [
  "Pengenalan Thermite Welding",
  "Peralatan & Bahan",
  "Proses Thermite Welding",
  "Keselamatan Kerja",
  "Pemeriksaan Rel",
  "Persekitaran Kerja",
];

const questions = [
  {
    no: "Q1",
    type: "Objektif",
    level: "Sederhana",
    skill: "Keselamatan",
    question:
      "Apakah langkah pertama yang perlu dilakukan sebelum memulakan proses thermite welding?",
    options: [
      "A. Memasang acuan (mould)",
      "B. Memeriksa peralatan keselamatan diri (PPE)",
      "C. Membersihkan hujung rel",
      "D. Memanaskan acuan",
    ],
    answer: "B",
    rationale:
      "Langkah keselamatan diri perlu diutamakan sebelum sebarang aktiviti kerja dijalankan.",
  },
  {
    no: "Q2",
    type: "Objektif",
    level: "Rendah",
    skill: "Fakta / Teori",
    question:
      "Thermite welding digunakan untuk menyambung rel jenis berikut kecuali:",
    options: ["A. 50kg/m", "B. 60kg/m", "C. Kayu", "D. 54kg/m"],
    answer: "C",
    rationale:
      "Thermite welding hanya digunakan untuk rel besi atau keluli, bukan untuk kayu.",
  },
  {
    no: "Q3",
    type: "Subjektif",
    level: "Tinggi",
    skill: "Prosedur",
    question:
      "Terangkan langkah-langkah keselamatan sebelum proses thermite welding dijalankan.",
    options: [],
    answer: "Skema & Rubrik: Ya",
    rationale: "",
  },
];

function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "orange" | "purple" | "red" | "slate";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function StepTitle({
  no,
  title,
}: {
  no: number;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        {no}
      </span>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
  );
}

export default function QuestionBankPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-blue-50 text-2xl">
              📝
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Bangunkan Soalan
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Hasilkan soalan berkualiti berdasarkan nota dan tetapan yang
                anda pilih.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              Simpan Draf
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              Muat Semula
            </button>
            <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              Jana Soalan
            </button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[300px_1fr_330px]">
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <StepTitle no={1} title="Upload Nota" />

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <div className="text-3xl">☁️</div>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Seret & lepaskan fail di sini
                </p>
                <p className="text-xs text-slate-500">atau</p>
                <button className="mt-3 rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700">
                  Pilih Fail
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-slate-500">
                  Fail Dimuat Naik (2)
                </p>

                {["Thermite Welding.pdf", "Keselamatan Rel.docx"].map(
                  (file, index) => (
                    <div
                      key={file}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">📄</span>
                        <span className="font-medium text-slate-700">
                          {file}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {index === 0 ? "2.4 MB" : "1.8 MB"} ✅
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={2} title="Jenis Soalan" />
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  Objektif
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  Subjektif
                </label>
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={3} title="Jumlah Soalan" />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-600">Objektif</span>
                  <input
                    className="w-16 rounded-lg border border-slate-200 px-3 py-2"
                    defaultValue="20"
                  />
                  <span className="text-slate-500">soalan</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-600">Subjektif</span>
                  <input
                    className="w-16 rounded-lg border border-slate-200 px-3 py-2"
                    defaultValue="5"
                  />
                  <span className="text-slate-500">soalan</span>
                </div>
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                  Jumlah Keseluruhan: 25 soalan
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={4} title="Keterampilan Soalan" />
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                {[
                  "Prosedur",
                  "Fakta / Teori",
                  "Keselamatan",
                  "Sikap",
                  "Persekitaran",
                ].map((item) => (
                  <label key={item} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <StepTitle no={5} title="Aras Soalan" />
              <div className="space-y-3 text-sm">
                {[
                  ["Rendah", "30%", "bg-green-500"],
                  ["Sederhana", "50%", "bg-orange-500"],
                  ["Tinggi", "20%", "bg-red-500"],
                ].map(([label, value, color]) => (
                  <div key={label} className="grid grid-cols-[80px_45px_1fr] items-center gap-2">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-700">{value}</span>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <StepTitle no={6} title="Skema Jawapan" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    Jana skema jawapan secara automatik
                  </p>
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                    ON
                  </span>
                </div>
              </div>

              <div>
                <StepTitle no={7} title="Rubrik Jawapan" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    Jana rubrik pemarkahan untuk subjektif
                  </p>
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                    ON
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex flex-wrap gap-2">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                  Semua (25)
                </button>
                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  Objektif (20)
                </button>
                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  Subjektif (5)
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                  placeholder="Cari soalan..."
                />
                <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">
                  Filter
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((item) => (
                <div
                  key={item.no}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">
                        {item.no}
                      </span>
                      <Badge tone="slate">{item.type}</Badge>
                      <Badge
                        tone={
                          item.level === "Tinggi"
                            ? "red"
                            : item.level === "Sederhana"
                              ? "orange"
                              : "green"
                        }
                      >
                        Aras: {item.level}
                      </Badge>
                      <Badge tone="purple">Keterampilan: {item.skill}</Badge>
                    </div>

                    <div className="flex gap-3 text-slate-500">
                      <button>✎</button>
                      <button>↻</button>
                      <button>🗑</button>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[1fr_180px]">
                    <div>
                      <p className="text-sm font-medium leading-7 text-slate-800">
                        {item.question}
                      </p>

                      {item.options.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {item.options.map((option) => (
                            <div
                              key={option}
                              className="flex items-center gap-3 text-sm text-slate-700"
                            >
                              <span
                                className={`h-4 w-4 rounded-full border ${
                                  option.startsWith(item.answer + ".")
                                    ? "border-green-500 bg-green-500"
                                    : "border-slate-300"
                                }`}
                              />
                              {option}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 flex gap-2">
                          <Badge tone="blue">Markah: 10</Badge>
                          <Badge tone="slate">Skema & Rubrik: Ya</Badge>
                        </div>
                      )}

                      <div className="mt-4 inline-flex rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                        Jawapan: {item.answer}
                      </div>
                    </div>

                    {item.rationale && (
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-blue-700">
                          AI Rasional
                        </p>
                        <p className="mt-2 text-xs leading-6 text-slate-600">
                          {item.rationale}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
              <span>Paparan 1–10 daripada 25 soalan</span>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-slate-200 px-3 py-2">
                  ‹
                </button>
                <button className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white">
                  1
                </button>
                <button className="rounded-lg border border-slate-200 px-3 py-2">
                  2
                </button>
                <button className="rounded-lg border border-slate-200 px-3 py-2">
                  3
                </button>
                <button className="rounded-lg border border-slate-200 px-3 py-2">
                  ›
                </button>
              </div>
            </div>
          </main>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Analisis AI Nota
              </h2>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="mb-3 flex justify-between">
                  <p className="text-sm font-bold text-slate-800">
                    Topik Dikenal Pasti
                  </p>
                  <button className="text-xs font-bold text-blue-600">
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {detectedTopics.map((topic) => (
                    <div
                      key={topic}
                      className="flex items-center gap-3 text-sm text-slate-700"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                        ✓
                      </span>
                      {topic}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-sm font-bold text-slate-800">
                  Taburan Keterampilan
                </p>

                <div className="mt-4 flex items-center gap-5">
                  <div className="h-28 w-28 rounded-full bg-[conic-gradient(#2563eb_0_40%,#f97316_40%_70%,#22c55e_70%_90%,#7c3aed_90%_95%,#8b5cf6_95%_100%)]" />
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>Prosedur — 40%</p>
                    <p>Fakta / Teori — 30%</p>
                    <p>Keselamatan — 20%</p>
                    <p>Sikap — 5%</p>
                    <p>Persekitaran — 5%</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-sm font-bold text-slate-800">
                  Taburan Aras Soalan
                </p>

                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ["Rendah", "30%", "bg-green-500"],
                    ["Sederhana", "50%", "bg-orange-500"],
                    ["Tinggi", "20%", "bg-red-500"],
                  ].map(([label, value, color]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[80px_1fr_45px] items-center gap-2"
                    >
                      <span className="text-slate-600">{label}</span>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${color}`}
                          style={{ width: value }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Ringkasan Tetapan
              </h2>

              <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm">
                {[
                  ["Jumlah Soalan", "25"],
                  ["Objektif", "20"],
                  ["Subjektif", "5"],
                  ["Skema Jawapan", "Diaktifkan ✅"],
                  ["Rubrik Jawapan", "Diaktifkan ✅"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left shadow-sm hover:bg-blue-100">
              <p className="text-lg font-bold text-blue-700">Seterusnya →</p>
              <p className="mt-1 text-sm text-blue-600">
                Semak & jana skema jawapan serta rubrik.
              </p>
            </button>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
