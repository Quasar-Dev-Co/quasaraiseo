import { logoStripItems } from "./data"

export function LogoStrip() {
  return (
    <section className="border-y border-slate-200 bg-white/62 py-7">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-7 px-4 lg:grid-cols-[220px_1fr]">
        <p className="text-xs leading-relaxed text-slate-500">
          Designed for agencies, SaaS teams, local businesses, and growth-focused brands.
        </p>
        <div className="grid grid-cols-3 gap-4.5 sm:grid-cols-5">
          {logoStripItems.map((item) => (
            <div
              key={item}
              className="grid min-h-[58px] place-items-center rounded-[14px] border border-slate-200 bg-white text-xs font-bold text-slate-500"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
