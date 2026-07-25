import { Activity, Bot, Boxes, Map, Search, Sparkles, X } from "lucide-react"

import { platformVisibility } from "./data"

const problems = [
  {
    title: "Important pages stay invisible.",
    text: "Technical issues and weak structure stop search engines from understanding value.",
  },
  {
    title: "AI engines do not cite the brand.",
    text: "Missing entities, schema, authority, and clear answers reduce discoverability.",
  },
  {
    title: "Content production does not scale.",
    text: "Teams lose time creating pages manually without a connected topic strategy.",
  },
]

export function ProblemSection() {
  return (
    <section className="px-4 py-26">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-13.5 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">
            <Activity className="size-3.5" /> The visibility problem
          </div>
          <h2 className="mt-3.5 max-w-[850px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em]">
            Search is no longer just ten blue links.
          </h2>
          <p className="mt-6 max-w-[720px] text-lg leading-[1.75] text-slate-600">
            Buyers now discover brands through search engines, AI answer boxes, assistants,
            comparison pages, directories, and generated recommendations.
          </p>

          <div className="mt-7 grid gap-3.25">
            {problems.map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-[11px] bg-rose-50 text-rose-600">
                  <X className="size-3.5" />
                </span>
                <p className="text-sm leading-relaxed text-slate-600">
                  <strong className="text-slate-900">{item.title}</strong>
                  <br />
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Visibility panel */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_28px_80px_rgba(15,23,42,0.11)]">
          <div className="flex items-center justify-between gap-3.5">
            <div>
              <h3 className="m-0 text-lg">Multi-platform visibility</h3>
              <p className="mt-1 text-xs text-slate-500">Discoverability across modern search surfaces</p>
            </div>
            <div className="min-w-[88px] rounded-[14px] bg-fuchsia-50 px-2.75 py-2.75 text-center text-fuchsia-700">
              <strong className="block text-2xl">74</strong>
              <span className="text-[9px] uppercase font-bold">Overall</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {platformVisibility.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="grid grid-cols-[150px_1fr_45px] items-center gap-3.5 rounded-[14px] border border-slate-100 bg-slate-50 px-3.5 py-3.25"
              >
                <div className="flex items-center gap-2.25 text-xs font-bold">
                  <span className="grid size-7.5 place-items-center rounded-[10px] border border-slate-200 bg-white">
                    <Icon className="size-3.5 text-fuchsia-600" />
                  </span>
                  {label}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <strong className="text-right text-sm">{value}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
