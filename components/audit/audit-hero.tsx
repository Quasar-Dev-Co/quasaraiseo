import { Activity, FileSearch, Gauge, Route, Sparkles } from "lucide-react"

import { stats } from "./audit-data"

const statIcons = [FileSearch, Activity, Gauge]

export function AuditHero() {
  return (
    <section className="mb-8.5">
      <div className="grid grid-cols-1 items-end gap-14 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500" />
            QuasarAISEO Audit Studio
          </div>
          <h1 className="mt-5 max-w-[800px] text-[clamp(46px,6vw,78px)] font-black leading-[0.98] tracking-[-0.062em]">
            Create a full SEO audit report from{" "}
            <em className="not-italic bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
              one website URL.
            </em>
          </h1>
          <p className="mt-5.5 max-w-[700px] text-lg leading-[1.75] text-slate-600">
            Crawl technical performance, uncover keyword gaps, evaluate content quality, and turn
            every finding into a clear, prioritized growth plan.
          </p>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white/78 p-6 shadow-[0_14px_42px_rgba(15,23,42,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-[13px] uppercase tracking-[0.12em] text-slate-500">Audit workspace</strong>
            <span className="flex items-center gap-1.75 rounded-full bg-emerald-50 px-2.5 py-1.75 text-[11px] font-bold text-emerald-700">
              <i className="size-1.75 rounded-full bg-emerald-500" /> System ready
            </span>
          </div>
          <code className="mt-4.5 flex items-center gap-2.5 rounded-[14px] border border-slate-200 bg-slate-50 px-3.75 py-3.5 text-[13px]">
            <Route className="size-[15px]" /> /create_audit_report
          </code>
          <p className="mt-3.75 text-[13px] leading-relaxed text-slate-500">
            Ready for your audit endpoint, job status updates, report storage, and downloads.
          </p>
        </aside>
      </div>

      <div className="mt-8.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat, i) => {
          const Icon = statIcons[i]
          return (
            <article
              key={stat.label}
              className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)]"
            >
              <div className="flex items-center justify-between">
                <small className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</small>
                <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700">
                  <Icon className="size-[18px]" />
                </span>
              </div>
              <strong className="mt-3.75 block text-[32px] tracking-[-0.05em]">{stat.value}</strong>
              <p className="mt-3 text-xs text-slate-500">{stat.note}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
