"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Menu, Sun, Moon, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { toggleTheme } from "@/lib/store/auditSlice";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

import { DashboardSidebar } from "./dashboard-sidebar";
import { Button } from "@/components/ui/button";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, logout } = useAuth();
  const theme = useSelector((state: RootState) => state.audit.theme);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_9%,rgba(217,70,239,0.12),transparent_27%),radial-gradient(circle_at_91%_14%,rgba(147,51,234,0.10),transparent_24%),linear-gradient(180deg,#fdf4ff_0%,#f8fafc_45%,#fff_100%)] text-slate-900 antialiased dark:bg-[radial-gradient(circle_at_8%_9%,rgba(217,70,239,0.08),transparent_27%),radial-gradient(circle_at_91%_14%,rgba(147,51,234,0.06),transparent_24%),linear-gradient(180deg,#020617_0%,#0f0720_45%,#020617_100%)] dark:text-white">
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

            {/* User avatar with dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/68 px-2.5 py-1.5 transition-colors hover:border-fuchsia-300 dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-fuchsia-400/30"
              >
                <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-xs font-extrabold text-white">
                  {initials}
                </span>
                <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900">
                  {/* User info */}
                  <div className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user?.name ?? "User"}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email ?? ""}</p>
                  </div>
                  {/* Menu items */}
                  <div className="p-1.5">
                    <button
                      onClick={() => { setUserMenuOpen(false); router.push("/setting"); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      <UserIcon className="size-4 text-slate-400" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
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
