"use client";

import { ArrowRight, Bot, CheckCircle2, FileSearch, Globe, Layers3, Search, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

const auditChecks = [
  "Technical crawlability and indexing",
  "Core Web Vitals and page speed",
  "On-page SEO and content depth",
  "Keyword gaps and ranking opportunities",
  "Competitor and SERP positioning",
  "Backlink and authority signals",
];

const workflowSteps = [
  {
    title: "Drop the domain",
    description: "Enter any website URL and choose market, language, and niche focus for the audit run.",
    icon: Globe,
  },
  {
    title: "Crawl and enrich",
    description: "The system maps every page, collects metadata, and combines it with SERP and performance data.",
    icon: Search,
  },
  {
    title: "Generate the report",
    description: "A structured audit is produced with scores, issue clusters, opportunities, and next-step actions.",
    icon: FileSearch,
  },
];

const statCards = [
  { label: "Indexed Pages", value: "248", note: "15 orphan-risk URLs detected" },
  { label: "Technical Health", value: "88/100", note: "Strong crawl path, speed needs work" },
  { label: "Untapped Keywords", value: "126", note: "High-intent opportunities in reach" },
];

export default function CreateAuditReportPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_24%),linear-gradient(180deg,_#f7f4ec_0%,_#eef7f4_48%,_#ffffff_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(13,148,136,0.08),transparent_36%,rgba(245,158,11,0.08))]" />

          <div className="relative flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  <Sparkles className="size-3.5" />
                  QuasarAISEO Audit Studio
                </div>
                <div className="space-y-4">
                  <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                    Create a full SEO audit report from one website URL.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                    Turn a single domain into a structured audit with crawl insights, page-speed diagnostics,
                    keyword intelligence, SERP gaps, and ready-to-present findings.
                  </p>
                </div>
              </div>

              <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
                {statCards.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-slate-200/70 bg-white/90 p-4 shadow-sm"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_64px_rgba(15,23,42,0.22)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-300/90">
                      Start a new audit
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                      Route: <span className="text-amber-300">/create_audit_report</span>
                    </h2>
                  </div>
                  <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-3 sm:block">
                    <Bot className="size-8 text-emerald-300" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-200">Website URL</span>
                    <input
                      className="h-12 w-full rounded-2xl border border-white/12 bg-white/6 px-4 text-sm text-white outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-400"
                      placeholder="https://example.com"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-200">Business niche</span>
                    <input
                      className="h-12 w-full rounded-2xl border border-white/12 bg-white/6 px-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-emerald-400"
                      placeholder="SEO agency, clinic, SaaS, coach..."
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-200">Target country</span>
                    <select className="h-12 w-full rounded-2xl border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-emerald-400">
                      <option>United States</option>
                      <option>Netherlands</option>
                      <option>United Kingdom</option>
                      <option>Bangladesh</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-200">Primary language</span>
                    <select className="h-12 w-full rounded-2xl border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-emerald-400">
                      <option>English</option>
                      <option>Dutch</option>
                      <option>French</option>
                      <option>Bengali</option>
                    </select>
                  </label>
                </div>

                <label className="mt-4 block space-y-2">
                  <span className="text-sm font-medium text-slate-200">Audit focus</span>
                  <textarea
                    className="min-h-32 w-full rounded-[1.5rem] border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-emerald-400"
                    placeholder="Add target services, target keywords, cities, competitors, or any notes for the AI report engine."
                  />
                </label>

                <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-200">Full crawl</span>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-200">Keyword gap</span>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-200">PDF output</span>
                  </div>
                  <Button className="h-12 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                    Create audit report
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                      <Layers3 className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                        Audit coverage
                      </h3>
                      <p className="text-sm leading-6 text-slate-600">
                        The first version should feel premium and data-heavy from the moment the user lands here.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {auditChecks.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3"
                      >
                        <CheckCircle2 className="size-5 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-950 p-3 text-amber-300">
                      <Zap className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                        Workflow preview
                      </h3>
                      <p className="text-sm leading-6 text-slate-600">
                        Show users how one input becomes a polished audit report.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {workflowSteps.map((step, index) => {
                      const Icon = step.icon;

                      return (
                        <div key={step.title} className="flex gap-4 rounded-[1.5rem] bg-white/80 p-4">
                          <div className="flex flex-col items-center">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                              <Icon className="size-5" />
                            </div>
                            {index < workflowSteps.length - 1 ? (
                              <div className="mt-2 h-full w-px bg-gradient-to-b from-slate-300 to-transparent" />
                            ) : null}
                          </div>
                          <div className="pb-1">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Step {index + 1}
                            </p>
                            <h4 className="mt-1 text-lg font-semibold text-slate-950">{step.title}</h4>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
