import Link from "next/link"

export function AuditFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/64 px-4 pt-7 pb-10.5">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-between gap-5 text-xs text-slate-500 sm:flex-row sm:items-center">
        <span>© 2026 QuasarAISEO. Audit Studio frontend.</span>
        <div className="flex gap-4.5">
          <Link href="/" className="hover:text-slate-900">Landing page</Link>
          <a href="#" className="hover:text-slate-900">Documentation</a>
          <a href="#" className="hover:text-slate-900">Privacy</a>
        </div>
      </div>
    </footer>
  )
}
