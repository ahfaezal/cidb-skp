import { AppShell } from "@/components/layouts/AppShell";

const verificationItems = [
  {
    level: "Level 1",
    title: "Bridge Works Mapping Verification",
    scope: "Transformation CMCS kepada deraf kandungan bidang/tred",
    panel: "Panel Group A",
    status: "Under Review",
  },
  {
    level: "Level 1",
    title: "Plumbing Mapping Verification",
    scope: "Semakan tajuk, topik dan subtopik modul",
    panel: "Panel Group B",
    status: "Amendment Required",
  },
  {
    level: "Level 2",
    title: "Water Reticulation Module Verification",
    scope: "Semakan modul lengkap, gambar, carta, jadual dan lampiran",
    panel: "Panel Group C",
    status: "Verified",
  },
];

export default function VerificationPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Verification Workflow
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Pengesahan Panel SKP
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Verification berlaku dalam dua peringkat: Level 1 untuk pengesahan
            transformation CMCS kepada deraf kandungan, dan Level 2 untuk
            pengesahan modul lengkap termasuk visual, jadual dan lampiran.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Total Review", "3"],
            ["Level 1", "2"],
            ["Level 2", "1"],
            ["Verified", "1"],
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
              Senarai Verification
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {verificationItems.map((item) => (
              <div
                key={item.title}
                className="grid gap-4 px-6 py-5 md:grid-cols-[110px_1.5fr_1.6fr_140px_160px]"
              >
                <div className="font-bold text-blue-600">{item.level}</div>

                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.panel}
                  </p>
                </div>

                <div className="text-sm text-slate-600">{item.scope}</div>

                <div className="text-sm font-medium text-slate-600">
                  {item.panel}
                </div>

                <div>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
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