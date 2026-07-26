import Link from "next/link"
import Image from "next/image"
import { AtSign, Globe, PlayCircle } from "lucide-react"

import { footerSections } from "./data"

export function Footer() {
  return (
    <footer className="bg-white px-4 pt-15.5 pb-8">
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="grid grid-cols-1 gap-8.5 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(4,0.65fr)]">
          <div>
            <Link href="#top" className="flex items-center gap-2.5 text-[19px] font-black tracking-[-0.035em]">
              <span className="grid size-9.5 place-items-center rounded-[13px] border border-blue-500/30 bg-slate-950 p-1.5 shadow-[0_8px_20px_rgba(217,70,239,0.35)]">
                <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={26} height={26} className="size-full object-contain" />
              </span>
              <span className="text-slate-950">
                Quasar<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">AISEO</span>
              </span>
            </Link>
            <p className="mt-4 max-w-[340px] text-xs leading-relaxed text-slate-500">
              A connected SEO and GEO automation platform for modern search and AI discovery.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-2.5">
              <h4 className="text-[11px] uppercase tracking-[0.13em]">{section.title}</h4>
              {section.items.map((item) => (
                <Link key={item} href="#" className="text-xs text-slate-500 hover:text-slate-900">
                  {item}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-slate-200 pt-6 text-[11px] text-slate-500 sm:flex-row sm:items-center">
          <span>© 2026 QuasarAISEO. All rights reserved.</span>
          <div className="flex gap-2">
            {[
              { icon: Globe, label: "LinkedIn" },
              { icon: AtSign, label: "Twitter" },
              { icon: PlayCircle, label: "YouTube" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid size-9 place-items-center rounded-[11px] border border-slate-200 text-slate-500 transition-colors hover:text-slate-900"
              >
                <Icon className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
