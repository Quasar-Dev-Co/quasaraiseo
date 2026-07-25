import {
  Activity,
  Bot,
  CheckCircle2,
  FileSearch2,
  Gauge,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Image from "next/image"

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
    <div className="relative hidden overflow-hidden border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Glow effects */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-fuchsia-600/22 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-pink-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 size-64 rounded-full bg-purple-500/15 blur-3xl" />

      {/* Top: Logo + badge */}
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center overflow-hidden rounded-[15px] border border-fuchsia-500/30 bg-slate-950 p-2 shadow-[0_12px_25px_rgba(217,70,239,0.35)]">
            <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={28} height={28} className="size-full object-contain" />
          </span>
          <span className="text-[22px] font-black tracking-[-0.035em] text-white">
            Quasar<span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AISEO</span>
          </span>
        </div>
        <div className="inline-flex w-max items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-300">
          <span className="size-2 rounded-full bg-fuchsia-400 shadow-[0_0_0_5px_rgba(217,70,239,0.18)]" />
          SEO + GEO automation platform
        </div>
      </div>

      {/* Middle: Headline + features */}
      <div className="relative flex flex-col gap-8">
        <div>
          <h2 className="max-w-[440px] text-[clamp(32px,3.5vw,46px)] font-black leading-[1.05] tracking-[-0.05em] text-white">
            Win visibility across search and{" "}
            <em className="not-italic bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
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
              className="flex items-start gap-3.5 rounded-[16px] border border-white/10 bg-slate-900/80 p-4 shadow-sm backdrop-blur-sm"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-fuchsia-500/20 text-fuchsia-400">
                <f.icon className="size-[18px]" />
              </span>
              <div>
                <strong className="block text-sm font-bold text-white">{f.title}</strong>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-300">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Stats + trust */}
      <div className="relative flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-[14px] border border-white/10 bg-slate-900/80 p-4 shadow-sm">
              <strong className="block text-[26px] font-black tracking-[-0.04em] text-white">{s.value}</strong>
              <small className="mt-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {s.label}
              </small>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-400 font-semibold">
          <ShieldCheck className="size-4 text-fuchsia-400" />
          SOC 2-ready · GDPR compliant · Public website data only
        </div>
      </div>
    </div>
  )
}
