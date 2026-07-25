"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

export function AuditNavbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/84 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-[1240px] items-center justify-between gap-6 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 text-[19px] font-black tracking-[-0.035em]">
          <span className="grid size-9.5 place-items-center rounded-[13px] border border-fuchsia-500/30 bg-slate-950 p-1.5 shadow-[0_8px_20px_rgba(217,70,239,0.35)]">
            <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={26} height={26} className="size-full object-contain" priority />
          </span>
          <span className="text-slate-950">
            Quasar<span className="bg-gradient-to-r from-fuchsia-600 to-pink-500 bg-clip-text text-transparent">AISEO</span>
          </span>
        </Link>

        <nav
          className={`${
            menuOpen
              ? "absolute left-4 right-4 top-16 z-50 flex flex-col gap-1 rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_28px_80px_rgba(15,23,42,0.11)]"
              : "hidden md:flex md:items-center md:gap-1"
          }`}
        >
          {[
            { label: "Dashboard", href: "/" },
            { label: "Audits", href: "#audit-form" },
            { label: "Reports", href: "#report-preview" },
            { label: "Settings", href: "#" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#audit-form"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center gap-2 rounded-[13px] bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(2,6,23,0.18)] md:hidden"
          >
            New audit
          </Link>
        </nav>

        <div className="hidden md:block">
          <Link
            href="#audit-form"
            className="flex items-center gap-2 rounded-[13px] bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(2,6,23,0.18)] transition-transform hover:-translate-y-px"
          >
            New audit
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="grid size-10.5 place-items-center rounded-[13px] border border-slate-200 bg-white md:hidden"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
    </header>
  )
}
