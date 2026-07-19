import Link from "next/link"
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
  Orbit,
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
    <section id="top" className="px-4 py-22 sm:py-24">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-13.5 lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)]">
        {/* Left column */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
            SEO + GEO automation platform
          </div>

          <h1 className="mt-6 max-w-[760px] text-[clamp(52px,7vw,86px)] font-black leading-[0.95] tracking-[-0.067em]">
            Win visibility across search and{" "}
            <em className="not-italic bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
              AI answers.
            </em>
          </h1>

          <p className="mt-6 max-w-[720px] text-lg leading-[1.75] text-slate-600">
            QuasarAISEO turns one website into a scalable growth system with technical audits,
            programmatic landing pages, semantic content, schema, keyword intelligence, and AI
            search visibility optimization.
          </p>

          <div className="mt-7.5 flex flex-wrap gap-3">
            <Link
              href="/create_audit_report"
              className="flex min-h-13 items-center gap-2 rounded-[15px] bg-gradient-to-br from-emerald-300 to-emerald-500 px-5 text-sm font-bold text-[#022c22] shadow-[0_16px_35px_rgba(16,185,129,0.25)] transition-transform hover:-translate-y-px"
            >
              Create your free audit <ArrowUpRight className="size-4.5" />
            </Link>
            <Link
              href="#platform"
              className="flex min-h-13 items-center gap-2 rounded-[15px] border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-transform hover:-translate-y-px"
            >
              Explore the platform <PlayCircle className="size-4.5" />
            </Link>
          </div>

          <div className="mt-4.5 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="size-4 text-emerald-600" /> No credit card required. Public
            website data only.
          </div>

          <div className="mt-7.5 flex flex-wrap items-center gap-x-5.5 gap-y-4 border-t border-slate-200 pt-6.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Built for modern discovery
            </span>
            {[
              { icon: Search, label: "Google Search" },
              { icon: Sparkles, label: "AI Overview" },
              { icon: Bot, label: "AI assistants" },
              { icon: Network, label: "Entity visibility" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.75 text-xs font-semibold text-slate-600">
                <Icon className="size-3.5 text-emerald-600" /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right column - dashboard mockup */}
        <div className="relative rounded-[30px] border border-slate-200/93 bg-white/78 p-3.5 shadow-[0_28px_80px_rgba(15,23,42,0.11)]">
          {/* Floating cards */}
          <div className="absolute -right-7% top-12% z-20 hidden w-[185px] rounded-2xl border border-slate-200/90 bg-white/94 p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] xl:block">
            <small className="block text-[9px] uppercase text-slate-400">AI visibility</small>
            <strong className="mt-1.75 block text-[22px]">84%</strong>
            <span className="mt-1.5 flex items-center gap-1.25 text-[9px] text-emerald-700">
              <Activity className="size-3" /> +18 points this month
            </span>
          </div>
          <div className="absolute -left-7% bottom-9% z-20 hidden w-[200px] rounded-2xl border border-slate-200/90 bg-white/94 p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] xl:block">
            <small className="block text-[9px] uppercase text-slate-400">New opportunities</small>
            <strong className="mt-1.75 block text-[22px]">126</strong>
            <span className="mt-1.5 flex items-center gap-1.25 text-[9px] text-emerald-700">
              <CheckCircle2 className="size-3" /> 31 high-value keywords
            </span>
          </div>

          {/* Dashboard */}
          <div className="overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_90%_0,rgba(16,185,129,0.2),transparent_28%),linear-gradient(145deg,#0f172a,#020617)] text-white shadow-[0_36px_120px_rgba(2,6,23,0.35)]">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-slate-400/13 px-4.5 py-4">
              <div className="flex gap-1.5">
                <i className="size-2 rounded-full bg-rose-400" />
                <i className="size-2 rounded-full bg-amber-400" />
                <i className="size-2 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center gap-1.75 rounded-full border border-slate-400/13 bg-slate-900/78 px-2.75 py-1.75 text-[10px] text-slate-400">
                <LockKeyhole className="size-3" /> app.quasaraiseo.com/dashboard
              </div>
              <div className="grid size-7.5 place-items-center rounded-[10px] bg-emerald-500/10 text-emerald-300">
                <CircleUserRound className="size-3.5" />
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 min-h-[530px] sm:grid-cols-[175px_1fr]">
              {/* Sidebar */}
              <aside className="hidden border-r border-slate-400/12 px-3.5 py-5 sm:block">
                <div className="flex items-center gap-2 px-1.75 pb-4.5 text-xs font-bold">
                  <Orbit className="size-3.5" /> QuasarAISEO
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
                      active ? "bg-emerald-500/10 text-emerald-300" : "text-slate-500"
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
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/9 px-2.25 py-1.75 text-[9px] text-emerald-300">
                    <i className="size-1.5 rounded-full bg-emerald-400" /> Tracking live
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
                      <span className="mt-2 block text-[8px] text-emerald-300">{stat.note}</span>
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
                        <stop offset="0%" stopColor="#34d399" stopOpacity=".32" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,125 C55,119 78,112 118,104 C163,95 174,91 212,80 C250,70 272,76 309,59 C347,42 376,49 409,34 C447,16 467,23 500,10 L500,150 L0,150 Z"
                      fill="url(#fill)"
                    />
                    <path
                      d="M0,125 C55,119 78,112 118,104 C163,95 174,91 212,80 C250,70 272,76 309,59 C347,42 376,49 409,34 C447,16 467,23 500,10"
                      fill="none"
                      stroke="#34d399"
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
                        <em className="not-italic text-emerald-300">{row.change}</em>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-[82px_1fr] items-center gap-3 rounded-2xl border border-slate-400/12 bg-slate-900/66 p-3.75">
                    <div className="grid size-20 place-items-center rounded-full bg-[radial-gradient(circle_at_center,#0f172a_58%,transparent_59%),conic-gradient(#34d399_0_78%,rgba(148,163,184,0.12)_78%_100%)] text-xl font-bold">
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
