import {
  Activity,
  Bot,
  CheckCircle2,
  FileSearch2,
  Gauge,
  Orbit,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const features = [
  { icon: FileSearch2, title: "Full SEO audits", text: "Crawl, score, and report on any website in minutes." },
  { icon: Search, title: "Keyword intelligence", text: "Discover gaps, competitors, and high-value opportunities." },
  { icon: Gauge, title: "Performance scoring", text: "Technical, content, authority, and UX — all scored 0–100." },
  { icon: Bot, title: "AI-generated reports", text: "Client-ready findings, summaries, and action plans." },
]

const stats = [
  { value: "1,284", label: "Audits generated" },
  { value: "48.6K", label: "Pages analyzed" },
  { value: "+23", label: "Avg. score lift" },
]

export function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Glow effects */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-emerald-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-amber-500/8 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 size-64 rounded-full bg-emerald-400/6 blur-3xl" />

      {/* Top: Logo + badge */}
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-[15px] bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-[0_12px_25px_rgba(16,185,129,0.28)]">
            <Orbit className="size-[22px]" />
          </span>
          <span className="text-[22px] font-black tracking-[-0.035em] text-white">
            Quasar<span className="text-emerald-400">AISEO</span>
          </span>
        </div>
        <div className="inline-flex w-max items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
          SEO + GEO automation platform
        </div>
      </div>

      {/* Middle: Headline + features */}
      <div className="relative flex flex-col gap-8">
        <div>
          <h2 className="max-w-[440px] text-[clamp(32px,3.5vw,46px)] font-black leading-[1.05] tracking-[-0.05em] text-white">
            Win visibility across search and{" "}
            <em className="not-italic bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400 bg-clip-text text-transparent">
              AI answers.
            </em>
          </h2>
          <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-slate-400">
            Turn one website into a scalable growth system with technical audits, programmatic
            landing pages, semantic content, and AI search visibility optimization.
          </p>
        </div>

        <div className="grid gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3.5 rounded-[16px] border border-white/8 bg-white/[0.03] p-4 backdrop-blur-sm"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-emerald-500/10 text-emerald-300">
                <f.icon className="size-[18px]" />
              </span>
              <div>
                <strong className="block text-sm font-bold text-white">{f.title}</strong>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Stats + trust */}
      <div className="relative flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
              <strong className="block text-[26px] font-black tracking-[-0.04em] text-white">{s.value}</strong>
              <small className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {s.label}
              </small>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <ShieldCheck className="size-4 text-emerald-400/70" />
          SOC 2-ready · GDPR compliant · Public website data only
        </div>
      </div>
    </div>
  )
}
