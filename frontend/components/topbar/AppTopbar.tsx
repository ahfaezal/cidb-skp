export function AppTopbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Competency-Based Module & Assessment Development Platform
          </p>
          <h2 className="text-xl font-bold text-slate-900">
            SKP-CIDB Builder
          </h2>
        </div>

        <div className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
          Development Mode
        </div>
      </div>
    </header>
  );
}