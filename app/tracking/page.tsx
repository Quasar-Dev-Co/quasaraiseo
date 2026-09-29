"use client";

import { Fragment, useEffect, useState } from "react";
import { AlertCircle, ChevronDown, Loader2, ShieldAlert } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MyActivity } from "@/components/dashboard/my-activity";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { featureLabel, fetchTeamInsights, type TeamInsights } from "@/lib/insights-api";

// Admin view: how much each person uses the AI, where their time goes and which
// tools they run. Selecting a person shows exactly what they see on their own
// Overview.

const RANGES = [7, 30, 90] as const;

type SortKey = "tokens" | "activeMinutes" | "distinctTools" | "costUsd" | "lastActiveAt";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatMinutes(m: number): string {
  if (m < 1) return "0 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

function usd(v: number): string {
  if (v === 0) return "$0.00";
  if (v < 1) return `$${v.toFixed(4)}`;
  if (v < 100) return `$${v.toFixed(2)}`;
  return `$${Math.round(v).toLocaleString()}`;
}

function ago(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 14) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
}

function prettyTool(name: string): string {
  const s = name.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-card p-4 dark:border-white/10">
      <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">{value}</p>
      {note && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{note}</p>}
    </div>
  );
}

function TrackingContent() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<TeamInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "tokens", dir: -1 });

  useEffect(() => {
    let cancelled = false;
    fetchTeamInsights(days)
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load team activity."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const pickRange = (r: number) => { if (r !== days) { setLoading(true); setDays(r); } };
  const sortBy = (key: SortKey) => setSort((cur) => (cur.key === key ? { key, dir: (cur.dir * -1) as 1 | -1 } : { key, dir: -1 }));

  const users = [...(data?.users ?? [])].sort((a, b) => {
    const av = sort.key === "lastActiveAt" ? new Date(a.lastActiveAt ?? 0).getTime() : a[sort.key];
    const bv = sort.key === "lastActiveAt" ? new Date(b.lastActiveAt ?? 0).getTime() : b[sort.key];
    return (av - bv) * sort.dir || a.name.localeCompare(b.name);
  });
  const maxTokens = Math.max(...users.map((u) => u.tokens), 1);
  const th = "px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap";
  const td = "px-4 py-3 text-[13px] text-slate-800 dark:text-slate-200 whitespace-nowrap";
  const sortable = (key: SortKey, label: string, right = false) => (
    <th className={`${th} ${right ? "text-right" : ""}`} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => sortBy(key)} className="inline-flex items-center gap-1 hover:text-slate-950 dark:hover:text-white">
        {label}
        {sort.key === key && <span aria-hidden>{sort.dir === 1 ? "↑" : "↓"}</span>}
      </button>
    </th>
  );

  return (
    <>
      <PageHeader
        actions={
          <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-white/10" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => pickRange(r)}
                aria-pressed={days === r}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${days === r ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}
              >
                {r} days
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </p>
      )}

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="size-4 animate-spin" /> Loading team activity…</div>
      ) : data ? (
        <div className={`space-y-6 ${loading ? "opacity-60 transition-opacity" : "transition-opacity"}`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Tile label="People active" value={`${data.totals.activeUsers} of ${data.totals.users}`} note={`in the last ${days} days`} />
            <Tile label="AI tokens" value={formatTokens(data.totals.tokens)} />
            <Tile label="Active time" value={formatMinutes(data.totals.activeMinutes)} note="Estimated, MCP Chat" />
            <Tile label="Tool runs" value={data.totals.toolCalls.toLocaleString()} />
            <Tile label="AI cost" value={usd(data.totals.costUsd)} note="Details in Settings → Costs" />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-card dark:border-white/10">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className={th}>Person</th>
                  {sortable("lastActiveAt", "Last active")}
                  {sortable("activeMinutes", "Active time", true)}
                  {sortable("tokens", "AI tokens", true)}
                  {sortable("distinctTools", "Tools", true)}
                  <th className={th}>Most time on</th>
                  {sortable("costUsd", "Cost", true)}
                  <th className={th}><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const open = openId === u.id;
                  return (
                    <Fragment key={u.id}>
                      <tr className="border-b border-slate-100 last:border-0 dark:border-white/5">
                        <td className={td}>
                          <div className="font-semibold text-slate-950 dark:text-white">{u.name || u.email}{u.role === "super" && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-300">Admin</span>}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                        </td>
                        <td className={td}>{ago(u.lastActiveAt)}</td>
                        <td className={`${td} text-right tabular-nums`}>{formatMinutes(u.activeMinutes)}</td>
                        <td className={`${td} text-right`}>
                          <div className="ml-auto flex w-28 flex-col items-end gap-1">
                            <span className="tabular-nums">{formatTokens(u.tokens)}</span>
                            <span className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" aria-hidden>
                              <span className="block h-full rounded-full bg-brand-700 dark:bg-brand-400" style={{ width: `${(u.tokens / maxTokens) * 100}%` }} />
                            </span>
                          </div>
                        </td>
                        <td className={`${td} text-right tabular-nums`} title={u.topTool ? `Most used: ${prettyTool(u.topTool)}` : undefined}>{u.distinctTools}<span className="text-xs text-slate-500"> ({u.toolCalls} runs)</span></td>
                        <td className={`${td} max-w-[200px] truncate`} title={u.topWebsite ?? undefined}>{u.topWebsite ?? <span className="text-slate-500">{u.topArea ? featureLabel(u.topArea) : "Nothing yet"}</span>}</td>
                        <td className={`${td} text-right tabular-nums`}>{usd(u.costUsd)}</td>
                        <td className={`${td} text-right`}>
                          <button
                            type="button"
                            onClick={() => setOpenId(open ? null : u.id)}
                            aria-expanded={open}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-white/5"
                          >
                            {open ? "Hide" : "View"} <ChevronDown className={`size-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b border-slate-100 bg-slate-50/60 last:border-0 dark:border-white/5 dark:bg-white/[0.02]">
                          <td colSpan={8} className="px-4 py-5">
                            <MyActivity
                              userId={u.id}
                              title={`${u.name || u.email}’s activity`}
                              description="This is the summary they see on their own Overview."
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-600">No people yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function TrackingPage() {
  const { user } = useAuth();
  return (
    <RequireAuth>
      <DashboardLayout>
        {user && user.role !== "super" ? (
          <div className="mx-auto mt-16 max-w-md text-center">
            <ShieldAlert className="mx-auto size-8 text-slate-400" />
            <h1 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">Only admins can open Tracking</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Your own numbers are on the Overview page, under “Your activity”.</p>
          </div>
        ) : (
          <TrackingContent />
        )}
      </DashboardLayout>
    </RequireAuth>
  );
}
