"use client";

import { useState, type ReactNode } from "react";
import { Menu, Bell, Sun, Moon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { toggleTheme } from "@/lib/store/auditSlice";

import { DashboardSidebar } from "./dashboard-sidebar";
import { Button } from "@/components/ui/button";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.audit.theme);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-white">
      <DashboardSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="lg:pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-slate-200/80 bg-white/70 px-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              QuasarAISEO Audit Studio
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="size-[17px]" /> : <Sun className="size-[17px]" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-[17px]" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full border-2 border-white bg-fuchsia-500 dark:border-slate-950" />
            </Button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/68 px-2.5 py-1.5 dark:border-white/10 dark:bg-slate-900/50">
              <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-xs font-extrabold text-white">
                AR
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1240px] px-4 py-8 lg:px-9">
          {children}
        </main>
      </div>
    </div>
  );
}
