"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, CreditCard, MessageCircle } from "lucide-react"

import type { Billing } from "./data"

type ShowToast = (message: string) => void

export function PricingSection({ showToast }: { showToast: ShowToast }) {
  const [billing, setBilling] = useState<Billing>("monthly")

  const prices = useMemo(
    () => ({
      starter: billing === "monthly" ? 49 : 39,
      growth: billing === "monthly" ? 149 : 119,
    }),
    [billing],
  )

  return (
    <section id="pricing" className="border-y border-slate-200 bg-slate-50 px-4 py-26">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              <CreditCard className="size-3.5" /> Simple pricing
            </div>
            <h2 className="mt-3.5 max-w-[850px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em]">
              Start with an audit. Scale into a complete growth engine.
            </h2>
          </div>
          <div className="flex rounded-full border border-slate-200 bg-white p-1.25">
            <button
              onClick={() => setBilling("monthly")}
              className={`min-w-[92px] rounded-full py-2 text-[11px] font-bold transition-colors ${
                billing === "monthly" ? "bg-slate-950 text-white" : "text-slate-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`min-w-[92px] rounded-full py-2 text-[11px] font-bold transition-colors ${
                billing === "yearly" ? "bg-slate-950 text-white" : "text-slate-500"
              }`}
            >
              Yearly -20%
            </button>
          </div>
        </div>

        <div className="mt-8.5 grid grid-cols-1 gap-4.5 lg:grid-cols-3">
          {/* Starter */}
          <article className="rounded-3xl border border-slate-200 bg-white p-6.75 shadow-[0_14px_42px_rgba(15,23,42,0.07)]">
            <small className="text-[11px] uppercase tracking-[0.15em] text-slate-500">Starter</small>
            <h3 className="mt-2.25 text-2xl">Audit</h3>
            <p className="mt-2 min-h-12 text-xs leading-relaxed text-slate-500">
              For businesses that need clear SEO and AI visibility direction.
            </p>
            <strong className="mt-5.5 block text-5xl font-black tracking-[-0.06em]">
              ${prices.starter}
              <span className="text-[11px] text-slate-500">/month</span>
            </strong>
            <Link
              href="/audit-mcp"
              className="mt-5.5 flex w-full items-center justify-center rounded-[13px] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-transform hover:-translate-y-px"
            >
              Start auditing
            </Link>
            <ul className="mt-6 grid gap-2.75 border-t border-slate-200 pt-5.75">
              {["5 website audits per month", "SEO and AI visibility scores", "Keyword opportunity reports", "PDF and JSON exports"].map((item) => (
                <li key={item} className="flex gap-2.25 text-[11px] text-slate-600">
                  <Check className="size-3.5 text-blue-600" /> {item}
                </li>
              ))}
            </ul>
          </article>

          {/* Growth - featured High Contrast Card */}
          <article className="relative overflow-hidden rounded-3xl border-2 border-blue-500/60 bg-slate-950 p-7.5 text-white shadow-[0_25px_60px_rgba(217,70,239,0.22)] transition-all duration-300 lg:-translate-y-2">
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-blue-600/25 blur-3xl" />
            
            <em className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_4px_15px_rgba(217,70,239,0.4)] not-italic">
              Most popular
            </em>
            <small className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Growth</small>
            <h3 className="mt-1.5 text-2xl font-black text-white">Automation</h3>
            <p className="mt-2 min-h-11 text-xs font-semibold leading-relaxed text-slate-300">
              For agencies and growing companies that need scalable content and visibility.
            </p>
            
            <div className="mt-5 flex items-baseline gap-1.5">
              <strong className="text-5xl font-black tracking-tight text-white">
                ${prices.growth}
              </strong>
              <span className="text-xs font-bold text-slate-400">/month</span>
            </div>

            <Link
              href="/audit-mcp"
              className="mt-6 flex w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(217,70,239,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_16px_35px_rgba(217,70,239,0.5)]"
            >
              Start growing
            </Link>

            <ul className="mt-6 space-y-3 border-t border-white/10 pt-5">
              {["Everything in Audit", "25 projects and recurring audits", "Programmatic page generation", "AI citation tracking", "White-label reports"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-xs font-bold text-slate-100">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-500/20 text-blue-400">
                    <Check className="size-3 text-blue-400" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* Enterprise */}
          <article className="rounded-3xl border border-slate-200 bg-white p-6.75 shadow-[0_14px_42px_rgba(15,23,42,0.07)]">
            <small className="text-[11px] uppercase tracking-[0.15em] text-slate-500">Enterprise</small>
            <h3 className="mt-2.25 text-2xl">Scale</h3>
            <p className="mt-2 min-h-12 text-xs leading-relaxed text-slate-500">
              For multi-brand, multi-country, and high-volume operations.
            </p>
            <strong className="mt-5.5 block text-5xl font-black tracking-[-0.06em]">Custom</strong>
            <button
              onClick={() => showToast("Connect this button to Calendly, your CRM, or a sales form.")}
              className="mt-5.5 flex w-full items-center justify-center gap-2 rounded-[13px] bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(2,6,23,0.18)] transition-transform hover:-translate-y-px"
            >
              Contact sales <MessageCircle className="size-3.5" />
            </button>
            <ul className="mt-6 grid gap-2.75 border-t border-slate-200 pt-5.75">
              {["Unlimited project architecture", "Custom automation workflows", "API and data integrations", "Team roles and governance"].map((item) => (
                <li key={item} className="flex gap-2.25 text-[11px] text-slate-600">
                  <Check className="size-3.5 text-blue-600" /> {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
