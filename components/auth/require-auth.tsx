"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_8%_9%,rgba(217,70,239,0.14),transparent_27%),radial-gradient(circle_at_91%_14%,rgba(147,51,234,0.11),transparent_24%),linear-gradient(180deg,#fdf4ff_0%,#f8fafc_45%,#fff_100%)] dark:bg-[radial-gradient(circle_at_8%_9%,rgba(217,70,239,0.08),transparent_27%),radial-gradient(circle_at_91%_14%,rgba(147,51,234,0.05),transparent_24%),linear-gradient(180deg,#020617_0%,#0b1220_45%,#020617_100%)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-fuchsia-500" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
