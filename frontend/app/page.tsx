export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-10 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            SKP-CIDB Builder
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Competency-Based Module & Assessment Development Platform
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Sistem pembangunan Modul SKP CIDB berasaskan CMCS, merangkumi
            transformation, verification, module development, assessment
            development, question bank dan AI visual assistance.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900">CMCS Mapping</h2>
              <p className="mt-2 text-sm text-slate-500">
                Transformasi CMCS kepada deraf kandungan bidang/tred.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900">Module Builder</h2>
              <p className="mt-2 text-sm text-slate-500">
                Pembangunan modul lengkap bersama gambar, rajah dan jadual.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900">
                Assessment Builder
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                KS objektif dan PA case study bersama rubrik pemarkahan.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}