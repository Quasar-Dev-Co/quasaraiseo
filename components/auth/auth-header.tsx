"use client"

import Link from "next/link"
import { Orbit, ArrowLeft } from "lucide-react"

export function AuthHeader({ backHref = "/" }: { backHref?: string }) {
  return (
    <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-2.5 text-[17px] font-black tracking-[-0.035em]">
        <span className="grid size-9 place-items-center rounded-[12px] bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-[0_12px_25px_rgba(16,185,129,0.28)]">
          <Orbit className="size-[18px]" />
        </span>
        <span className="text-white">
          Quasar<span className="text-emerald-400">AISEO</span>
        </span>
      </Link>
      <Link
        href={backHref}
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="size-3.5" /> Back to site
      </Link>
    </header>
  )
}
