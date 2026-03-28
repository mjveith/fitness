export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-6 sm:max-w-lg">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Fitness Planner</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50">Gym-ready planning</h1>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Mode</p>
          <p className="mt-1 text-sm font-medium text-slate-100">Dark / Mobile</p>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
