"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { setActiveTab, setMobileMenuOpen, toggleTheme } from "@/lib/store/auditSlice";
import {
  Sparkles,
  FileText,
  Briefcase,
  Blocks,
  Search,
  Gauge,
  Settings,
  ArrowRight,
  Sun,
  Moon,
  X
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Create Audit", icon: Sparkles },
  { name: "My Reports", icon: FileText },
  { name: "Projects", icon: Briefcase },
  { name: "Integrations", icon: Blocks },
  { name: "Keyword Explorer", icon: Search },
  { name: "Site Monitor", icon: Gauge },
  { name: "Settings", icon: Settings },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state: RootState) => state.audit.activeTab);
  const creditsUsed = useSelector((state: RootState) => state.audit.creditsUsed);
  const creditsMax = useSelector((state: RootState) => state.audit.creditsMax);
  const mobileMenuOpen = useSelector((state: RootState) => state.audit.mobileMenuOpen);

  const theme = useSelector((state: RootState) => state.audit.theme);
  const progressPercentage = (creditsUsed / creditsMax) * 100;

  const sidebarContent = (
    <aside className="relative overflow-hidden flex h-full w-[238px] flex-col border-r border-slate-200/90 bg-white/76 px-4 py-7 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-3 pb-8">
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-fuchsia-500/30 bg-slate-950 p-1.5 shadow-[0_8px_20px_rgba(217,70,239,0.3)]">
          <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={26} height={26} className="h-[26px] w-[26px] object-contain" />
        </div>
        <div>
          <div className="text-sm font-extrabold tracking-[0.11em] text-slate-950 dark:text-white uppercase leading-none">
            Quasar<span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">AISEO</span>
          </div>
          <div className="mt-1 text-[10px] font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase leading-none">
            Audit Studio
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <button
              key={item.name}
              onClick={() => {
                dispatch(setActiveTab(item.name));
                dispatch(setMobileMenuOpen(false)); // Close menu on select
              }}
              className={cn(
                "relative flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 text-[13px] font-semibold transition-all duration-200 hover:translate-x-1 cursor-pointer",
                isActive
                  ? "text-fuchsia-950 font-bold bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-transparent dark:text-fuchsia-300"
                  : "text-slate-600 hover:text-fuchsia-700 hover:bg-fuchsia-500/5 dark:text-slate-400 dark:hover:text-fuchsia-300"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[26px] w-1.5 rounded-r-lg bg-gradient-to-b from-fuchsia-500 via-purple-600 to-pink-500 shadow-[0_0_14px_rgba(217,70,239,0.7)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={cn("size-[18px] shrink-0", isActive ? "text-fuchsia-600 dark:text-fuchsia-400" : "")} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Credits Card */}
      <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white/65 p-4.5 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
        <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Audit Credits</div>
        <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          {creditsUsed} / {creditsMax} used
        </div>

        <div className="mt-2.5 h-[7px] w-full overflow-hidden rounded-full bg-fuchsia-50 dark:bg-slate-900">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>

        <div className="mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">Renews in 14 days</div>

        <a
          href="#"
          className="mt-4.5 inline-flex items-center gap-2 text-xs font-extrabold text-fuchsia-700 hover:text-fuchsia-600 dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
        >
          Upgrade plan
          <ArrowRight className="size-3.5" />
        </a>
      </section>

      {/* Profile Section */}
      <section className="mt-auto flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/68 p-3 dark:border-white/10 dark:bg-slate-950/50">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-800 text-xs font-extrabold text-white shadow-md shadow-slate-900/20">
          AR
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-extrabold text-slate-900 dark:text-white">Alex Rivera</div>
          <div className="mt-0.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400">Elite Plan ⌄</div>
        </div>

        {theme === "light" ? (
          <Sun
            onClick={() => dispatch(toggleTheme())}
            className="size-[17px] shrink-0 text-slate-400 hover:text-amber-500 cursor-pointer transition-colors"
          />
        ) : (
          <Moon
            onClick={() => dispatch(toggleTheme())}
            className="size-[17px] shrink-0 text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors"
          />
        )}
      </section>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:h-screen lg:w-[238px] lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer (Framer Motion) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setMobileMenuOpen(false))}
              className="fixed inset-0 z-40 bg-slate-950/38 backdrop-blur-xs lg:hidden"
            />

            {/* Sidebar Slide-in */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-[238px] lg:hidden"
            >
              <div className="relative h-full">
                {sidebarContent}
                <button
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className="absolute top-4 right-[-44px] flex size-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 text-white backdrop-blur"
                >
                  <X className="size-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
