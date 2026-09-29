"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

export function AuthHeader({ backHref = "/" }: { backHref?: string }) {
  return (
    <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-2.5 text-[17px] font-black tracking-[-0.035em]">
        <span className="grid size-9 place-items-center rounded-[12px] border border-brand-500/30 bg-slate-950 p-1.5 shadow-sm">
          <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={24} height={24} className="size-full object-contain" priority />
        </span>
        <span className="text-white">
          Quasar<span className="text-brand-400">AISEO</span>
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
