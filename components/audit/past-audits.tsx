"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Clock, CheckCircle2, Loader2, AlertTriangle, FileSearch, Globe, Trash2, Eye,
} from "lucide-react"
import { api, type AuditJobRecord, type AuditStatus } from "@/lib/api"

interface PastAuditsProps {
  refreshKey: number
  onSelectAudit?: (audit: AuditJobRecord) => void
}

const statusConfig: Record<AuditStatus, { label: string; icon: typeof Clock; color: string }> = {
  queued: { label: "Queued", icon: Clock, color: "text-slate-500" },
  crawling: { label: "Crawling", icon: Loader2, color: "text-blue-500" },
  enriching: { label: "Enriching", icon: Loader2, color: "text-blue-500" },
  analyzing: { label: "Analyzing", icon: Loader2, color: "text-amber-500" },
  reporting: { label: "Reporting", icon: Loader2, color: "text-amber-500" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-500" },
  failed: { label: "Failed", icon: AlertTriangle, color: "text-red-500" },
}

export function PastAudits({ refreshKey, onSelectAudit }: PastAuditsProps) {
  const [audits, setAudits] = useState<AuditJobRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadAudits = useCallback(() => {
    setLoading(true)
    api.listAudits()
      .then((res) => {
        setAudits(res.items)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load audits")
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadAudits()
  }, [refreshKey, loadAudits])

  const handleDelete = async (e: React.MouseEvent, auditId: string) => {
    e.stopPropagation()
    setDeletingId(auditId)
    try {
      await api.deleteAudit(auditId)
      setAudits((prev) => prev.filter((a) => a.id !== auditId))
      if (selectedId === auditId) setSelectedId(null)
    } catch {
      // ignore — user can retry
    } finally {
      setDeletingId(null)
    }
  }

  const handleRowClick = (audit: AuditJobRecord) => {
    if (audit.status !== "completed") return
    setSelectedId(audit.id)
    onSelectAudit?.(audit)
  }

  if (loading) {
    return (
      <section className="mt-12">
        <div className="flex items-center gap-2.5 mb-5">
          <FileSearch className="size-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Past audits</h2>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white/80 p-8 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/60">
          <Loader2 className="size-4 animate-spin" /> Loading your audit history...
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-12">
        <div className="flex items-center gap-2.5 mb-5">
          <FileSearch className="size-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Past audits</h2>
        </div>
        <div className="rounded-[18px] border border-slate-200 bg-white/80 p-8 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/60">
          No audits found. Run your first audit above.
        </div>
      </section>
    )
  }

  if (audits.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2.5 mb-5">
        <FileSearch className="size-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Past audits</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {audits.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-900/60">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Website", "Market", "Status", "Score", "Date", ""].map((th, i) => (
                <th
                  key={i}
                  className="border-b border-slate-200 bg-slate-50 px-5 py-3.25 text-left text-[10px] uppercase text-slate-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400"
                >
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {audits.map((audit) => {
              const cfg = statusConfig[audit.status]
              const Icon = cfg.icon
              const score = audit.report?.overallScore
              const isCompleted = audit.status === "completed"
              const isSelected = selectedId === audit.id
              const isDeleting = deletingId === audit.id
              return (
                <tr
                  key={audit.id}
                  onClick={() => handleRowClick(audit)}
                  className={`transition-colors ${
                    isCompleted ? "cursor-pointer" : "cursor-default"
                  } ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-400/10"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
                        <Globe className="size-4" />
                      </span>
                      <div>
                        <strong className="block text-xs text-slate-900 dark:text-white">{audit.websiteHost}</strong>
                        <small className="block text-[10px] text-slate-500 dark:text-slate-400">{audit.url}</small>
                      </div>
                      {isCompleted && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Eye className="size-3" /> View
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-700 dark:border-white/5 dark:text-slate-300">
                    {audit.market}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                    <span className={`flex items-center gap-1.75 text-xs font-semibold ${cfg.color}`}>
                      <Icon className={`size-3.5 ${audit.status === "crawling" || audit.status === "enriching" || audit.status === "analyzing" || audit.status === "reporting" ? "animate-spin" : ""}`} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                    {score != null ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{score}/100</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
                    {new Date(audit.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-right dark:border-white/5">
                    <button
                      onClick={(e) => handleDelete(e, audit.id)}
                      disabled={isDeleting}
                      title="Delete audit"
                      className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-400/10"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

