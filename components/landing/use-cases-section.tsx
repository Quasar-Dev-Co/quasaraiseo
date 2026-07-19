import Link from "next/link"
import { ArrowRight, BriefcaseBusiness } from "lucide-react"

import { useCases } from "./data"

export function UseCasesSection() {
  return (
    <section className="px-4 py-19">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          <BriefcaseBusiness className="size-3.5" /> Built for your workflow
        </div>
        <h2 className="mt-3.5 max-w-[850px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em]">
          One platform, multiple growth teams.
        </h2>

        <div className="mt-8.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="flex min-h-[250px] flex-col rounded-[20px] border border-slate-200 bg-white p-5.75"
            >
              <span className="grid size-11 place-items-center rounded-[14px] bg-emerald-50 text-emerald-700">
                <Icon className="size-5.25" />
              </span>
              <h3 className="mt-4.5 text-lg">{title}</h3>
              <p className="mt-2.25 text-xs leading-relaxed text-slate-500">{text}</p>
              <Link
                href="#pricing"
                className="mt-4.5 flex items-center gap-1.75 text-[11px] font-bold"
              >
                Explore solution <ArrowRight className="size-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
