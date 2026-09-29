"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, CircleHelp, LogOut, Menu, Moon, Settings, Sun } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "@/lib/store";
import { toggleTheme } from "@/lib/store/auditSlice";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { findNavItem } from "@/lib/navigation";
import { OnboardingProvider, useOnboarding } from "@/components/onboarding/onboarding-tour";

import { DashboardSidebar } from "./dashboard-sidebar";

function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { openTour } = useOnboarding();
  const theme = useSelector((state: RootState) => state.audit.theme);
  const nav = findNavItem(pathname);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-[var(--background)] px-4 lg:px-8 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="grid size-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-white/5"
        >
          <Menu className="size-5" />
        </button>
        {nav && (
          <nav aria-label="Breadcrumb" className="min-w-0 truncate text-sm">
            {nav.group && nav.group.id !== "home" && (
              <span className="text-slate-500 dark:text-slate-400">{nav.group.label} <span aria-hidden>/</span> </span>
            )}
            <span className="font-semibold text-slate-900 dark:text-white">{nav.item.label}</span>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={openTour}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
        >
          <CircleHelp className="size-4" />
          <span className="hidden sm:inline">How it works</span>
        </button>
        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          className="grid size-9 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
        >
          {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>

        <div ref={userMenuRef} className="relative ml-1">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            className="flex h-9 items-center gap-1.5 rounded-lg px-1.5 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <span className="grid size-7 place-items-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-slate-700">{initials}</span>
            <ChevronDown className={`size-3.5 text-slate-500 transition-transform duration-150 ${userMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {userMenuOpen && (
            <div role="menu" className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-lg border border-slate-200 bg-popover shadow-lg dark:border-white/10">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name ?? "User"}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email ?? ""}</p>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setUserMenuOpen(false); router.push("/setting"); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <Settings className="size-4 text-slate-500" /> Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setUserMenuOpen(false); logout(); router.push("/login"); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { preferences } = useWorkspace();

  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <DashboardSidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
        <div className="lg:pl-[264px]">
          <TopBar onOpenMenu={() => setMobileSidebarOpen(true)} />
          <main
            className={
              preferences.compactMode
                ? "compact-workspace mx-auto w-full max-w-[1280px] px-3 py-4 lg:px-6"
                : "mx-auto w-full max-w-[1280px] px-4 py-7 lg:px-8"
            }
          >
            {children}
          </main>
        </div>
      </div>
    </OnboardingProvider>
  );
}
