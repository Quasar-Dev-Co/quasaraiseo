"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_8%_9%,rgba(217,70,239,0.14),transparent_27%),radial-gradient(circle_at_91%_14%,rgba(147,51,234,0.11),transparent_24%),linear-gradient(180deg,#fdf4ff_0%,#f8fafc_45%,#fff_100%)] dark:bg-[radial-gradient(circle_at_8%_9%,rgba(217,70,239,0.08),transparent_27%),radial-gradient(circle_at_91%_14%,rgba(147,51,234,0.05),transparent_24%),linear-gradient(180deg,#020617_0%,#0b1220_45%,#020617_100%)]">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between border-b border-slate-200/60 px-6 py-4 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-xl" />
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="px-6 py-8 lg:px-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-4 w-80" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/60 p-5 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-1.5 h-3 w-40" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
