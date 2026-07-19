import { Boxes, Check } from "lucide-react"

import { features } from "./data"

export function PlatformSection() {
  return (
    <section
      id="platform"
      className="bg-[radial-gradient(circle_at_10%_0,rgba(16,185,129,0.16),transparent_30%),linear-gradient(145deg,#0b1220,#020617)] px-4 py-26 text-white"
    >
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="flex flex-col items-start justify-between gap-7.5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
              <Boxes className="size-3.5" /> One connected platform
            </div>
            <h2 className="mt-3.5 max-w-[850px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em] text-white">
              Everything needed to build search and AI authority.
            </h2>
          </div>
          <p className="max-w-[480px] text-[15px] leading-[1.75] text-slate-400 lg:text-right">
            QuasarAISEO connects research, technical optimization, content, structured data,
            reporting, and scalable landing-page production in one workflow.
          </p>
        </div>

        <div className="mt-8.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text, bullets }) => (
            <article
              key={title}
              className="flex min-h-[280px] flex-col rounded-[22px] border border-slate-400/13 bg-slate-900/72 p-6"
            >
              <span className="grid size-11.5 place-items-center rounded-[15px] bg-emerald-500/10 text-emerald-300">
                <Icon className="size-5.5" />
              </span>
              <h3 className="mt-5 text-lg">{title}</h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{text}</p>
              <div className="mt-4.5 grid gap-2.25">
                {bullets.map((bullet) => (
                  <span key={bullet} className="flex items-center gap-2 text-[11px] text-slate-300">
                    <Check className="size-3.5 text-emerald-300" /> {bullet}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
