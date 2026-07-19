"use client"

import { useMemo, useState } from "react"
import {
  BarChart3,
  Braces,
  CircleCheckBig,
  Eye,
  FileBarChart2,
  FileDown,
  GaugeCircle,
  Loader2,
  ListChecks,
  SearchCode,
  TriangleAlert,
} from "lucide-react"

import type { AuditJobRecord } from "@/lib/api"
import type { AuditPhase } from "@/hooks/use-audit-job"
import {
  actions,
  issueData,
  keywordRows,
  scoreCards,
  type Severity,
} from "./audit-data"

type ShowToast = (message: string) => void

const severityStyles: Record<Severity, { dot: string; badge: string }> = {
  critical: { dot: "bg-red-500", badge: "bg-red-50 text-red-600" },
  warning: { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-600" },
  info: { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-600" },
}

const scoreStyles: Record<string, { bar: string; grade: string }> = {
  "": { bar: "bg-emerald-500", grade: "text-emerald-600" },
  overall: { bar: "bg-emerald-500", grade: "text-emerald-300" },
  yellow: { bar: "bg-amber-400", grade: "text-amber-600" },
  orange: { bar: "bg-orange-500", grade: "text-orange-600" },
}

function getGrade(score: number): string {
  if (score >= 85) return "Excellent"
  if (score >= 70) return "Good"
  if (score >= 55) return "Moderate"
  return "Needs work"
}

function getScoreStyle(score: number): string {
  if (score >= 85) return ""
  if (score >= 70) return "yellow"
  return "orange"
}

interface ReportPreviewProps {
  showToast: ShowToast
  audit: AuditJobRecord | null
  phase: AuditPhase
}

export function ReportPreview({ showToast, audit, phase }: ReportPreviewProps) {
  const [severity, setSeverity] = useState<Severity>("critical")
  const selectedIssues = useMemo(() => issueData[severity], [severity])

  const hasRealData = audit?.status === "completed" && audit.report
  const isRunning = phase === "polling" || phase === "submitting"
  const reportHost = audit?.websiteHost ?? "example.com"
  const report = audit?.report

  const realScores: [string, number, string, string][] | null = report
    ? [
        ["Overall score", report.overallScore, getGrade(report.overallScore), "overall"],
        ["Technical", report.technicalScore, getGrade(report.technicalScore), getScoreStyle(report.technicalScore)],
        ["Content", report.contentScore, getGrade(report.contentScore), getScoreStyle(report.contentScore)],
        ["Authority", report.authorityScore, getGrade(report.authorityScore), getScoreStyle(report.authorityScore)],
        ["UX", report.uxScore, getGrade(report.uxScore), getScoreStyle(report.uxScore)],
      ]
    : null

  const activeScores = hasRealData && realScores ? realScores : scoreCards
  const activeKeywords = hasRealData && audit?.keywordRankings ? audit.keywordRankings : null

  const downloadJson = () => {
    if (hasRealData && audit) {
      const data = {
        report: {
          website: audit.websiteUrl,
          status: audit.status,
          generatedBy: "QuasarAISEO",
          generatedAt: audit.completedAt ?? new Date().toISOString(),
        },
        scores: report
          ? { overall: report.overallScore, technical: report.technicalScore, content: report.contentScore, authority: report.authorityScore, ux: report.uxScore }
          : null,
        summary: report?.summary,
        recommendations: report?.recommendations,
        keywords: audit.keywordRankings ?? [],
        competitors: audit.serpCompetitors ?? [],
        crawledPages: audit.crawledPages ?? [],
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `quasar-audit-${audit.websiteHost}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      showToast("Audit report JSON downloaded.")
    } else {
      const data = {
        report: {
          website: "https://example.com",
          status: "sample",
          generatedBy: "QuasarAISEO",
          generatedAt: new Date().toISOString(),
        },
        scores: { overall: 78, technical: 86, content: 72, authority: 58, ux: 91 },
        issues: issueData,
        keywords: keywordRows,
        actions,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "quasar-ai-seo-audit-report-sample.json"
      anchor.click()
      URL.revokeObjectURL(url)
      showToast("Sample JSON audit report downloaded.")
    }
  }

  return (
    <section id="report-preview" className="mt-18">
      <div className="mb-6 flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            <BarChart3 className="size-[15px]" /> Report preview
          </div>
          <h2 className="mt-3.5 max-w-[760px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em]">
            A premium audit your clients can understand.
          </h2>
          <p className="mt-3.25 max-w-[700px] text-[15px] leading-relaxed text-slate-500">
            Show decision-makers the score, the problems, the opportunities, and what should be
            fixed first.
          </p>
        </div>
        <span className={`flex items-center gap-2 rounded-full border px-3 py-2.25 text-xs font-bold ${
          hasRealData
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-600"
        }`}>
          {isRunning ? (
            <><Loader2 className="size-[15px] animate-spin" /> Pipeline running...</>
          ) : hasRealData ? (
            <><CircleCheckBig className="size-[15px]" /> Live audit data</>
          ) : (
            <><Eye className="size-[15px]" /> Sample report data</>
          )}
        </span>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white/80 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.11)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4.5 px-1.25 pt-2.25 pb-5.25">
          <div className="flex items-center gap-3">
            <span className="grid size-10.5 place-items-center rounded-[14px] bg-gradient-to-br from-slate-950 to-slate-700 text-white">
              <FileBarChart2 className="size-[19px]" />
            </span>
            <div>
              <strong className="block text-sm">SEO Audit Report — {reportHost}</strong>
              <small className="block text-xs text-slate-500">Generated by QuasarAISEO Audit Studio</small>
            </div>
          </div>
          {isRunning ? (
            <span className="flex items-center gap-1.75 rounded-full bg-amber-50 px-2.5 py-2 text-[11px] font-bold text-amber-600">
              <Loader2 className="size-[15px] animate-spin" /> {audit?.status ?? "starting"}...
            </span>
          ) : audit?.status === "failed" ? (
            <span className="flex items-center gap-1.75 rounded-full bg-red-50 px-2.5 py-2 text-[11px] font-bold text-red-600">
              <TriangleAlert className="size-[15px]" /> Audit failed
            </span>
          ) : (
            <span className="flex items-center gap-1.75 rounded-full bg-emerald-50 px-2.5 py-2 text-[11px] font-bold text-emerald-700">
              <CircleCheckBig className="size-[15px]" /> {hasRealData ? "Audit complete" : "Sample data"}
            </span>
          )}
        </div>

        {/* Score dashboard */}
        <ReportCard icon={GaugeCircle} title="Score dashboard" subtitle="Five core SEO performance categories">
          <div className="grid grid-cols-1 gap-3.5 p-5.5 sm:grid-cols-3 lg:grid-cols-[1.1fr_repeat(4,1fr)]">
            {activeScores.map(([label, score, grade, style]) => {
              const s = scoreStyles[style]
              const isOverall = style === "overall"
              return (
                <div
                  key={label}
                  className={`rounded-[18px] border p-4.5 ${
                    isOverall
                      ? "border-transparent bg-gradient-to-br from-slate-900 to-slate-950 text-white"
                      : "border-slate-100 bg-gradient-to-b from-white to-[#fbfdff]"
                  }`}
                >
                  <small className={`block text-[10px] font-bold uppercase ${isOverall ? "text-slate-400" : "text-slate-500"}`}>
                    {label}
                  </small>
                  <strong className="mt-5 block text-[42px] tracking-[-0.06em]">
                    {score}
                    <span className="text-[15px] text-slate-400">/100</span>
                  </strong>
                  <em className={`mt-2 block text-xs not-italic font-bold ${s.grade}`}>{grade}</em>
                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </ReportCard>

        {/* Issues found */}
        <ReportCard icon={TriangleAlert} title="Issues found" subtitle="Grouped by severity and business impact">
          <div className="flex gap-2 px-5 pt-4">
            {(["critical", "warning", "info"] as Severity[]).map((item) => (
              <button
                key={item}
                onClick={() => setSeverity(item)}
                className={`flex items-center gap-1.75 rounded-[11px] border px-3 py-2.25 text-xs font-bold transition-all ${
                  severity === item
                    ? "border-slate-200 bg-white text-slate-900 shadow-[0_7px_16px_rgba(15,23,42,0.06)]"
                    : "border-transparent text-slate-500"
                }`}
              >
                {item[0].toUpperCase() + item.slice(1)}
                <span className="grid min-w-[22px] place-items-center rounded-full bg-slate-100 px-1.5 text-[10px]">
                  {issueData[item].length}
                </span>
              </button>
            ))}
          </div>

          <div className="px-5 pb-5 pt-3.5">
            {selectedIssues.map((issue) => {
              const s = severityStyles[severity]
              return (
                <div
                  key={issue.message}
                  className="grid grid-cols-1 items-center gap-4 border-b border-slate-100 py-3.5 last:border-0 md:grid-cols-[1.4fr_120px_100px]"
                >
                  <div className="flex gap-2.75">
                    <i className={`mt-1.25 size-2.25 shrink-0 rounded-full ${s.dot}`} />
                    <span>
                      <strong className="block text-[13px]">{issue.message}</strong>
                      <small className="mt-0.75 block text-[11px] text-slate-500">{issue.subtext}</small>
                    </span>
                  </div>
                  <em className="hidden w-max rounded-full bg-slate-100 px-2.25 py-1.5 text-[10px] not-italic text-slate-600 md:block">
                    {issue.category}
                  </em>
                  <b className={`w-max rounded-full px-2.25 py-1.5 text-[10px] font-bold capitalize ${s.badge}`}>
                    {severity}
                  </b>
                </div>
              )
            })}
          </div>
        </ReportCard>

        {/* Keyword opportunities */}
        <ReportCard icon={SearchCode} title="Keyword opportunities" subtitle="Search terms with ranking and revenue potential">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  {["Keyword", "Search volume", "CPC", "Competition", "Position"].map((th) => (
                    <th
                      key={th}
                      className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500"
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeKeywords ? (
                  activeKeywords.length > 0 ? (
                    activeKeywords.map((kw) => (
                      <tr key={kw.id}>
                        <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700">
                          <strong>{kw.keyword}</strong>
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700">
                          {kw.searchVolume.toLocaleString()}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700">
                          {kw.cpc ? `$${kw.cpc.toFixed(2)}` : "—"}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4">
                          <span className="flex items-center gap-1.75 text-xs text-slate-700">
                            {kw.competition ?? "—"}
                            {kw.competition != null && (
                              <i className="h-1.25 w-12 overflow-hidden rounded-full bg-slate-100">
                                <b
                                  className="block h-full rounded-full bg-amber-400"
                                  style={{ width: `${kw.competition}%` }}
                                />
                              </i>
                            )}
                          </span>
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-emerald-600">
                          {kw.position ?? "Not ranked"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">
                        No keyword data available for this audit.
                      </td>
                    </tr>
                  )
                ) : (
                  keywordRows.map(([keyword, volume, cpc, competition, position, high]) => (
                    <tr key={keyword}>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700">
                        <strong>{keyword}</strong>
                        {high && (
                          <em className="ml-1.75 rounded-full bg-emerald-50 px-2.25 py-1.5 text-[10px] not-italic text-emerald-700">
                            High value
                          </em>
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700">{volume}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700">{cpc}</td>
                      <td className="border-b border-slate-100 px-5 py-4">
                        <span className="flex items-center gap-1.75 text-xs text-slate-700">
                          {competition}
                          <i className="h-1.25 w-12 overflow-hidden rounded-full bg-slate-100">
                            <b
                              className="block h-full rounded-full bg-amber-400"
                              style={{ width: `${competition}%` }}
                            />
                          </i>
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-emerald-600">
                        {position}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>

        {/* Action plan */}
        <ReportCard icon={ListChecks} title="Prioritized action plan" subtitle="Clear next steps ordered by expected impact">
          <div className="px-5 pb-5 pt-2">
            {actions.map((item, index) => (
              <div
                key={item.title}
                className="grid grid-cols-1 items-center gap-3.75 border-b border-slate-100 py-3.75 last:border-0 md:grid-cols-[48px_1fr_auto]"
              >
                <span
                  className={`grid size-10.5 place-items-center rounded-[14px] text-[13px] font-black ${
                    index === 0 ? "bg-emerald-100" : "bg-slate-100"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong className="text-[13px]">{item.title}</strong>
                  <p className="mt-1 text-[11px] text-slate-500">{item.description}</p>
                </div>
                <aside className="flex gap-1.75">
                  <em className="rounded-full bg-slate-100 px-2.25 py-1.5 text-[10px] not-italic text-slate-600">
                    {item.timeline}
                  </em>
                  <b className="rounded-full bg-emerald-50 px-2.25 py-1.5 text-[10px] font-bold text-emerald-700">
                    {item.impact}
                  </b>
                </aside>
              </div>
            ))}
          </div>
        </ReportCard>

        {/* Summary card (real data only) */}
        {hasRealData && report && (
          <ReportCard icon={FileBarChart2} title="Executive summary" subtitle="AI-generated overview of the audit findings">
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-700">{report.summary}</p>
              {report.recommendations && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Key recommendations</p>
                  <p className="text-sm leading-relaxed text-slate-600">{report.recommendations}</p>
                </div>
              )}
            </div>
          </ReportCard>
        )}

        {/* Download card */}
        <div className="mt-4.5 flex flex-col items-start justify-between gap-7 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-7 text-white lg:flex-row lg:items-center">
          <div>
            <h3 className="m-0 text-[22px]">
              {hasRealData ? "Your audit report is ready for export." : "Sample report is ready for export."}
            </h3>
            <p className="mt-1.75 max-w-[620px] text-[13px] text-slate-400">
              {hasRealData
                ? "Download the structured JSON report or use browser print for PDF."
                : "Use browser print for PDF or download structured sample report data as JSON."}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => window.print()}
              className="flex h-11 items-center gap-2 rounded-[12px] bg-emerald-400 px-3.5 text-xs font-bold text-[#022c22]"
            >
              <FileDown className="size-[15px]" /> Download PDF
            </button>
            <button
              onClick={downloadJson}
              className="flex h-11 items-center gap-2 rounded-[12px] border border-slate-400/20 bg-slate-900/72 px-3.5 text-xs font-bold text-slate-200"
            >
              <Braces className="size-[15px]" /> Download JSON
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReportCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof GaugeCircle
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <article className="mt-4.5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5">
        <div className="flex gap-2.75">
          <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700">
            <Icon className="size-[18px]" />
          </span>
          <div>
            <h3 className="m-0 text-base">{title}</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
      </header>
      {children}
    </article>
  )
}
