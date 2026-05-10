import { AppShell } from "@/components/layouts/AppShell";

const visualItems = [
  {
    type: "Technical Diagram",
    title: "Bridge Inspection Flow",
    module: "Bridge Works Management",
    output: "Rajah proses kerja",
    status: "Generated",
  },
  {
    type: "Infographic",
    title: "PPE Requirement for Plumbing Work",
    module: "Plumbing System Planning",
    output: "Poster keselamatan",
    status: "Draft",
  },
  {
    type: "Table",
    title: "Water Reticulation Inspection Checklist",
    module: "Water Reticulation Supervision",
    output: "Jadual pemeriksaan",
    status: "Ready",
  },
];

export default function VisualAIPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            AI Visual Content Engine
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Jana Gambar, Rajah, Carta, Jadual & Infografik
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            AI membantu menghasilkan bahan visual untuk modul SKP seperti gambar
            teknikal, rajah proses kerja, flowchart, graf, jadual, checklist dan
            infographic latihan.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Visual Assets", "3"],
            ["Diagrams", "1"],
            ["Infographics", "1"],
            ["Tables", "1"],
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
            "Generate Technical Diagram",
            "Generate Flowchart",
            "Generate Infographic",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-6"
            >
              <h2 className="font-bold text-slate-900">{item}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AI akan mencadangkan visual berdasarkan topik modul, CMCS dan
                kandungan pembelajaran.
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Senarai Visual Content
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {visualItems.map((item) => (
              <div
                key={item.title}
                className="grid gap-4 px-6 py-5 md:grid-cols-[1.2fr_1.6fr_1.4fr_1fr_140px]"
              >
                <div className="font-bold text-blue-600">{item.type}</div>

                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.module}</p>
                </div>

                <div className="text-sm text-slate-600">{item.module}</div>

                <div className="text-sm text-slate-600">{item.output}</div>

                <div>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
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