import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"

type ShowToast = (message: string) => void

export function CtaSection({ showToast }: { showToast: ShowToast }) {
  return (
    <section className="px-4 pb-19">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="grid grid-cols-1 items-center gap-7.5 rounded-[30px] bg-[radial-gradient(circle_at_88%_0,rgba(217,70,239,0.25),transparent_35%),linear-gradient(145deg,#0f172a,#020617)] p-6 sm:p-10.5 text-white shadow-[0_36px_120px_rgba(2,6,23,0.35)] lg:grid-cols-[1fr_auto]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-400">
              <Sparkles className="size-3.5" /> Start with one URL
            </div>
            <h2 className="mt-3.5 max-w-[760px] text-[clamp(28px,5vw,62px)] font-black leading-tight sm:leading-none tracking-[-0.055em]">
              See what is stopping your website from winning more visibility.
            </h2>
            <p className="mt-3.5 max-w-[650px] text-xs sm:text-sm leading-relaxed text-slate-400">
              Create your first SEO and AI visibility audit and turn it into a prioritized action
              plan.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:min-w-[190px]">
            <Link
              href="/create_audit_report"
              className="flex min-h-13 items-center justify-center gap-2 rounded-[15px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-6 text-sm font-bold text-white shadow-[0_16px_35px_rgba(217,70,239,0.3)] transition-transform hover:-translate-y-px"
            >
              Create free audit <ArrowUpRight className="size-4" />
            </Link>
            <button
              onClick={() => showToast("Connect this button to your booking page.")}
              className="flex min-h-13 items-center justify-center gap-2 rounded-[15px] bg-white px-5 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-px"
            >
              Book a demo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
