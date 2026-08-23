"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, ChevronDown, CircleHelp } from "lucide-react"

import { faqs } from "./data"

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <section id="faq" className="px-4 py-26">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-start gap-13.5 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            <CircleHelp className="size-3.5" /> Frequently asked
          </div>
          <h2 className="mt-3.5 max-w-[850px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em]">
            Everything you need to know before starting.
          </h2>
          <p className="mt-6 max-w-[720px] text-lg leading-[1.75] text-slate-600">
            Use QuasarAISEO as a standalone audit platform or as the SEO intelligence layer inside a
            larger marketing workflow.
          </p>
          <Link
            href="/audit-mcp"
            className="mt-6 inline-flex min-h-13 items-center gap-2 rounded-[15px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(217,70,239,0.3)] transition-transform hover:-translate-y-px"
          >
            Create free audit <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-2.75">
          {faqs.map((item, index) => (
            <article
              key={item.q}
              className={`overflow-hidden rounded-2xl border bg-white transition-all ${
                openFaq === index ? "border-slate-300" : "border-slate-200"
              }`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 bg-white px-4.5 py-4.25 text-left text-[13px] font-bold"
              >
                {item.q}
                <ChevronDown
                  className={`size-4.5 shrink-0 transition-transform ${
                    openFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-200 ${
                  openFaq === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-4.5 pb-4.5 text-xs leading-relaxed text-slate-500">{item.a}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
