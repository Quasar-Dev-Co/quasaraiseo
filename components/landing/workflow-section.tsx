import { BrainCircuit, Globe2, Rocket, ScanSearch, Workflow } from "lucide-react"

import { workflowSteps } from "./data"

const nodes = [
  {
    icon: Globe2,
    title: "Website and market input",
    text: "URL, niche, location, language, goals, and priority services.",
    className: "top-9.5 left-1/2 -translate-x-1/2",
  },
  {
    icon: ScanSearch,
    title: "SEO crawl engine",
    text: "Technical health, structure, metadata, internal links, and UX.",
    className: "top-[206px] left-10.5",
  },
  {
    icon: BrainCircuit,
    title: "AI market intelligence",
    text: "Keywords, competitors, entities, prompts, topics, and opportunities.",
    className: "top-[206px] right-10.5",
  },
  {
    icon: Rocket,
    title: "Growth system generated",
    text: "Audit report, prioritized roadmap, pages, schema, and content opportunities.",
    className: "bottom-9 left-1/2 -translate-x-1/2 w-[230px] text-white bg-gradient-to-br from-slate-900 to-slate-950",
  },
]

export function WorkflowSection() {
  return (
    <section id="workflow" className="px-4 py-26">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-13.5 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            <Workflow className="size-3.5" /> Automated workflow
          </div>
          <h2 className="mt-3.5 max-w-[850px] text-[clamp(34px,4.5vw,60px)] font-black leading-[1.02] tracking-[-0.052em]">
            From one website URL to a complete growth system.
          </h2>
          <p className="mt-6 max-w-[720px] text-lg leading-[1.75] text-slate-600">
            Replace disconnected SEO tools and manual research with one repeatable, intelligent
            process.
          </p>

          <div className="mt-7.5 grid gap-3">
            {workflowSteps.map((step) => (
              <div key={step.number} className="grid grid-cols-[48px_1fr] gap-3.5 rounded-2xl p-4">
                <span className="grid size-12 place-items-center rounded-[15px] bg-blue-50 text-xs font-black text-blue-700">
                  {step.number}
                </span>
                <div>
                  <h3 className="m-0 text-[15px]">{step.title}</h3>
                  <p className="mt-1.25 text-xs leading-relaxed text-slate-500">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View Card List */}
        <div className="grid grid-cols-1 gap-3.5 sm:hidden">
          {nodes.map((node, i) => {
            const Icon = node.icon
            const isDark = node.className.includes("text-white")
            return (
              <div
                key={i}
                className={`rounded-2xl border p-4 shadow-sm ${
                  isDark
                    ? "border-slate-800 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-9 place-items-center rounded-xl ${
                      isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold">{node.title}</h4>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {node.text}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop Canvas Graph */}
        <div className="relative hidden min-h-[560px] rounded-[30px] border border-slate-200 bg-white p-6.5 shadow-[0_28px_80px_rgba(15,23,42,0.11)] sm:block">
          {nodes.map((node, i) => {
            const Icon = node.icon
            const isDark = node.className.includes("text-white")
            return (
              <div
                key={i}
                className={`absolute z-20 w-[180px] rounded-[17px] border border-slate-200 bg-white p-3.75 shadow-[0_14px_34px_rgba(15,23,42,0.1)] ${node.className}`}
              >
                <span
                  className={`grid size-8.5 place-items-center rounded-[11px] ${
                    isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <Icon className="size-4.5" />
                </span>
                <h4 className="mt-2.75 text-[13px]">{node.title}</h4>
                <p
                  className={`mt-1.25 text-[10px] leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {node.text}
                </p>
              </div>
            )
          })}
          <svg
            className="absolute inset-0 z-10 h-full w-full"
            viewBox="0 0 600 520"
            preserveAspectRatio="none"
          >
            <path
              d="M300 120 V190 M300 190 H145 M300 190 H455 M145 190 V280 M455 190 V280 M145 360 H455 M300 360 V420"
              fill="none"
              stroke="rgba(217,70,239,0.45)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}
