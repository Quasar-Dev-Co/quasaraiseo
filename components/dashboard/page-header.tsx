"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { findNavItem } from "@/lib/navigation";

// The same header on every page: a plain title and one sentence saying what
// the page is for. Title and sentence default to the navigation entry, so a
// page only passes them to override.
export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const nav = findNavItem(pathname);
  const heading = title ?? nav?.item.label ?? "";
  const text = description ?? nav?.item.description;

  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-slate-200 pb-5 dark:border-white/10">
      <div className="min-w-0 max-w-[68ch]">
        <h1 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-[28px] dark:text-white">{heading}</h1>
        {text && <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
