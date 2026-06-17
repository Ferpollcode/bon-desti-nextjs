const foundations = [
  "Next.js App Router",
  "Supabase Auth",
  "Postgres con RLS",
  "Roles por perfil",
  "Panel web responsive",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-300">
              Bon Desti Access
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Base Next.js para el sistema en la nube
            </h1>
          </div>
          <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
            Fase 2
          </span>
        </header>

        <div className="grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Usuarios reales, datos compartidos y permisos desde Supabase.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Este proyecto queda preparado para migrar la app actual hacia una
              arquitectura robusta: autenticacion real, base centralizada,
              paneles por rol y despliegue web profesional.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/30">
            <h3 className="text-lg font-semibold">Base creada</h3>
            <div className="mt-5 grid gap-3">
              {foundations.map((item) => (
                <div
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-slate-100"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="border-t border-white/10 pt-5 text-sm text-slate-400">
          Configure las variables de Supabase en <code>.env.local</code> para
          iniciar la integracion.
        </footer>
      </section>
    </main>
  );
}
