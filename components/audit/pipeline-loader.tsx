"use client"

import { useEffect, useState } from "react"
import {
  Bot,
  Check,
  CircleCheckBig,
  FileSearch,
  Gauge,
  Globe2,
  Loader2,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react"

import type { AuditJobRecord, AuditStatus } from "@/lib/api"
import type { AuditPhase } from "@/hooks/use-audit-job"

interface PipelineLoaderProps {
  phase: AuditPhase
  audit: AuditJobRecord | null
  error: string | null
}

interface StageInfo {
  status: AuditStatus
  label: string
  description: string
  icon: typeof Globe2
}

const STAGES: StageInfo[] = [
  {
    status: "queued",
    label: "Queued",
    description: "Audit job created and waiting to start...",
    icon: Bot,
  },
  {
    status: "crawling",
    label: "Crawling website",
    description: "Scanning pages, metadata, links, and technical signals...",
    icon: Globe2,
  },
  {
    status: "enriching",
    label: "Enriching data",
    description: "Fetching keywords, competitors, and SERP intelligence...",
    icon: Search,
  },
  {
    status: "analyzing",
    label: "Analyzing performance",
    description: "Scoring technical, content, authority, and UX factors...",
    icon: Gauge,
  },
  {
    status: "reporting",
    label: "Generating report",
    description: "AI is writing findings, actions, and structured output...",
    icon: FileSearch,
  },
]

function getStageIndex(status: AuditStatus): number {
  if (status === "completed") return STAGES.length
  if (status === "failed") return -1
  return STAGES.findIndex((s) => s.status === status)
}

export function PipelineLoader({ phase, audit, error }: PipelineLoaderProps) {
  const [elapsed, setElapsed] = useState(0)
  const [visible, setVisible] = useState(false)

  const isBusy = phase === "submitting" || phase === "polling"
  const isError = phase === "error" && error
  const isComplete = phase === "completed"
  const currentStage = audit ? getStageIndex(audit.status) : -1
  const progress = isComplete ? 100 : Math.round(((currentStage + 1) / STAGES.length) * 100)

  useEffect(() => {
    if (isBusy) {
      setVisible(true)
      setElapsed(0)
      const interval = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isBusy])

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isComplete])

  if (!visible && !isError) return null

  const activeStage = STAGES[currentStage]
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-[min(520px,calc(100%-32px))] overflow-hidden rounded-[28px] border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
        {/* Glow background */}
        <div className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-60 rounded-full bg-pink-500/10 blur-3xl" />

        {/* Close button (only on error) */}
        {isError && (
          <button
            onClick={() => setVisible(false)}
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-slate-800/60 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Header */}
        <div className="relative flex items-center gap-3">
          <div className={`grid size-12 place-items-center rounded-[16px] ${
            isError
              ? "bg-red-500/15 text-red-400"
              : isComplete
                ? "bg-fuchsia-500/15 text-fuchsia-400"
                : "bg-fuchsia-500/10 text-fuchsia-300"
          }`}>
            {isError ? (
              <TriangleAlert className="size-6" />
            ) : isComplete ? (
              <CircleCheckBig className="size-6" />
            ) : (
              <div className="relative">
                <Bot className="size-6" />
                <span className="absolute -inset-1 animate-ping rounded-full bg-fuchsia-400/20" />
              </div>
            )}
          </div>
          <div>
            <h3 className="m-0 text-lg font-bold text-white">
              {isError ? "Audit failed" : isComplete ? "Audit complete!" : "Running audit pipeline"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {isError ? "Something went wrong during processing" : isComplete ? "Your report is ready below" : `Elapsed: ${formatTime(elapsed)}`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {!isError && (
          <div className="relative mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {isComplete ? "Complete" : activeStage?.label ?? "Starting..."}
              </span>
              <span className="text-[11px] font-bold text-fuchsia-300">{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Current stage description */}
        {!isError && !isComplete && activeStage && (
          <div className="relative mt-5 flex items-start gap-3 rounded-[16px] border border-fuchsia-400/15 bg-fuchsia-500/5 p-4">
            <div className="relative mt-0.5 shrink-0">
              <activeStage.icon className="size-5 text-fuchsia-300" />
              <span className="absolute -inset-1 animate-ping rounded-full bg-fuchsia-400/20" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fuchsia-200">{activeStage.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{activeStage.description}</p>
            </div>
          </div>
        )}

        {/* Stage list */}
        {!isError && (
          <div className="relative mt-5 space-y-1">
            {STAGES.map((stage, i) => {
              const done = currentStage > i || isComplete
              const active = currentStage === i && !isComplete
              const Icon = stage.icon
              return (
                <div
                  key={stage.status}
                  className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-all duration-300 ${
                    active
                      ? "bg-fuchsia-500/8"
                      : done
                        ? "bg-slate-800/30"
                        : "bg-transparent"
                  }`}
                >
                  <span className={`grid size-8 shrink-0 place-items-center rounded-[10px] transition-colors ${
                    done
                      ? "bg-fuchsia-500/15 text-fuchsia-400"
                      : active
                        ? "bg-fuchsia-500/10 text-fuchsia-300"
                        : "bg-slate-800/60 text-slate-600"
                  }`}>
                    {done ? (
                      <Check className="size-4" />
                    ) : active ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  <span className={`text-sm font-semibold transition-colors ${
                    done
                      ? "text-slate-300"
                      : active
                        ? "text-fuchsia-200"
                        : "text-slate-600"
                  }`}>
                    {stage.label}
                  </span>
                  {done && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-fuchsia-500/60">
                      Done
                    </span>
                  )}
                  {active && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-400">
                      <span className="flex gap-0.5">
                        <span className="size-1 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:0ms]" />
                        <span className="size-1 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:150ms]" />
                        <span className="size-1 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:300ms]" />
                      </span>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Error display */}
        {isError && (
          <div className="relative mt-5 rounded-[16px] border border-red-400/20 bg-red-500/5 p-4">
            <p className="text-sm leading-relaxed text-red-300">{error}</p>
            <p className="mt-3 text-xs text-slate-500">
              Check that the backend is running on port 8080 and the database is connected.
            </p>
          </div>
        )}

        {/* Footer */}
        {!isError && !isComplete && (
          <div className="relative mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="size-3 text-fuchsia-400/60" />
            QuasarAISEO is processing your audit. This usually takes 1–3 minutes.
          </div>
        )}
        {isComplete && (
          <div className="relative mt-6 flex items-center justify-center gap-2 text-[11px] text-fuchsia-400">
            <CircleCheckBig className="size-3.5" />
            Scrolling to your report...
          </div>
        )}
      </div>
    </div>
  )
}
