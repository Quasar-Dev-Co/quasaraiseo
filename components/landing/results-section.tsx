import { BarChart3 } from "lucide-react"

const darkMetrics = [
  { label: "Technical health", value: 88 },
  { label: "Content coverage", value: 76 },
  { label: "AI citations", value: 69 },
  { label: "Entity authority", value: 63 },
]

const lightMetrics = [
  { label: "Service pages", width: 76, value: 42 },
  { label: "Location pages", width: 64, value: 36 },
  { label: "Comparisons", width: 48, value: 27 },
  { label: "Guides", width: 38, value: 21 },
]

export function ResultsSection() {
  return (
    <section id="results" className="px-4 py-26">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          <BarChart3 className="size-3.5" /> Measurable growth
        </div>
        <h2 className="mt-3.5 max-w-[850px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em]">
          See what is improving, what is missing, and where to act next.
        </h2>
        <p className="mt-6 max-w-[720px] text-lg leading-[1.75] text-slate-600">
          Every report connects visibility metrics to practical actions, so teams know exactly what
          should be fixed, created, optimized, or monitored.
        </p>

        <div className="mt-8.5 grid grid-cols-1 gap-5.5 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Dark card */}
          <article className="rounded-3xl border border-slate-400/13 bg-gradient-to-br from-slate-900 to-slate-950 p-7 text-white">
            <small className="text-xs text-slate-400">Search visibility growth</small>
            <strong className="mt-6.5 block text-[54px] font-black tracking-[-0.06em]">
              +38<span className="text-base text-slate-400">%</span>
            </strong>
            <p className="mt-1.5 mb-5.5 text-xs text-slate-400">Combined organic and AI discovery score</p>
            {darkMetrics.map((m) => (
              <div key={m.label} className="mt-3 grid grid-cols-[120px_1fr_40px] items-center gap-2.5 text-[10px] text-slate-500">
                <span>{m.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-400/11">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    style={{ width: `${m.value}%` }}
                  />
                </div>
                <b className="text-right text-slate-200">{m.value}</b>
              </div>
            ))}
          </article>

          {/* Light card */}
          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_14px_42px_rgba(15,23,42,0.07)]">
            <small className="text-xs text-slate-500">New ranking opportunities</small>
            <strong className="mt-6.5 block text-[54px] font-black tracking-[-0.06em]">126</strong>
            <p className="mt-1.5 mb-5.5 text-xs text-slate-500">31 high-intent opportunities prioritized for launch</p>
            {lightMetrics.map((m) => (
              <div key={m.label} className="mt-3 grid grid-cols-[120px_1fr_40px] items-center gap-2.5 text-[10px] text-slate-500">
                <span>{m.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    style={{ width: `${m.width}%` }}
                  />
                </div>
                <b className="text-right text-slate-800">{m.value}</b>
              </div>
            ))}
          </article>
        </div>
      </div>
    </section>
  )
}
