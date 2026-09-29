"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { LogOut, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { setMobileSidebarOpen } from "@/lib/store/mcpSlice";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { NAV_GROUPS, SETTINGS_ITEM, type NavItem } from "@/lib/navigation";

// Navigation follows the order work actually happens in: plan, create,
// publish, measure. Each entry says in a few words what it is for.

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={item.alias ? `${item.label} (formerly ${item.alias})` : item.label}
      className={cn(
        "group flex items-start gap-3 rounded-lg px-3 py-1.5 transition-colors duration-150",
        active
          ? "bg-brand-50 text-slate-950 dark:bg-brand-500/12 dark:text-white"
          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-[18px] shrink-0",
          active ? "text-brand-700 dark:text-brand-300" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200",
        )}
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[13.5px] font-semibold leading-5">
          {item.label}
          {item.beta && (
            <span className="rounded bg-slate-200 px-1 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-300">Beta</span>
          )}
        </span>
        <span className={cn("block text-xs leading-4", active ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400")}>
          {item.hint}
        </span>
      </span>
    </Link>
  );
}

export function DashboardSidebar({ mobileOpen = false, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { preferences } = useWorkspace();

  const isActive = (href: string) => (href === "/dashboard" ? pathname === "/dashboard" : !!pathname?.startsWith(href));

  const close = () => {
    onMobileClose?.();
    dispatch(setMobileSidebarOpen(false));
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const sidebarContent = (
    <aside className="flex h-full w-[264px] flex-col border-r border-slate-200 bg-[var(--sidebar)] dark:border-white/10">
      <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5 px-5 pb-4 pt-4">
        <span className="grid size-9 place-items-center rounded-lg bg-slate-900 p-1.5 dark:bg-slate-800">
          <Image src="/mainlogos/mainlogo.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-bold text-slate-950 dark:text-white">Quasar AI SEO</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">Plan, write, publish, measure</span>
        </span>
      </Link>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => (!item.beta || preferences.betaFeatures) && (!item.superOnly || user?.role === "super"));
          if (items.length === 0) return null;
          return (
            <div key={group.id} className={group.id === "home" ? "" : "mt-4"}>
              {group.id !== "home" && (
                <p className="px-3 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={close} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-3 dark:border-white/10">
        <NavLink item={SETTINGS_ITEM} active={isActive(SETTINGS_ITEM.href)} onNavigate={close} />
        <div className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-1.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-700">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{user?.name ?? "User"}</div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email ?? ""}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-400/10 dark:hover:text-red-300"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:h-screen lg:w-[264px] lg:flex-col">
        {sidebarContent}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-slate-950/50" onClick={close} />
          <div className="absolute inset-y-0 left-0 animate-in slide-in-from-left duration-200">
            {sidebarContent}
            <button
              type="button"
              onClick={close}
              aria-label="Close navigation"
              className="absolute right-[-48px] top-4 grid size-10 place-items-center rounded-lg bg-slate-900 text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
