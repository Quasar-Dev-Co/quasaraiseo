"use client"

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
  FileSearch,
  Users,
  Link2,
  Bot,
  Code2,
  Target,
  Zap,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"

import type { AuditJobRecord } from "@/lib/api"
import type { AuditPhase } from "@/hooks/use-audit-job"
import { generateAuditPDF } from "@/lib/pdf-generator"
import { parseRichReport, type RichReport, type Finding } from "@/lib/report-types"

type ShowToast = (message: string) => void

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

const severityConfig: Record<string, { label: string; cls: string; dot: string }> = {
  critical: { label: "Critical", cls: "bg-red-50 text-red-600 dark:bg-red-400/15 dark:text-red-400", dot: "bg-red-500" },
  high: { label: "High", cls: "bg-orange-50 text-orange-600 dark:bg-orange-400/15 dark:text-orange-400", dot: "bg-orange-500" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400", dot: "bg-amber-400" },
  pass: { label: "Passed", cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400", dot: "bg-emerald-500" },
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = severityConfig[severity] ?? severityConfig.medium
  return (
    <b className={`inline-flex items-center gap-1.5 rounded-full px-2.25 py-1.5 text-[10px] font-bold ${cfg.cls}`}>
      <i className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </b>
  )
}

const statusConfig: Record<string, string> = {
  good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400",
  critical: "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-400",
}

function StatusPill({ status }: { status: string }) {
  const cls = statusConfig[status] ?? statusConfig.warning
  return <b className={`rounded-full px-2.25 py-1.5 text-[10px] font-bold capitalize ${cls}`}>{status}</b>
}

function FindingsList({ findings }: { findings: Finding[] }) {
  if (!findings || findings.length === 0) return null
  return (
    <div className="px-5 pb-5 pt-3.5">
      {findings.map((f, i) => {
        const cfg = severityConfig[f.severity] ?? severityConfig.medium
        return (
          <div key={i} className="grid grid-cols-1 gap-3 border-b border-slate-100 py-4 last:border-0 md:grid-cols-[auto_1fr_auto] dark:border-white/5">
            <div className="flex items-start gap-2.75 md:w-[280px]">
              <i className={`mt-1.25 size-2.25 shrink-0 rounded-full ${cfg.dot}`} />
              <div>
                <strong className="block text-[13px] text-slate-900 dark:text-white">{f.title}</strong>
                <SeverityBadge severity={f.severity} />
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{f.detail}</p>
            <div className="md:max-w-[200px]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Action</p>
              <p className="text-[12px] leading-relaxed text-emerald-700 dark:text-emerald-400">{f.action}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MetricsGrid({ metrics }: { metrics: { label: string; value: string; status: string }[] }) {
  if (!metrics || metrics.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-3 p-5.5 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-[14px] border border-slate-100 bg-gradient-to-b from-white to-[#fbfdff] p-3.5 dark:border-white/10 dark:from-slate-800 dark:to-slate-900">
          <small className="block text-[10px] font-bold uppercase text-slate-400">{m.label}</small>
          <strong className="mt-2 block text-lg text-slate-900 dark:text-white">{m.value}</strong>
          <div className="mt-2"><StatusPill status={m.status} /></div>
        </div>
      ))}
    </div>
  )
}

interface ReportPreviewProps {
  showToast: ShowToast
  audit: AuditJobRecord | null
  phase: AuditPhase
}

export function ReportPreview({ showToast, audit, phase }: ReportPreviewProps) {
  const hasRealData = audit?.status === "completed" && audit.report
  const isRunning = phase === "polling" || phase === "submitting"
  const reportHost = audit?.websiteHost ?? "—"
  const report = audit?.report
  const richReport: RichReport | null = report ? parseRichReport(report.reportJson) : null

  const realScores: [string, number, string, string][] | null = report
    ? [
        ["Overall score", report.overallScore, getGrade(report.overallScore), "overall"],
        ["Technical", report.technicalScore, getGrade(report.technicalScore), getScoreStyle(report.technicalScore)],
        ["Content", report.contentScore, getGrade(report.contentScore), getScoreStyle(report.contentScore)],
        ["Authority", report.authorityScore, getGrade(report.authorityScore), getScoreStyle(report.authorityScore)],
        ["UX", report.uxScore, getGrade(report.uxScore), getScoreStyle(report.uxScore)],
      ]
    : null

  const activeKeywords = hasRealData && audit?.keywordRankings ? audit.keywordRankings : []

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
    }
  }

  const downloadPdf = async () => {
    if (hasRealData && audit) {
      try {
        await generateAuditPDF(audit)
        showToast("Premium PDF report downloaded.")
      } catch {
        showToast("Failed to generate PDF. Try the JSON export instead.")
      }
    }
  }

  if (!hasRealData && !isRunning && !audit) {
    return (
      <section id="report-preview" className="mt-18">
        <div className="mb-6 flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
              <BarChart3 className="size-[15px]" /> Report preview
            </div>
            <h2 className="mt-3.5 max-w-[760px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
              Your audit report will appear here.
            </h2>
            <p className="mt-3.25 max-w-[700px] text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
              Run an audit above to see scores, issues, keyword opportunities, and a prioritized action plan.
            </p>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white/80 p-12 text-center shadow-[0_28px_80px_rgba(15,23,42,0.11)] dark:border-white/10 dark:bg-slate-900/60">
          <span className="mx-auto grid size-20 place-items-center rounded-[22px] bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
            <FileSearch className="size-9" />
          </span>
          <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">No audit data yet</h3>
          <p className="mx-auto mt-2 max-w-[420px] text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Fill in the form above and click <strong className="text-slate-700 dark:text-slate-300">Run audit</strong> to generate your first SEO report.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="report-preview" className="mt-18">
      <div className="mb-6 flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
            <BarChart3 className="size-[15px]" /> Report preview
          </div>
          <h2 className="mt-3.5 max-w-[760px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
            A premium audit your clients can understand.
          </h2>
          <p className="mt-3.25 max-w-[700px] text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
            Show decision-makers the score, the problems, the opportunities, and what should be
            fixed first.
          </p>
        </div>
        <span className={`flex items-center gap-2 rounded-full border px-3 py-2.25 text-xs font-bold ${
          hasRealData
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400"
            : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400"
        }`}>
          {isRunning ? (
            <><Loader2 className="size-[15px] animate-spin" /> Pipeline running...</>
          ) : hasRealData ? (
            <><CircleCheckBig className="size-[15px]" /> Live audit data</>
          ) : (
            <><Eye className="size-[15px]" /> Waiting for data...</>
          )}
        </span>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white/80 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.11)] dark:border-white/10 dark:bg-slate-900/60">
        {/* Print-only professional header */}
        <div className="hidden print:block mb-8 border-b-2 border-emerald-500 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">QuasarAISEO</h1>
              <p className="text-xs font-semibold text-slate-500">Professional SEO Audit Report</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-700">Audit Date</p>
              <p className="text-xs text-slate-500">{audit?.completedAt ? new Date(audit.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4.5 px-1.25 pt-2.25 pb-5.25">
          <div className="flex items-center gap-3">
            <span className="grid size-10.5 place-items-center rounded-[14px] bg-gradient-to-br from-slate-950 to-slate-700 text-white">
              <FileBarChart2 className="size-[19px]" />
            </span>
            <div>
              <strong className="block text-sm text-slate-900 dark:text-white">SEO Audit Report — {reportHost}</strong>
              <small className="block text-xs text-slate-500 dark:text-slate-400">Generated by QuasarAISEO Audit Studio</small>
            </div>
          </div>
          {isRunning ? (
            <span className="flex items-center gap-1.75 rounded-full bg-amber-50 px-2.5 py-2 text-[11px] font-bold text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
              <Loader2 className="size-[15px] animate-spin" /> {audit?.status ?? "starting"}...
            </span>
          ) : audit?.status === "failed" ? (
            <span className="flex items-center gap-1.75 rounded-full bg-red-50 px-2.5 py-2 text-[11px] font-bold text-red-600 dark:bg-red-400/15 dark:text-red-400">
              <TriangleAlert className="size-[15px]" /> Audit failed
            </span>
          ) : (
            <span className="flex items-center gap-1.75 rounded-full bg-emerald-50 px-2.5 py-2 text-[11px] font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400">
              <CircleCheckBig className="size-[15px]" /> Audit complete
            </span>
          )}
        </div>

        {/* Score dashboard */}
        {hasRealData && realScores ? (
        <ReportCard icon={GaugeCircle} title="Score dashboard" subtitle="Five core SEO performance categories">
          <div className="grid grid-cols-1 gap-3.5 p-5.5 sm:grid-cols-3 lg:grid-cols-[1.1fr_repeat(4,1fr)]">
            {realScores.map(([label, score, grade, style]) => {
              const s = scoreStyles[style]
              const isOverall = style === "overall"
              return (
                <div
                  key={label}
                  className={`rounded-[18px] border p-4.5 ${
                    isOverall
                      ? "border-transparent bg-gradient-to-br from-slate-900 to-slate-950 text-white"
                      : "border-slate-100 bg-gradient-to-b from-white to-[#fbfdff] dark:border-white/10 dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900"
                  }`}
                >
                  <small className={`block text-[10px] font-bold uppercase ${isOverall ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
                    {label}
                  </small>
                  <strong className={`mt-5 block text-[42px] tracking-[-0.06em] ${isOverall ? "" : "text-slate-900 dark:text-white"}`}>
                    {score}
                    <span className="text-[15px] text-slate-400">/100</span>
                  </strong>
                  <em className={`mt-2 block text-xs not-italic font-bold ${s.grade}`}>{grade}</em>
                  <div className={`mt-6 h-2 overflow-hidden rounded-full ${isOverall ? "bg-slate-100" : "bg-slate-100 dark:bg-slate-800"}`}>
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </ReportCard>
        ) : null}

        {/* Technical SEO */}
        {hasRealData && richReport?.technicalSeo ? (
        <ReportCard icon={TriangleAlert} title="Technical SEO" subtitle="Core technical health metrics and findings">
          <MetricsGrid metrics={richReport.technicalSeo.metrics} />
          <FindingsList findings={richReport.technicalSeo.findings} />
        </ReportCard>
        ) : null}

        {/* Content & E-E-A-T */}
        {hasRealData && richReport?.contentEeat ? (
        <ReportCard icon={ShieldCheck} title="Content & E-E-A-T" subtitle="Experience, Expertise, Authoritativeness, Trustworthiness analysis">
          <div className="px-5 pb-5 pt-3.5">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">E-E-A-T Matrix</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr>
                    {["Factor", "Score", "Signals Present", "Gaps"].map((th) => (
                      <th key={th} className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {richReport.contentEeat.eeatMatrix.map((row) => (
                    <tr key={row.factor}>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-slate-900 dark:border-white/5 dark:text-white">{row.factor}</td>
                      <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                        <span className={`text-lg font-black ${row.score >= 70 ? "text-emerald-600 dark:text-emerald-400" : row.score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{row.score}</span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-600 dark:border-white/5 dark:text-slate-400">{row.signals}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-600 dark:border-white/5 dark:text-slate-400">{row.gaps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <FindingsList findings={richReport.contentEeat.findings} />
        </ReportCard>
        ) : null}

        {/* On-Page & Keyword Strategy */}
        {hasRealData && richReport?.onPageKeywords ? (
        <ReportCard icon={Target} title="On-Page & Keyword Strategy" subtitle="Current keyword performance and target opportunities">
          <FindingsList findings={richReport.onPageKeywords.findings} />
          {richReport.onPageKeywords.targetKeywords.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr>
                    {["Target Keyword", "Search Volume", "Difficulty", "Priority"].map((th) => (
                      <th key={th} className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {richReport.onPageKeywords.targetKeywords.map((kw, i) => (
                    <tr key={i}>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-slate-900 dark:border-white/5 dark:text-white">{kw.keyword}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">{kw.searchVolume.toLocaleString()}</td>
                      <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                        <b className={`rounded-full px-2.25 py-1.5 text-[10px] font-bold capitalize ${
                          kw.difficulty === "low" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
                          : kw.difficulty === "medium" ? "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400"
                          : "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-400"
                        }`}>{kw.difficulty}</b>
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                        <b className={`rounded-full px-2.25 py-1.5 text-[10px] font-bold capitalize ${
                          kw.priority === "high" ? "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-400"
                          : kw.priority === "quick win" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>{kw.priority}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>
        ) : null}

        {/* Backlink Profile */}
        {hasRealData && richReport?.backlinkProfile ? (
        <ReportCard icon={Link2} title="Backlink Profile" subtitle="Link authority, quality, and building strategy">
          <MetricsGrid metrics={richReport.backlinkProfile.metrics} />
          {richReport.backlinkProfile.topReferringDomains.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr>
                    {["Domain", "Links", "Spam Score", "Assessment"].map((th) => (
                      <th key={th} className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {richReport.backlinkProfile.topReferringDomains.map((d, i) => (
                    <tr key={i}>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-slate-900 dark:border-white/5 dark:text-white">{d.domain}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">{d.links}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">{d.spamScore}%</td>
                      <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                        <b className={`rounded-full px-2.25 py-1.5 text-[10px] font-bold capitalize ${
                          d.assessment === "healthy" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
                          : d.assessment === "suspicious" ? "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400"
                          : "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-400"
                        }`}>{d.assessment}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <FindingsList findings={richReport.backlinkProfile.findings} />
          {richReport.backlinkProfile.strategy && (
            <div className="px-5 pb-5 pt-2">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Strategy</p>
              <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">{richReport.backlinkProfile.strategy}</p>
            </div>
          )}
        </ReportCard>
        ) : null}

        {/* AI Visibility */}
        {hasRealData && richReport?.aiVisibility ? (
        <ReportCard icon={Bot} title="AI Visibility & GEO" subtitle="Generative engine optimization and AI crawler access">
          <div className="px-5 pb-5 pt-3.5">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">AI Crawler Access</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr>
                    {["Crawler", "Owner", "Purpose", "Status"].map((th) => (
                      <th key={th} className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {richReport.aiVisibility.aiCrawlerAccess.map((c, i) => (
                    <tr key={i}>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-slate-900 dark:border-white/5 dark:text-white">{c.crawler}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">{c.owner}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">{c.purpose}</td>
                      <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                        <b className={`rounded-full px-2.25 py-1.5 text-[10px] font-bold ${
                          c.status === "Allowed" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
                          : c.status === "Blocked" ? "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>{c.status}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <FindingsList findings={richReport.aiVisibility.findings} />
        </ReportCard>
        ) : null}

        {/* Schema & Structured Data */}
        {hasRealData && richReport?.schemaStructuredData ? (
        <ReportCard icon={Code2} title="Schema & Structured Data" subtitle="Structured data implementation and recommendations">
          <FindingsList findings={richReport.schemaStructuredData.findings} />
          {richReport.schemaStructuredData.recommendedSchemas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr>
                    {["Schema Type", "Page", "Priority", "Impact"].map((th) => (
                      <th key={th} className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {richReport.schemaStructuredData.recommendedSchemas.map((s, i) => (
                    <tr key={i}>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-slate-900 dark:border-white/5 dark:text-white">{s.type}</td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">{s.page}</td>
                      <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                        <b className={`rounded-full px-2.25 py-1.5 text-[10px] font-bold capitalize ${
                          s.priority === "high" ? "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-400"
                          : s.priority === "medium" ? "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>{s.priority}</b>
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-600 dark:border-white/5 dark:text-slate-400">{s.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>
        ) : null}

        {/* Score Breakdown */}
        {hasRealData && richReport?.scoreBreakdown && richReport.scoreBreakdown.length > 0 ? (
        <ReportCard icon={BarChart3} title="Score Breakdown" subtitle="Weighted contribution of each category to the overall score">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr>
                  {["Category", "Weight", "Score", "Status"].map((th) => (
                    <th key={th} className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {richReport.scoreBreakdown.map((row) => (
                  <tr key={row.category}>
                    <td className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-slate-900 dark:border-white/5 dark:text-white">{row.category}</td>
                    <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">{row.weight}</td>
                    <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${row.score >= 70 ? "text-emerald-600 dark:text-emerald-400" : row.score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{row.score}</span>
                        <i className="h-1.25 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <b className="block h-full rounded-full bg-emerald-400" style={{ width: `${row.score}%` }} />
                        </i>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                      <b className={`rounded-full px-2.25 py-1.5 text-[10px] font-bold ${
                        row.status === "Good" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
                        : row.status === "Needs Work" ? "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400"
                        : "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-400"
                      }`}>{row.status}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportCard>
        ) : null}

        {/* Keyword opportunities */}
        {hasRealData ? (
        <ReportCard icon={SearchCode} title="Keyword opportunities" subtitle="Search terms with ranking and revenue potential">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  {["Keyword", "Search volume", "CPC", "Competition", "Position"].map((th) => (
                    <th
                      key={th}
                      className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400"
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeKeywords.length > 0 ? (
                  activeKeywords.map((kw) => (
                    <tr key={kw.id}>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">
                        <strong>{kw.keyword}</strong>
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">
                        {kw.searchVolume.toLocaleString()}
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">
                        {kw.cpc ? `$${kw.cpc.toFixed(2)}` : "—"}
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                        <span className="flex items-center gap-1.75 text-xs text-slate-700 dark:text-slate-300">
                          {kw.competition ?? "—"}
                          {kw.competition != null && (
                            <i className="h-1.25 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <b
                                className="block h-full rounded-full bg-amber-400"
                                style={{ width: `${kw.competition}%` }}
                              />
                            </i>
                          )}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 text-xs font-bold text-emerald-600 dark:border-white/5 dark:text-emerald-400">
                        {kw.position ?? "Not ranked"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      No keyword data available for this audit.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
        ) : null}

        {/* Phased Action Plan */}
        {hasRealData && richReport?.actionPlan ? (
        <ReportCard icon={ListChecks} title="Prioritized Action Plan" subtitle="Multi-phase implementation roadmap">
          <div className="px-5 pb-5 pt-3.5">
            {(["phase1", "phase2", "phase3", "phase4"] as const).map((phaseKey, pIdx) => {
              const phase = richReport.actionPlan![phaseKey]
              if (!phase) return null
              const phaseColors = [
                "border-l-red-500",
                "border-l-orange-500",
                "border-l-amber-400",
                "border-l-emerald-500",
              ]
              return (
                <div key={phaseKey} className={`mb-5 border-l-4 ${phaseColors[pIdx]} pl-5 last:mb-0`}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className={`grid size-8 place-items-center rounded-[10px] text-xs font-black ${
                      pIdx === 0 ? "bg-red-50 text-red-600 dark:bg-red-400/15 dark:text-red-400"
                      : pIdx === 1 ? "bg-orange-50 text-orange-600 dark:bg-orange-400/15 dark:text-orange-400"
                      : pIdx === 2 ? "bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
                    }`}>{pIdx + 1}</span>
                    <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-white">{phase.title}</h4>
                  </div>
                  {phase.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-1 items-center gap-3 border-b border-slate-50 py-3 last:border-0 md:grid-cols-[1fr_auto] dark:border-white/5">
                      <p className="m-0 text-[13px] text-slate-700 dark:text-slate-300">{item.action}</p>
                      <b className="w-max rounded-full bg-slate-100 px-2.25 py-1.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">{item.impact}</b>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </ReportCard>
        ) : hasRealData && report?.recommendations ? (
        <ReportCard icon={ListChecks} title="Prioritized action plan" subtitle="Clear next steps ordered by expected impact">
          <div className="px-5 pb-5 pt-2">
            {report.recommendations.split("\n").filter((line) => line.trim()).map((line, index) => {
              const match = line.match(/^\d+\.\s*(.+)/)
              const text = match ? match[1] : line
              return (
                <div
                  key={index}
                  className="grid grid-cols-1 items-center gap-3.75 border-b border-slate-100 py-3.75 last:border-0 md:grid-cols-[48px_1fr_auto] dark:border-white/5"
                >
                  <span
                    className={`grid size-10.5 place-items-center rounded-[14px] text-[13px] font-black ${
                      index === 0 ? "bg-emerald-100 dark:bg-emerald-400/15 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong className="text-[13px] text-slate-900 dark:text-white">{text}</strong>
                  </div>
                  <aside className="flex gap-1.75">
                    <b className="rounded-full bg-emerald-50 px-2.25 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400">
                      {index < 2 ? "High impact" : "Medium impact"}
                    </b>
                  </aside>
                </div>
              )
            })}
          </div>
        </ReportCard>
        ) : null}

        {/* Quick Wins */}
        {hasRealData && richReport?.quickWins && richReport.quickWins.length > 0 ? (
        <ReportCard icon={Zap} title="Quick Wins" subtitle="Fast, high-impact fixes you can implement today">
          <div className="px-5 pb-5 pt-3.5">
            {richReport.quickWins.map((qw, i) => (
              <div key={i} className="grid grid-cols-1 items-center gap-3 border-b border-slate-100 py-3.5 last:border-0 md:grid-cols-[1fr_auto_auto] dark:border-white/5">
                <div className="flex items-start gap-2.75">
                  <Zap className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <p className="m-0 text-[13px] text-slate-700 dark:text-slate-300">{qw.action}</p>
                </div>
                <b className="w-max rounded-full bg-amber-50 px-2.25 py-1.5 text-[10px] font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">{qw.timeEstimate}</b>
                <b className="w-max rounded-full bg-emerald-50 px-2.25 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400">{qw.impact}</b>
              </div>
            ))}
          </div>
        </ReportCard>
        ) : null}

        {/* SERP competitors */}
        {hasRealData && audit?.serpCompetitors && audit.serpCompetitors.length > 0 ? (
        <ReportCard icon={Users} title="SERP competitors" subtitle="Top-ranking domains competing for the same keywords">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr>
                  {["Domain", "Visibility", "Est. traffic", "Keywords", "Relevance"].map((th) => (
                    <th
                      key={th}
                      className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400"
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audit.serpCompetitors.map((comp) => (
                  <tr key={comp.id}>
                    <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">
                      <strong>{comp.domain}</strong>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">
                      {comp.visibility != null ? `${comp.visibility}/100` : "—"}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">
                      {comp.estimatedTraffic ?? "—"}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">
                      {comp.keywordsCount != null ? comp.keywordsCount.toLocaleString() : "—"}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                      <span className="flex items-center gap-1.75 text-xs text-slate-700 dark:text-slate-300">
                        {comp.relevance != null ? comp.relevance : "—"}
                        {comp.relevance != null && (
                          <i className="h-1.25 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <b
                              className="block h-full rounded-full bg-emerald-400"
                              style={{ width: `${comp.relevance}%` }}
                            />
                          </i>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportCard>
        ) : null}

        {/* Executive summary */}
        {hasRealData && report && (
          <ReportCard icon={FileBarChart2} title="Executive summary" subtitle="AI-generated overview of the audit findings">
            <div className="px-6 py-5 space-y-3.5">
              {(richReport?.executiveSummary ?? report.summary)
                .replace(/\r/g, "")
                .split(/\n\s*\n+/)
                .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
                .filter(Boolean)
                .map((paragraph, idx) => (
                  <p key={idx} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {paragraph}
                  </p>
                ))}
            </div>
          </ReportCard>
        )}

        {/* Projected Outcomes */}
        {hasRealData && richReport?.projectedOutcomes ? (
        <ReportCard icon={TrendingUp} title="Projected Outcomes" subtitle="Expected results if recommendations are implemented">
          <div className="px-6 py-5">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{richReport.projectedOutcomes}</p>
          </div>
        </ReportCard>
        ) : null}

        {/* Download card */}
        {hasRealData && (
          <>
          <div className="mt-4.5 flex flex-col items-start justify-between gap-7 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-7 text-white lg:flex-row lg:items-center">
            <div>
              <h3 className="m-0 text-[22px]">Your audit report is ready for export.</h3>
              <p className="mt-1.75 max-w-[620px] text-[13px] text-slate-400">
                Download a premium, presentation-ready PDF report or the structured JSON data.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={downloadPdf}
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

          {/* Print-only footer */}
          <div className="hidden print:block mt-8 border-t border-slate-200 pt-4 text-center">
            <p className="text-[10px] text-slate-400">
              Generated by QuasarAISEO Audit Studio — {audit?.websiteHost} — {audit?.completedAt ? new Date(audit.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>
          </>
        )}
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
    <article className="mt-4.5 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
        <div className="flex gap-2.75">
          <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
            <Icon className="size-[18px]" />
          </span>
          <div>
            <h3 className="m-0 text-base text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
      </header>
      {children}
    </article>
  )
}
