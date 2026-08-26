"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe2, Loader2, AlertCircle, Search, TrendingUp,
  MousePointerClick, Eye, Target, RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip,
} from "recharts";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinLoading } from "@/lib/use-min-loading";
import {
  googleApi,
  type SearchConsoleSite,
  type SearchConsoleRow,
  type SearchConsoleDailyRow,
  type GoogleStatus,
} from "@/lib/google-api";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatScDate(dateStr: string): string {
  if (!dateStr) return dateStr;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const DATE_RANGES = [
  { label: "1 Day", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "2 Months", days: 60 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
];

export default function SearchConsolePage() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [sites, setSites] = useState<SearchConsoleSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [rows, setRows] = useState<SearchConsoleRow[]>([]);
  const [dailyRows, setDailyRows] = useState<SearchConsoleDailyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinLoading(loading, 800);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState(30);

  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - (rangeDays - 1) * 24 * 60 * 60 * 1000));

  const fetchStatus = useCallback(async () => {
    try {
      const s = await googleApi.getStatus();
      setStatus(s);
      if (s.connected && s.services.searchConsole) {
        const siteList = await googleApi.getSearchConsoleSites();
        setSites(siteList);
        if (siteList.length > 0 && !selectedSite) {
          setSelectedSite(siteList[0].siteUrl);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedSite) return;
    setFetching(true);
    setError(null);
    try {
      const [queryData, dailyData] = await Promise.all([
        googleApi.getSearchConsoleAnalytics(selectedSite, startDate, endDate),
        googleApi.getSearchConsoleDaily(selectedSite, startDate, endDate),
      ]);
      setRows(queryData);
      setDailyRows(dailyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch analytics");
    } finally {
      setFetching(false);
    }
  }, [selectedSite, startDate, endDate]);

  useEffect(() => {
    if (selectedSite) {
      fetchAnalytics();
    }
  }, [selectedSite, fetchAnalytics, rangeDays]);

  if (showSkeleton) {
    return (
      <RequireAuth>
        <DashboardLayout>
          <div className="px-6 py-8 lg:px-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-2 h-8 w-16" />
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-64 w-full rounded-lg" />
            </div>
          </div>
        </DashboardLayout>
      </RequireAuth>
    );
  }

  if (!status?.connected || !status.services.searchConsole) {
    return (
      <RequireAuth>
        <DashboardLayout>
          <div className="mx-auto max-w-2xl px-6 py-16 text-center">
            <Globe2 className="mx-auto size-12 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Search Console Not Connected
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Connect your Google account in Settings to view Search Console data.
            </p>
            <Button className="mt-6" onClick={() => (window.location.href = "/setting")}>
              Go to Settings
            </Button>
          </div>
        </DashboardLayout>
      </RequireAuth>
    );
  }

  const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0);
  const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0);
  const avgPosition = rows.length > 0
    ? (rows.reduce((sum, r) => sum + r.position, 0) / rows.length).toFixed(1)
    : "0";
  const avgCtr = totalImpressions > 0
    ? ((totalClicks / totalImpressions) * 100).toFixed(2)
    : "0";

  const chartData = dailyRows.map((r) => ({
    label: formatScDate(r.date),
    clicks: r.clicks,
    impressions: r.impressions,
  }));

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="px-6 py-8 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Google Search Console
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Search performance data for {startDate} to {endDate}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={fetching}>
              <RefreshCw className={`size-4 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Site selector */}
          {sites.length > 0 && (
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Property
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                {sites.map((s) => (
                  <option key={s.siteUrl} value={s.siteUrl}>
                    {s.siteUrl}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stats cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-fuchsia-600 dark:text-fuchsia-400" },
              { label: "Impressions", value: totalImpressions.toLocaleString(), icon: Eye, color: "text-blue-600 dark:text-blue-400" },
              { label: "Avg CTR", value: `${avgCtr}%`, icon: Target, color: "text-purple-600 dark:text-purple-400" },
              { label: "Avg Position", value: avgPosition, icon: TrendingUp, color: "text-orange-600 dark:text-orange-400" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${stat.color}`} />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {stat.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Date range selector */}
          <div className="mb-4 flex flex-wrap gap-2">
            {DATE_RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setRangeDays(r.days)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  rangeDays === r.days
                    ? "bg-fuchsia-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Clicks & Impressions line chart */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Clicks & Impressions — {DATE_RANGES.find((r) => r.days === rangeDays)?.label ?? "30 Days"}
                </h2>
              </div>
              <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {dailyRows.length} data points
              </Badge>
            </div>
            {fetching ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-fuchsia-500" />
              </div>
            ) : chartData.length > 0 ? (
              <div className="px-6 py-6">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d946ef" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#d946ef" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="imprGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      interval={Math.max(Math.floor(chartData.length / 8), 1)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                      labelStyle={{ color: "#64748b", marginBottom: "4px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#d946ef"
                      strokeWidth={2}
                      fill="url(#clicksGradient)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#d946ef" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#imprGradient)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#3b82f6" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                No time-series data found for this period.
              </div>
            )}
          </div>

          {/* Search queries table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Top Search Queries
                </h2>
              </div>
              <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {rows.length} queries
              </Badge>
            </div>
            {fetching ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-fuchsia-500" />
              </div>
            ) : rows.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                No search query data found for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                        Query
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                        Clicks
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                        Impressions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                        CTR
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                        Position
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {rows.map((row, i) => (
                      <tr
                        key={`${row.query}-${i}`}
                        className="transition-colors hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10"
                      >
                        <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">
                          {row.query}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-fuchsia-600 dark:text-fuchsia-400">
                          {row.clicks.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">
                          {row.impressions.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">
                          {(row.ctr * 100).toFixed(2)}%
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">
                          {row.position.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
