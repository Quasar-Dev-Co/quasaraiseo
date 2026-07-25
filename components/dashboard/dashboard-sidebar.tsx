"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  FileSearch,
  Plug,
  PenLine,
  LayoutDashboard,
  Settings,
  ChevronRight,
  X,
  Zap,
  ClipboardList,
  LogOut,
  BarChart3,
  Globe2,
  FileSpreadsheet,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { setMobileSidebarOpen } from "@/lib/store/mcpSlice";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Create Audit", href: "/create_audit_report", icon: FileSearch },
  { label: "Audit MCP", href: "/audit-mcp", icon: Plug },
  { label: "Post Create", href: "/post-create", icon: PenLine },
  { label: "Task Management", href: "/task-management", icon: ClipboardList },
];

const googleItems = [
  { label: "Search Console", href: "/google/search-console", icon: Globe2 },
  { label: "Analytics", href: "/google/analytics", icon: BarChart3 },
  { label: "Sheets", href: "/google/sheets", icon: FileSpreadsheet },
];

const bottomItems = [
  { label: "Settings", href: "/setting", icon: Settings },
];

export function DashboardSidebar({ mobileOpen = false, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href);
  };

  const sidebarContent = (
    <aside className="relative overflow-hidden flex h-full w-[260px] flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-7">
        <span className="grid size-9.5 place-items-center overflow-hidden rounded-[13px] border border-fuchsia-500/30 bg-slate-950 p-1.5 shadow-[0_8px_20px_rgba(217,70,239,0.3)]">
          <Image src="/mainlogos/mainlogo.png" alt="QuasarAISEO" width={24} height={24} className="h-6 w-6 object-contain" />
        </span>
        <div>
          <div className="text-sm font-extrabold tracking-[0.08em] text-slate-950 dark:text-white uppercase leading-none">
            Quasar<span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">AISEO</span>
          </div>
          <div className="mt-1 text-[10px] font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase leading-none">
            Audit Studio
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-slate-200/80 dark:bg-white/10 shrink-0" />

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-3 pt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "relative group flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-[13px] font-semibold transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-transparent text-fuchsia-950 dark:text-fuchsia-300 font-bold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[24px] w-1 rounded-r-full bg-gradient-to-b from-fuchsia-600 via-purple-600 to-pink-500 shadow-[0_0_12px_rgba(217,70,239,0.6)]" />
              )}
              <Icon className={cn("size-[18px] shrink-0", active ? "text-fuchsia-600 dark:text-fuchsia-400" : "")} />
              <span>{item.label}</span>
              {active && <ChevronRight className="ml-auto size-4 text-fuchsia-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 mt-4 h-px bg-slate-200/80 dark:bg-white/10 shrink-0" />

      {/* Google integrations */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Google</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {googleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "relative group flex min-h-[40px] items-center gap-3 rounded-xl px-3.5 text-[13px] font-semibold transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-transparent text-fuchsia-950 dark:text-fuchsia-300 font-bold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[22px] w-1 rounded-r-full bg-gradient-to-b from-fuchsia-600 via-purple-600 to-pink-500 shadow-[0_0_12px_rgba(217,70,239,0.6)]" />
              )}
              <Icon className={cn("size-[17px] shrink-0", active ? "text-fuchsia-600 dark:text-fuchsia-400" : "")} />
              <span>{item.label}</span>
              {active && <ChevronRight className="ml-auto size-3.5 text-fuchsia-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="mx-4 mb-4 h-px bg-slate-200/80 dark:bg-white/10 shrink-0" />

        {/* Credits card */}
        <div className="mx-3 mb-4 rounded-2xl border border-slate-200/90 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-fuchsia-500" />
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Audit Credits</span>
          </div>
          <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            36 / 50 used
          </div>
          <div className="mt-2.5 h-[7px] w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500" style={{ width: "72%" }} />
          </div>
          <div className="mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">Renews in 14 days</div>
          <Button variant="outline" size="sm" className="mt-3 w-full text-xs font-bold hover:bg-fuchsia-50 hover:text-fuchsia-700 dark:hover:bg-fuchsia-400/10">
            Upgrade plan
          </Button>
        </div>

        {/* User info + logout */}
        <div className="mx-3 mb-3 rounded-2xl border border-slate-200/90 bg-white/65 p-3 dark:border-white/10 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-600 to-pink-500 text-xs font-bold text-white shadow-sm">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{user?.name ?? "User"}</div>
              <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">{user?.email ?? ""}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-400/10"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        {/* Bottom nav */}
        <nav className="flex flex-col gap-1 px-3 pb-5">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onMobileClose?.()}
                className="flex min-h-[40px] items-center gap-3 rounded-xl px-3.5 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <Icon className="size-[18px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:h-screen lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => {
              onMobileClose?.();
              dispatch(setMobileSidebarOpen(false));
            }}
          />
          <div className="absolute inset-y-0 left-0 animate-in slide-in-from-left duration-300">
            {sidebarContent}
            <button
              onClick={() => {
                onMobileClose?.();
                dispatch(setMobileSidebarOpen(false));
              }}
              className="absolute top-4 right-[-44px] grid size-9 place-items-center rounded-xl border border-white/10 bg-slate-950/80 text-white backdrop-blur"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
