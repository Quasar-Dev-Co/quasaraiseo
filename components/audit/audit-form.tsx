"use client"

import { FormEvent, useState } from "react"
import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Globe2,
  Languages,
  MapPinned,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react"

import type { AuditJobRecord } from "@/lib/api"
import type { AuditPhase } from "@/hooks/use-audit-job"
import { auditModules, countries, languages } from "./audit-data"

type ShowToast = (message: string) => void

interface AuditFormProps {
  showToast: ShowToast
  phase: AuditPhase
  audit: AuditJobRecord | null
  error: string | null
  submitAudit: (payload: {
    url: string
    market: string
    language: string
    niche?: string
    notes?: string
  }) => Promise<void>
}

export function AuditForm({ showToast, phase, audit, error, submitAudit }: AuditFormProps) {
  const [features, setFeatures] = useState<string[]>(["full_crawl", "keyword_gap", "pdf_output"])

  const toggleFeature = (feature: string) => {
    setFeatures((current) =>
      current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    const url = String(form.get("websiteUrl") ?? "")
    const niche = String(form.get("businessNiche") ?? "")
    const market = String(form.get("targetCountry") ?? "")
    const language = String(form.get("primaryLanguage") ?? "")
    const notes = String(form.get("auditFocus") ?? "")

    await submitAudit({
      url,
      market,
      language,
      niche: niche || undefined,
      notes: notes || undefined,
    })

    showToast("Audit submitted. The pipeline is running on the backend.")
    document.getElementById("report-preview")?.scrollIntoView({ behavior: "smooth" })
  }

  const isBusy = phase === "submitting" || phase === "polling"

  return (
    <section className="grid grid-cols-1 items-start gap-5.5">
      {/* Audit form card */}
      <article
        id="audit-form"
        className="relative overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_88%_5%,rgba(217,70,239,0.22),transparent_26%),linear-gradient(145deg,#0b1220,#110a1f_40%,#020617)] p-10.5 text-white shadow-[0_32px_100px_rgba(2,6,23,0.35)] ring-1 ring-white/10"
      >
        <span className="absolute right-7.5 top-7.5 grid size-14 place-items-center rounded-[19px] border border-blue-300/18 bg-blue-500/10 text-blue-300">
          <Bot className="size-5.25" />
        </span>

        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.19em] text-blue-300">
          <Sparkles className="size-[15px]" /> Start a new audit
        </div>
        <h2 className="mt-2.75 max-w-[640px] text-[clamp(30px,4vw,48px)] font-black leading-[1.04] tracking-[-0.05em]">
          Build a complete, client-ready SEO intelligence report.
        </h2>
        <p className="mt-3.25 max-w-[650px] text-[15px] leading-relaxed text-slate-400">
          Add the website and market details below. QuasarAISEO will prepare the technical, content,
          authority, UX, and keyword analysis structure.
        </p>
        <code className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-400/16 bg-slate-900/58 px-2.75 py-2 text-xs text-slate-300">
          <TerminalSquare className="size-3.5" /> /create_audit_report
        </code>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label="Website URL"
              name="websiteUrl"
              placeholder="https://example.com"
              type="url"
              icon={Globe2}
              help="Enter the complete website URL, including https://"
            />
            <FormField
              label="Business niche"
              name="businessNiche"
              placeholder="e.g. SaaS, LegalTech, Local services"
              icon={BriefcaseBusiness}
              help="Used to compare the site with niche-specific competitors."
            />
            <SelectField
              label="Target country"
              name="targetCountry"
              icon={MapPinned}
              options={countries}
              placeholder="Select target market"
              help="Determines local SERP, language, and competition context."
            />
            <SelectField
              label="Primary language"
              name="primaryLanguage"
              icon={Languages}
              options={languages}
              placeholder="Select report language"
              help="Controls report writing and keyword interpretation."
            />

            <label className="sm:col-span-2">
              <span className="flex justify-between text-[13px] font-bold text-slate-200">
                Audit focus <em className="text-[11px] not-italic uppercase text-blue-300">Optional</em>
              </span>
              <textarea
                name="auditFocus"
                placeholder="Describe specific goals, priority services, target keywords, competitors, or pages that need extra attention..."
                className="mt-2.25 min-h-32 w-full resize-y rounded-[14px] border border-slate-400/16 bg-slate-900/72 px-4 py-3.75 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/65 focus:ring-4 focus:ring-blue-500/10"
              />
              <small className="mt-2 block text-[11px] leading-relaxed text-slate-500">
                Add any business context that should shape the recommendations.
              </small>
            </label>
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Audit modules</p>
          <div className="mt-2.75 flex flex-wrap gap-2.5">
            {auditModules.map(([value, label]) => {
              const active = features.includes(value)
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => toggleFeature(value)}
                  className={`flex min-h-9.5 items-center gap-2 rounded-full border px-3.25 text-xs font-bold transition-colors ${
                    active
                      ? "border-blue-400/32 bg-blue-500/15 text-blue-300"
                      : "border-slate-400/18 bg-slate-900/55 text-slate-400"
                  }`}
                >
                  {active ? <Check className="size-3.5" /> : <span>+</span>}
                  {label}
                </button>
              )
            })}
          </div>

          <div className="mt-7 flex flex-col items-start justify-between gap-4.5 border-t border-slate-400/13 pt-6 sm:flex-row sm:items-center">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="size-[15px]" /> Public website data only
            </span>
            <button
              type="submit"
              disabled={isBusy}
              className="flex min-h-13 min-w-[210px] items-center justify-center gap-2.5 rounded-[15px] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-sm font-bold text-white shadow-[0_14px_32px_rgba(217,70,239,0.3)] transition-transform hover:-translate-y-px disabled:opacity-70"
            >
              {isBusy ? "Processing..." : "Create audit report"}
              {!isBusy && <ArrowUpRight className="size-4.5" />}
            </button>
          </div>
        </form>
      </article>
    </section>
  )
}

function FormField({
  label,
  name,
  placeholder,
  type = "text",
  icon: Icon,
  help,
}: {
  label: string
  name: string
  placeholder: string
  type?: string
  icon: typeof Globe2
  help: string
}) {
  return (
    <label>
      <span className="flex justify-between text-[13px] font-bold text-slate-200">
        {label} <em className="text-[11px] not-italic uppercase text-blue-300">Required</em>
      </span>
      <div className="relative mt-2.25">
        <Icon className="absolute left-3.75 top-1/2 size-[18px] -translate-y-1/2 text-slate-500" />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required
          className="h-13 w-full rounded-[14px] border border-slate-400/16 bg-slate-900/72 px-11 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/65 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>
      <small className="mt-2 block text-[11px] leading-relaxed text-slate-500">{help}</small>
    </label>
  )
}

function SelectField({
  label,
  name,
  icon: Icon,
  options,
  placeholder,
  help,
}: {
  label: string
  name: string
  icon: typeof MapPinned
  options: string[]
  placeholder: string
  help: string
}) {
  return (
    <label>
      <span className="flex justify-between text-[13px] font-bold text-slate-200">
        {label} <em className="text-[11px] not-italic uppercase text-blue-300">Required</em>
      </span>
      <div className="relative mt-2.25">
        <Icon className="absolute left-3.75 top-1/2 size-[18px] -translate-y-1/2 text-slate-500" />
        <select
          name={name}
          required
          defaultValue=""
          className="h-13 w-full appearance-none rounded-[14px] border border-slate-400/16 bg-slate-900/72 px-11 text-sm text-white outline-none focus:border-blue-400/65 focus:ring-4 focus:ring-blue-500/10"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.75 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      </div>
      <small className="mt-2 block text-[11px] leading-relaxed text-slate-500">{help}</small>
    </label>
  )
}
