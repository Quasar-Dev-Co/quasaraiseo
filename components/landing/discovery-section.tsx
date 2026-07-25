"use client"

import { useState } from "react"
import { CheckCircle2, Orbit, Search, Sparkles } from "lucide-react"

import { discoveryContent, type DiscoveryTab } from "./data"

export function DiscoverySection() {
  const [tab, setTab] = useState<DiscoveryTab>("google")
  const discovery = discoveryContent[tab]
  const DiscoveryIcon = discovery.icon

  return (
    <section className="border-y border-slate-200 bg-slate-50 px-4 py-26">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">
          <Sparkles className="size-3.5" /> AI discovery optimization
        </div>
        <h2 className="mt-3.5 max-w-[850px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em]">
          Build content that search engines and AI systems can understand.
        </h2>
        <p className="mt-6 max-w-[720px] text-lg leading-[1.75] text-slate-600">
          Optimize the same brand knowledge for traditional results, AI summaries, assistant
          answers, and entity-based discovery.
        </p>

        <div className="mt-8.5 rounded-[28px] border border-slate-200 bg-white p-2.5 sm:p-3.5 shadow-[0_28px_80px_rgba(15,23,42,0.11)]">
          {/* Tabs */}
          <div className="flex flex-col sm:flex-row gap-1.5 rounded-2xl bg-slate-100 p-1.5">
            {[
              { value: "google" as const, label: "Google Search" },
              { value: "overview" as const, label: "AI Overview" },
              { value: "assistants" as const, label: "AI Assistants" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex-1 rounded-xl border py-2.5 px-3 text-xs font-bold transition-all ${
                  tab === value
                    ? "border-slate-200 bg-white text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                    : "border-transparent text-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="grid grid-cols-1 items-center gap-8.5 px-3.5 sm:px-5.5 pb-5.5 pt-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="inline-flex items-center gap-1.75 rounded-full bg-fuchsia-50 px-2.75 py-2 text-[11px] font-bold text-fuchsia-700">
                <DiscoveryIcon className="size-3.5" /> {discovery.badge}
              </span>
              <h3 className="mt-4.5 text-[30px] tracking-[-0.04em]">{discovery.title}</h3>
              <p className="mt-3.5 text-sm leading-relaxed text-slate-500">{discovery.text}</p>
              <div className="mt-5 grid gap-2.5">
                {discovery.points.map((point) => (
                  <span key={point} className="flex items-center gap-2.25 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="size-3.5 text-fuchsia-600" /> {point}
                  </span>
                ))}
              </div>
            </div>

            {/* Answer preview */}
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2.25 rounded-[13px] border border-slate-200 bg-white px-3.5 py-3 text-[11px] text-slate-500">
                <Search className="size-3.5" /> {discovery.query}
              </div>
              <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-4.25">
                <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                  <Orbit className="size-3.5" /> QuasarAISEO
                </span>
                <h4 className="mt-3.5 text-[13px] leading-relaxed">{discovery.answer}</h4>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                  Build technically clear, structured, authoritative content that can be ranked,
                  summarized, and cited across discovery platforms.
                </p>
                <div className="mt-3.25 flex flex-wrap gap-1.75">
                  {["Audit platform", "Programmatic SEO", "Entity signals"].map((tag) => (
                    <i
                      key={tag}
                      className="rounded-full bg-slate-100 px-2 py-1.5 text-[8px] not-italic text-slate-600"
                    >
                      {tag}
                    </i>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
