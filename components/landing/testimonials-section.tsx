import { Quote } from "lucide-react"

import { testimonials } from "./data"

export function TestimonialsSection() {
  return (
    <section className="px-4 py-19">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
          <Quote className="size-3.5" /> Customer outcomes
        </div>
        <h2 className="mt-3.5 max-w-[850px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em]">
          Clearer strategy. Faster execution. Better visibility.
        </h2>

        <div className="mt-8.5 grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="rounded-[21px] border border-slate-200 bg-white p-6 shadow-[0_14px_42px_rgba(15,23,42,0.07)]"
            >
              <span className="grid size-10 place-items-center rounded-[13px] bg-blue-50 text-blue-700">
                <Quote className="size-4.5" />
              </span>
              <p className="mt-4.5 text-sm leading-relaxed text-slate-700">{item.quote}</p>
              <footer className="mt-5.5 flex items-center gap-2.75 border-t border-slate-100 pt-4.5">
                <div className="grid size-10.5 place-items-center rounded-[14px] bg-slate-900 text-xs font-bold text-white">
                  {item.initials}
                </div>
                <span>
                  <strong className="block text-sm">{item.name}</strong>
                  <small className="mt-0.75 block text-xs text-slate-500">{item.role}</small>
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
