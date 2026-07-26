import Link from "next/link"
import Image from "next/image"
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleUserRound,
  CodeXml,
  FileSearch2,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Network,
  PlayCircle,
  Radar,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Files,
} from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0,rgba(217,70,239,0.14),transparent_50%)] px-4 pb-20 pt-16 sm:pb-24 sm:pt-20">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1fr]">
        {/* Left Column */}
        <div className="flex flex-col items-start">
          {/* SEO + GEO Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/86 px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-500 shadow-[0_0_0_5px_rgba(217,70,239,0.18)]" />
            </span>
            <span>SEO + GEO Automation Platform</span>
          </div>

          <h1 className="mt-5 text-[clamp(40px,5.5vw,72px)] font-black leading-[0.98] tracking-[-0.055em] text-slate-950">
            Get cited in{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              AI answers.
            </span>
            <br />
            Rank everywhere.
          </h1>

          <p className="mt-6 max-w-[580px] text-lg leading-[1.75] text-slate-600">
            Audit your website, discover high-intent keywords, optimize structured data, and
            automate landing pages to build dominance in Google Search, Perplexity, and AI Overview.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center">
            <Link
              href="/create_audit_report"
              className="flex items-center justify-center gap-2 rounded-[15px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-6 py-4 text-sm font-bold text-white shadow-[0_16px_35px_rgba(217,70,239,0.3)] transition-transform hover:-translate-y-px"
            >
              Create your free audit <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="#platform"
              className="flex items-center justify-center gap-2 rounded-[15px] border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition-transform hover:-translate-y-px"
            >
              See how it works <PlayCircle className="size-4" />
            </Link>
          </div>

          {/* Key pillars */}
          <div className="mt-10.5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, text: "Technical Audits" },
              { icon: Search, text: "GEO & Entity SEO" },
              { icon: Sparkles, text: "AI Answer Tracking" },
              { icon: Bot, text: "Programmatic Pages" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Icon className="size-3.5 text-blue-600" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Mockup Graphic */}
        <div className="relative">
          {/* Ambient Glow */}
          <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl" />

          <div className="relative overflow-hidden rounded-[28px] border border-slate-700/60 bg-[radial-gradient(circle_at_90%_0,rgba(217,70,239,0.24),transparent_35%),linear-gradient(145deg,#0f172a,#020617)] text-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
            {/* Topbar */}
            <div className="flex items-center justify-between border-b border-slate-400/12 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-rose-500/80" />
                <span className="size-3 rounded-full bg-amber-500/80" />
                <span className="size-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-400/15 bg-slate-900/80 px-3.5 py-1 text-[11px] font-mono text-slate-400">
                <LockKeyhole className="size-3 text-emerald-400" /> app.quasaraiseo.com/dashboard
              </div>
              <div className="grid size-7.5 place-items-center rounded-[10px] bg-blue-500/15 text-blue-400">
                <CircleUserRound className="size-3.5" />
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 min-h-[530px] sm:grid-cols-[175px_1fr]">
              {/* Sidebar */}
              <aside className="hidden border-r border-slate-400/12 px-3.5 py-5 sm:block">
                <div className="flex items-center gap-2 px-1.75 pb-4.5 text-xs font-extrabold tracking-wide">
                  <span className="grid size-5 place-items-center rounded bg-slate-950 border border-blue-500/40 p-0.5 shadow-sm">
                    <Image src="/mainlogos/mainlogo.png" alt="Logo" width={16} height={16} className="size-full object-contain" />
                  </span>
                  QuasarAISEO
                </div>
                {[
                  { icon: LayoutDashboard, label: "Overview", active: true },
                  { icon: Radar, label: "AI visibility" },
                  { icon: FileSearch2, label: "Site audits" },
                  { icon: KeyRound, label: "Keywords" },
                  { icon: Files, label: "Content" },
                  { icon: CodeXml, label: "Schema" },
                  { icon: Settings, label: "Settings" },
                ].map(({ icon: Icon, label, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2.25 rounded-[10px] px-2.5 py-2.25 text-[10px] font-semibold ${
                      active ? "bg-blue-500/15 text-blue-400" : "text-slate-500"
                    }`}
                  >
                    <Icon className="size-3.5" /> {label}
                  </div>
                ))}
              </aside>

              {/* Main */}
              <div className="p-5.5">
                <div className="flex items-center justify-between gap-3.5">
                  <div>
                    <h3 className="m-0 text-lg">Visibility overview</h3>
                    <p className="mt-1 text-[10px] text-slate-500">Search and AI discovery performance</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.25 py-1.75 text-[9px] text-blue-400">
                    <i className="size-1.5 rounded-full bg-blue-400" /> Tracking live
                  </span>
                </div>

                {/* Stats */}
                <div className="mt-4.5 grid grid-cols-3 gap-2.5">
                  {[
                    { label: "Organic visibility", value: "74.8%", note: "↑ 12.4% this month" },
                    { label: "AI citations", value: "286", note: "↑ 42 new mentions" },
                    { label: "Keywords tracked", value: "1,842", note: "156 in top 10" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[14px] border border-slate-400/12 bg-slate-900/70 p-3"
                    >
                      <small className="block text-[8px] uppercase text-slate-500">{stat.label}</small>
                      <strong className="mt-2.5 block text-[23px]">{stat.value}</strong>
                      <span className="mt-2 block text-[8px] text-blue-400">{stat.note}</span>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="mt-3 rounded-2xl border border-slate-400/12 bg-slate-900/66 p-3.75">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="block text-[11px]">Search visibility growth</strong>
                      <span className="text-[8px] text-slate-500">Organic + AI discovery</span>
                    </div>
                    <small className="text-[8px] text-slate-500">Last 90 days</small>
                  </div>
                  <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="mt-3 h-[155px] w-full">
                    <defs>
                      <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d946ef" stopOpacity=".38" />
                        <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,125 C55,119 78,112 118,104 C163,95 174,91 212,80 C250,70 272,76 309,59 C347,42 376,49 409,34 C447,16 467,23 500,10 L500,150 L0,150 Z"
                      fill="url(#fill)"
                    />
                    <path
                      d="M0,125 C55,119 78,112 118,104 C163,95 174,91 212,80 C250,70 272,76 309,59 C347,42 376,49 409,34 C447,16 467,23 500,10"
                      fill="none"
                      stroke="#d946ef"
                      strokeWidth="3"
                    />
                  </svg>
                </div>

                {/* Bottom panels */}
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-slate-400/12 bg-slate-900/66 p-3.75">
                    <strong className="text-[11px]">Top opportunities</strong>
                    {[
                      { kw: "ai seo audit", vol: "8.1K", change: "+11" },
                      { kw: "geo optimization", vol: "5.4K", change: "+8" },
                      { kw: "seo report tool", vol: "4.2K", change: "+14" },
                    ].map((row) => (
                      <div
                        key={row.kw}
                        className="mt-3 grid grid-cols-[1fr_34px_34px] gap-2 text-[8px] text-slate-400"
                      >
                        <b className="text-slate-200">{row.kw}</b>
                        <span>{row.vol}</span>
                        <em className="not-italic text-blue-400">{row.change}</em>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-[82px_1fr] items-center gap-3 rounded-2xl border border-slate-400/12 bg-slate-900/66 p-3.75">
                    <div className="grid size-20 place-items-center rounded-full bg-[radial-gradient(circle_at_center,#0f172a_58%,transparent_59%),conic-gradient(#d946ef_0_78%,rgba(148,163,184,0.12)_78%_100%)] text-xl font-bold">
                      78
                    </div>
                    <div>
                      <strong className="text-[11px]">Site health</strong>
                      <p className="mt-1.25 text-[8px] text-slate-500">Technical 86</p>
                      <p className="mt-1.25 text-[8px] text-slate-500">Content 72</p>
                      <p className="mt-1.25 text-[8px] text-slate-500">Authority 58</p>
                      <p className="mt-1.25 text-[8px] text-slate-500">UX 91</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
