"use client"

import { Activity, FileSearch, Gauge } from "lucide-react"
import type { AuditJobRecord } from "@/lib/api"

interface AuditHeroProps {
  audits?: AuditJobRecord[]
}

export function AuditHero({ audits = [] }: AuditHeroProps) {
  const completedAudits = audits.filter(a => a.status === "completed")
  const totalPages = completedAudits.reduce((sum, a) => sum + (a.crawledPages?.length ?? 0), 0)
  const avgScore = completedAudits.length > 0
    ? Math.round(completedAudits.reduce((sum, a) => sum + (a.report?.overallScore ?? 0), 0) / completedAudits.length)
    : 0

  const stats = [
    { label: "Audits generated", value: completedAudits.length.toString(), note: completedAudits.length > 0 ? "Across all projects" : "Run your first audit below" },
    { label: "Pages analyzed", value: totalPages > 0 ? totalPages.toLocaleString() : "0", note: totalPages > 0 ? "Live crawl coverage" : "Start by entering a URL" },
    { label: "Average score", value: avgScore > 0 ? avgScore.toString() : "—", note: avgScore > 0 ? "Across completed audits" : "No audits yet" },
  ]

  const statIcons = [FileSearch, Activity, Gauge]

  return (
    <section className="mb-8.5">
      <div className="mt-8.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat, i) => {
          const Icon = statIcons[i]
          return (
            <article
              key={stat.label}
              className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60"
            >
              <div className="flex items-center justify-between">
                <small className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{stat.label}</small>
                <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
                  <Icon className="size-[18px]" />
                </span>
              </div>
              <strong className="mt-3.75 block text-[32px] tracking-[-0.05em] text-slate-900 dark:text-white">{stat.value}</strong>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{stat.note}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
