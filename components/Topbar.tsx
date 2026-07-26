"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { setMobileMenuOpen, toggleTheme } from "@/lib/store/auditSlice";
import { Sparkles, Bell, ChevronDown, Menu, Sun, Moon } from "lucide-react";

export default function Topbar() {
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state: RootState) => state.audit.mobileMenuOpen);
  const theme = useSelector((state: RootState) => state.audit.theme);

  return (
    <header className="flex h-[74px] items-center justify-between border-b border-slate-100 bg-white/20 px-6 backdrop-blur-md dark:border-white/5 dark:bg-slate-900/10 lg:justify-end lg:px-9">
      {/* Mobile Burger Menu Button */}
      <button
        onClick={() => dispatch(setMobileMenuOpen(!mobileMenuOpen))}
        className="flex size-11 items-center justify-center rounded-xl border border-slate-200/90 bg-white/75 hover:bg-slate-50 active:scale-95 cursor-pointer dark:border-white/10 dark:bg-slate-950/75 dark:hover:bg-slate-900 lg:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu className="size-5 text-slate-700 dark:text-slate-200" />
      </button>

      {/* Action Items */}
      <div className="flex items-center gap-3">
        {/* What's new button */}
        <button className="hidden min-h-[43px] items-center justify-center gap-2 rounded-full border border-slate-200/95 bg-white/65 px-4.5 text-xs font-bold text-slate-700 shadow-xs hover:-translate-y-0.5 hover:border-blue-400/35 hover:shadow-md cursor-pointer transition-all dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300 sm:inline-flex">
          <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
          <span>What's new</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="flex size-11 items-center justify-center rounded-full border border-slate-200/90 bg-white/68 hover:bg-slate-50 active:scale-95 cursor-pointer dark:border-white/10 dark:bg-slate-950/50 dark:hover:bg-slate-900"
          aria-label="Toggle light/dark theme"
        >
          {theme === "light" ? (
            <Moon className="size-[17px] text-slate-700 dark:text-slate-300" />
          ) : (
            <Sun className="size-[17px] text-amber-400" />
          )}
        </button>

        {/* Notifications button */}
        <button
          className="relative flex size-11 items-center justify-center rounded-full border border-slate-200/90 bg-white/68 hover:bg-slate-50 active:scale-95 cursor-pointer dark:border-white/10 dark:bg-slate-950/50 dark:hover:bg-slate-900"
          aria-label="Notifications"
        >
          <Bell className="size-[17px] text-slate-700 dark:text-slate-300" />
          {/* Pulsing notification indicator */}
          <span className="absolute top-[3px] right-[3px] size-2 rounded-full border-2 border-[#fbfaf7] bg-blue-500 dark:border-[#111a2b] animate-pulse-dot" />
        </button>

        {/* Profile menu */}
        <button className="flex min-w-[78px] h-11 items-center justify-center gap-2.5 rounded-full border border-slate-200/90 bg-white/68 px-2 cursor-pointer transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/50 dark:hover:bg-slate-900">
          <span className="flex size-7.5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-extrabold text-white shadow-xs">
            AR
          </span>
          <ChevronDown className="size-3.5 text-slate-400 dark:text-slate-500" />
        </button>
      </div>
    </header>
  );
}
