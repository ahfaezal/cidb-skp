import { AppShell } from "@/components/layouts/AppShell";

const outputs = [
  {
    type: "Module PDF",
    title: "Bridge Works Management Module",
    source: "Module Builder",
    status: "Ready",
  },
  {
    type: "Assessment Paper",
    title: "Plumbing KS & PA Set",
    source: "Assessment Builder",
    status: "Draft",
  },
  {
    type: "Rubric Sheet",
    title: "Water Reticulation PA Rubric",
    source: "Question Bank",
    status: "Verified",
  },
];

export default function GeneratorPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Document Generator
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Jana Dokumen Akhir SKP
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Menjana output akhir seperti modul PDF/Word, assessment paper,
            answer scheme, rubric sheet, verification report dan export package.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Total Output", "3"],
            ["Module Files", "1"],
            ["Assessment Files", "1"],
            ["Rubric Files", "1"],
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

        <section className="grid gap-4 md:grid-cols-3">
          {[
            "Generate Module",
            "Generate Assessment",
            "Generate Report",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-dashed border-slate-300 bg-white p-6"
            >
              <h2 className="font-bold text-slate-900">{item}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sistem akan menjana dokumen berdasarkan data yang telah
                diluluskan dalam workflow pembangunan SKP.
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Senarai Output
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {outputs.map((item) => (
              <div
                key={item.title}
                className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_1.8fr_1.2fr_140px]"
              >
                <div className="font-bold text-blue-600">{item.type}</div>

                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.source}</p>
                </div>

                <div className="text-sm text-slate-600">{item.source}</div>

                <div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}