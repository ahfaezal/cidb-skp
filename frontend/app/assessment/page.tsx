import { AppShell } from "@/components/layouts/AppShell";

const assessments = [
  {
    type: "KS",
    title: "Bridge Works Knowledge Assessment",
    format: "Objective Questions",
    difficulty: "Low / Medium / High",
    competency: "Fakta, Prosedur, Sikap/Keselamatan",
    status: "Draft",
  },
  {
    type: "PA",
    title: "Plumbing Case Study Assessment",
    format: "Subjective Case Study",
    difficulty: "Scenario-Based",
    competency: "Prosedur & Keselamatan",
    status: "Rubric Required",
  },
  {
    type: "KS",
    title: "Water Reticulation Technical Knowledge",
    format: "MCQ",
    difficulty: "Medium",
    competency: "Fakta/Teori",
    status: "Under Review",
  },
];

export default function AssessmentPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Assessment Builder
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Pembangunan Soalan SKP
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Pembangunan assessment merangkumi Knowledge Assessment (KS) berbentuk
            objektif dan Performance Assessment (PA) berbentuk case study
            berserta rubrik pemarkahan.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Total Assessment", "3"],
            ["KS", "2"],
            ["PA", "1"],
            ["Rubric Pending", "1"],
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

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Knowledge Assessment (KS)
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Soalan objektif dengan aras kesukaran rendah, sederhana dan tinggi.
              Keterampilan merangkumi fakta/teori, prosedur serta
              sikap/keselamatan/persekitaran.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Performance Assessment (PA)
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Soalan subjektif berbentuk case study yang memerlukan jawapan
              analitikal dan dinilai menggunakan rubrik pemarkahan.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Senarai Assessment
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {assessments.map((item) => (
              <div
                key={item.title}
                className="grid gap-4 px-6 py-5 md:grid-cols-[80px_1.6fr_1fr_1fr_1.4fr_140px]"
              >
                <div className="font-bold text-blue-600">{item.type}</div>

                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.format}</p>
                </div>

                <div className="text-sm text-slate-600">{item.format}</div>

                <div className="text-sm text-slate-600">{item.difficulty}</div>

                <div className="text-sm text-slate-600">{item.competency}</div>

                <div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
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