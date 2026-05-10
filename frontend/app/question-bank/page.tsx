import { AppShell } from "@/components/layouts/AppShell";

const questions = [
  {
    id: "QB001",
    type: "KS",
    title: "Bridge Works Safety Procedure",
    module: "Bridge Works Management",
    level: "Medium",
    status: "Approved",
  },
  {
    id: "QB002",
    type: "KS",
    title: "Tendering Documentation Requirement",
    module: "Tendering Management",
    level: "Low",
    status: "Under Review",
  },
  {
    id: "QB003",
    type: "PA",
    title: "Plumbing Defect Case Study",
    module: "Plumbing System Planning",
    level: "Scenario",
    status: "Rubric Verified",
  },
];

export default function QuestionBankPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Question Bank
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Central Question Repository
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Pangkalan soalan berpusat untuk menyimpan semua soalan KS dan PA
            yang telah dibangunkan, disemak dan diluluskan.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Total Questions", "3"],
            ["KS Items", "2"],
            ["PA Items", "1"],
            ["Approved", "1"],
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
              Senarai Soalan
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {questions.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 px-6 py-5 md:grid-cols-[100px_80px_1.6fr_1.4fr_120px_150px]"
              >
                <div className="font-bold text-blue-600">{item.id}</div>
                <div className="font-semibold text-slate-700">{item.type}</div>

                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.module}</p>
                </div>

                <div className="text-sm text-slate-600">{item.module}</div>

                <div className="text-sm text-slate-600">{item.level}</div>

                <div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
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