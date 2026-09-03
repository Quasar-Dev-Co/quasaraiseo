"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3, Loader2, AlertCircle, TrendingUp, TrendingDown,
  Users, Eye, Clock, RefreshCw, Activity, Globe2, Smartphone,
  Monitor, Tablet, FileSearch, MapPin, Navigation, Radio,
  ArrowUpRight, ArrowDownRight, Zap, Target, MousePointerClick,
  Layers, Search,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, BarChart, Bar,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinLoading } from "@/lib/use-min-loading";
import {
  googleApi,
  type AnalyticsProperty,
  type AnalyticsData,
  type AnalyticsReport,
  type RealtimeReport,
  type GoogleStatus,
} from "@/lib/google-api";

/* ── helpers ────────────────────────────────────────────────────────────── */

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatGaDate(gaDate: string): string {
  if (!gaDate) return gaDate;
  if (gaDate.length === 8) {
    const y = gaDate.slice(0, 4);
    const m = gaDate.slice(4, 6);
    const d = gaDate.slice(6, 8);
    const date = new Date(`${y}-${m}-${d}`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const d = new Date(gaDate);
  if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return gaDate;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatPctChange(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0) return { text: "—", positive: false };
  const pct = ((current - previous) / previous) * 100;
  return { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

/* ── constants ──────────────────────────────────────────────────────────── */

const DATE_RANGES = [
  { label: "7 Days", days: 7 },
  { label: "14 Days", days: 14 },
  { label: "28 Days", days: 28 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
];

type TabId = "pages" | "landing" | "countries" | "devices" | "sources" | "channels";

const TABS: Array<{
  id: TabId; label: string; icon: typeof FileSearch; dimension: string;
}> = [
  { id: "pages", label: "Top Pages", icon: FileSearch, dimension: "pagePath" },
  { id: "landing", label: "Landing Pages", icon: Navigation, dimension: "landingPagePlusQueryString" },
  { id: "countries", label: "Countries", icon: Globe2, dimension: "country" },
  { id: "devices", label: "Devices", icon: Smartphone, dimension: "deviceCategory" },
  { id: "sources", label: "Sources", icon: Search, dimension: "sessionSourceMedium" },
  { id: "channels", label: "Channels", icon: Layers, dimension: "sessionDefaultChannelGroup" },
];

const CHANNEL_COLORS: Record<string, string> = {
  "Organic Search": "#d946ef",
  "Direct": "#3b82f6",
  "Referral": "#10b981",
  "Social": "#f59e0b",
  "Email": "#8b5cf6",
  "Paid Search": "#ef4444",
  "Affiliates": "#06b6d4",
  "Other": "#64748b",
};

const PIE_COLORS = ["#d946ef", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#64748b"];

/* ── component ──────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [properties, setProperties] = useState<AnalyticsProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [prevData, setPrevData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinLoading(loading, 800);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState(28);
  const [activeTab, setActiveTab] = useState<TabId>("pages");
  const [reportData, setReportData] = useState<AnalyticsReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Realtime
  const [realtime, setRealtime] = useState<RealtimeReport | null>(null);
  const [realtimeLoading, setRealtimeLoading] = useState(false);

  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - (rangeDays - 1) * 24 * 60 * 60 * 1000));
  const prevEndDate = formatDate(new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000));
  const prevStartDate = formatDate(new Date(Date.now() - (2 * rangeDays - 1) * 24 * 60 * 60 * 1000));

  /* ── initial load ─────────────────────────────────────────────────── */

  const fetchStatus = useCallback(async () => {
    try {
      const s = await googleApi.getStatus();
      setStatus(s);
      if (s.connected && s.services.analytics) {
        const props = await googleApi.getAnalyticsProperties();
        setProperties(props);
        if (props.length > 0 && !selectedProperty) {
          setSelectedProperty(props[0].propertyId);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [selectedProperty]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* ── fetch analytics (current + previous) ─────────────────────────── */

  const fetchAnalytics = useCallback(async () => {
    if (!selectedProperty) return;
    setFetching(true);
    setError(null);
    try {
      const [current, previous] = await Promise.all([
        googleApi.getAnalyticsData(selectedProperty, startDate, endDate),
        googleApi.getAnalyticsData(selectedProperty, prevStartDate, prevEndDate),
      ]);
      setData(current);
      setPrevData(previous);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch analytics");
    } finally {
      setFetching(false);
    }
  }, [selectedProperty, startDate, endDate, prevStartDate, prevEndDate]);

  useEffect(() => {
    if (selectedProperty) fetchAnalytics();
  }, [selectedProperty, fetchAnalytics, rangeDays]);

  /* ── fetch dimension report when tab changes ──────────────────────── */

  const fetchReport = useCallback(async () => {
    if (!selectedProperty) return;
    const tab = TABS.find(t => t.id === activeTab);
    if (!tab) return;
    setReportLoading(true);
    try {
      const report = await googleApi.getAnalyticsReport(selectedProperty, {
        startDate, endDate,
        dimensions: [tab.dimension],
        metrics: ["sessions", "totalUsers", "screenPageViews", "averageSessionDuration", "bounceRate", "engagementRate"],
        orderBy: "sessions",
        orderDesc: true,
        limit: 50,
      });
      setReportData(report);
    } catch {
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  }, [selectedProperty, activeTab, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* ── fetch realtime ───────────────────────────────────────────────── */

  const fetchRealtime = useCallback(async () => {
    if (!selectedProperty) return;
    setRealtimeLoading(true);
    try {
      const rt = await googleApi.getRealtimeReport(selectedProperty);
      setRealtime(rt);
    } catch {
      setRealtime(null);
    } finally {
      setRealtimeLoading(false);
    }
  }, [selectedProperty]);

  useEffect(() => {
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchRealtime]);

  /* ── computed stats ───────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const totalsMap: Record<string, number> = {};
    data?.totals.forEach(t => { totalsMap[t.metric] = t.value; });
    const prevMap: Record<string, number> = {};
    prevData?.totals.forEach(t => { prevMap[t.metric] = t.value; });

    return {
      sessions: totalsMap.sessions ?? 0,
      users: totalsMap.totalUsers ?? 0,
      pageViews: totalsMap.pageViews ?? 0,
      avgDuration: totalsMap.avgSessionDuration ?? 0,
      bounceRate: totalsMap.bounceRate ?? 0,
      prevSessions: prevMap.sessions ?? 0,
      prevUsers: prevMap.totalUsers ?? 0,
      prevPageViews: prevMap.pageViews ?? 0,
      prevAvgDuration: prevMap.avgSessionDuration ?? 0,
      prevBounceRate: prevMap.bounceRate ?? 0,
    };
  }, [data, prevData]);

  const chartData = useMemo(() =>
    (data?.rows ?? []).map(row => ({
      label: formatGaDate(row.date),
      sessions: row.sessions,
      users: row.users,
      pageViews: row.pageViews,
      engagementRate: row.bounceRate > 0 ? (1 - row.bounceRate) * 100 : 0,
    })), [data]);

  /* ── channel breakdown for pie chart ──────────────────────────────── */

  const [channelReport, setChannelReport] = useState<AnalyticsReport | null>(null);

  useEffect(() => {
    if (!selectedProperty) return;
    googleApi.getAnalyticsReport(selectedProperty, {
      startDate, endDate,
      dimensions: ["sessionDefaultChannelGroup"],
      metrics: ["sessions"],
      orderBy: "sessions",
      orderDesc: true,
      limit: 10,
    }).then(setChannelReport).catch(() => setChannelReport(null));
  }, [selectedProperty, startDate, endDate]);

  const channelPieData = useMemo(() => {
    if (!channelReport) return [];
    return channelReport.rows.map(r => ({
      name: r.dimensionValues[0] ?? "Unknown",
      value: r.metricValues[0] ?? 0,
    })).filter(d => d.value > 0);
  }, [channelReport]);

  /* ── device breakdown ─────────────────────────────────────────────── */

  const [deviceReport, setDeviceReport] = useState<AnalyticsReport | null>(null);

  useEffect(() => {
    if (!selectedProperty) return;
    googleApi.getAnalyticsReport(selectedProperty, {
      startDate, endDate,
      dimensions: ["deviceCategory"],
      metrics: ["sessions", "engagementRate", "bounceRate"],
      orderBy: "sessions",
      orderDesc: true,
      limit: 10,
    }).then(setDeviceReport).catch(() => setDeviceReport(null));
  }, [selectedProperty, startDate, endDate]);

  /* ── loading / not connected ──────────────────────────────────────── */

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

  if (!status?.connected || !status.services.analytics) {
    return (
      <RequireAuth>
        <DashboardLayout>
          <div className="mx-auto max-w-2xl px-6 py-16 text-center">
            <BarChart3 className="mx-auto size-12 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Google Analytics Not Connected
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Connect your Google account in Settings to view Analytics data.
            </p>
            <Button className="mt-6" onClick={() => (window.location.href = "/setting")}>
              Go to Settings
            </Button>
          </div>
        </DashboardLayout>
      </RequireAuth>
    );
  }

  /* ── delta badge ──────────────────────────────────────────────────── */

  const DeltaBadge = ({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) => {
    if (previous === 0) return <span className="text-[10px] font-bold text-slate-400">—</span>;
    const { text, positive } = formatPctChange(current, previous);
    // For bounce rate, lower is better → invert
    const isGood = invert ? !positive : positive;
    return (
      <span className={`flex items-center gap-0.5 text-[10px] font-bold ${isGood ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-red-500"}`}>
        {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
        {text}
      </span>
    );
  };

  const StatCard = ({ label, value, icon: Icon, color, current, previous, invert }: {
    label: string; value: string; icon: typeof TrendingUp; color: string;
    current: number; previous: number; invert?: boolean;
  }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${color}`} />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span>
        </div>
        <DeltaBadge current={current} previous={previous} invert={invert} />
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
    </div>
  );

  /* ── render ──────────────────────────────────────────────────────── */

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="px-6 py-8 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Google Analytics
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {startDate} to {endDate} · vs previous {rangeDays} days
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Realtime badge */}
              <div className="flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50/80 px-3 py-2 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10">
                <Radio className={`size-4 text-fuchsia-500 ${realtimeLoading ? "animate-pulse" : ""}`} />
                <span className="text-sm font-black text-fuchsia-700 dark:text-fuchsia-400">
                  {realtime?.totalActiveUsers ?? 0}
                </span>
                <span className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400">live now</span>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={fetching}>
                <RefreshCw className={`size-4 ${fetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Property selector */}
          {properties.length > 0 && (
            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                {properties.map(p => (
                  <option key={p.propertyId} value={p.propertyId}>{p.displayName} ({p.propertyId})</option>
                ))}
              </select>
            </div>
          )}

          {/* Date range selector */}
          <div className="mb-6 flex flex-wrap gap-2">
            {DATE_RANGES.map(r => (
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

          {/* Stats cards with comparison */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Sessions" value={stats.sessions.toLocaleString()} icon={Activity} color="text-fuchsia-600 dark:text-fuchsia-400" current={stats.sessions} previous={stats.prevSessions} />
            <StatCard label="Users" value={stats.users.toLocaleString()} icon={Users} color="text-blue-600 dark:text-blue-400" current={stats.users} previous={stats.prevUsers} />
            <StatCard label="Page Views" value={stats.pageViews.toLocaleString()} icon={Eye} color="text-purple-600 dark:text-purple-400" current={stats.pageViews} previous={stats.prevPageViews} />
            <StatCard label="Avg Duration" value={formatDuration(stats.avgDuration)} icon={Clock} color="text-orange-600 dark:text-orange-400" current={stats.avgDuration} previous={stats.prevAvgDuration} />
          </div>

          {/* Second row: engagement stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Bounce Rate" value={`${(stats.bounceRate * 100).toFixed(1)}%`} icon={TrendingDown} color="text-red-500" current={stats.bounceRate * 100} previous={stats.prevBounceRate * 100} invert />
            <StatCard label="Engagement Rate" value={`${((1 - stats.bounceRate) * 100).toFixed(1)}%`} icon={Target} color="text-fuchsia-600 dark:text-fuchsia-400" current={(1 - stats.bounceRate) * 100} previous={(1 - stats.prevBounceRate) * 100} />
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <MousePointerClick className="size-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pages/Session</span>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                {stats.sessions > 0 ? (stats.pageViews / stats.sessions).toFixed(2) : "0"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Radio className="size-4 text-fuchsia-500" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Now</span>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                {realtime?.totalActiveUsers ?? 0}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">{realtime?.totalPageViews ?? 0} page views</div>
            </div>
          </div>

          {/* Charts row: Sessions + Channel pie */}
          <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Sessions chart */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-slate-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sessions & Users — {DATE_RANGES.find(r => r.days === rangeDays)?.label ?? "28 Days"}
                  </h2>
                </div>
                <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {data?.rows.length ?? 0} days
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
                        <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d946ef" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#d946ef" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={Math.max(Math.floor(chartData.length / 8), 1)} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 600 }} labelStyle={{ color: "#64748b", marginBottom: "4px" }} />
                      <Area type="monotone" dataKey="sessions" stroke="#d946ef" strokeWidth={2} fill="url(#sessionsGrad)" dot={false} activeDot={{ r: 5, fill: "#d946ef" }} />
                      <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#usersGrad)" dot={false} activeDot={{ r: 5, fill: "#3b82f6" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-slate-400">No data found for this period.</div>
              )}
            </div>

            {/* Channel pie chart */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-fuchsia-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Traffic Channels</h2>
                </div>
              </div>
              <div className="p-6">
                {channelPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={channelPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                          {channelPieData.map((entry, i) => (
                            <Cell key={i} fill={CHANNEL_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-1.5">
                      {channelPieData.slice(0, 6).map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full" style={{ background: CHANNEL_COLORS[d.name] ?? PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{d.name}</span>
                          </div>
                          <span className="font-bold text-slate-500 dark:text-slate-400">{d.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-400">No channel data</div>
                )}
              </div>
            </div>
          </div>

          {/* Device breakdown + Engagement chart */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* Device breakdown */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Smartphone className="size-4 text-blue-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Device Breakdown</h2>
                </div>
              </div>
              <div className="p-5">
                {deviceReport && deviceReport.rows.length > 0 ? (
                  <div className="space-y-3">
                    {deviceReport.rows.map((row, i) => {
                      const device = row.dimensionValues[0] ?? "Unknown";
                      const sessions = row.metricValues[0] ?? 0;
                      const engagement = row.metricValues[1] ?? 0;
                      const bounce = row.metricValues[2] ?? 0;
                      const totalSessions = deviceReport.totals.find(t => t.metric === "sessions")?.value ?? 1;
                      const pct = (sessions / totalSessions) * 100;
                      const Icon = device === "mobile" ? Smartphone : device === "desktop" ? Monitor : device === "tablet" ? Tablet : Globe2;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Icon className="size-3.5 text-slate-400" />
                              <span className="font-bold capitalize text-slate-700 dark:text-slate-300">{device}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-500 dark:text-slate-400">{sessions.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                            <span>Engagement: {(engagement * 100).toFixed(0)}%</span>
                            <span>Bounce: {(bounce * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center text-xs text-slate-400">No device data</p>
                )}
              </div>
            </div>

            {/* Engagement rate over time */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-fuchsia-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Engagement Rate Trend</h2>
                </div>
              </div>
              <div className="p-6">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={Math.max(Math.floor(chartData.length / 6), 1)} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 600 }} />
                      <Line type="monotone" dataKey="engagementRate" stroke="#d946ef" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-400">No engagement data</div>
                )}
              </div>
            </div>
          </div>

          {/* Page views bar chart */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-blue-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daily Page Views</h2>
              </div>
            </div>
            <div className="p-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={Math.max(Math.floor(chartData.length / 8), 1)} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 600 }} />
                    <Bar dataKey="pageViews" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-slate-400">No page view data</div>
              )}
            </div>
          </div>

          {/* Dimension tabs */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2 dark:border-white/5">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                      activeTab === tab.id
                        ? "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"
                        : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {reportLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-fuchsia-500" />
              </div>
            ) : reportData && reportData.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 capitalize">
                        {TABS.find(t => t.id === activeTab)?.label.replace("Top ", "").replace(" Pages", "").replace("Landing ", "")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Sessions</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Users</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Page Views</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Avg Duration</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Bounce</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Engagement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {reportData.rows.slice(0, 25).map((row, i) => (
                      <tr key={i} className="transition-colors hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10">
                        <td className="max-w-[300px] truncate px-6 py-3 font-semibold text-slate-900 dark:text-white">
                          {row.dimensionValues[0] ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-fuchsia-600 dark:text-fuchsia-400">{row.metricValues[0]?.toLocaleString() ?? 0}</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{row.metricValues[1]?.toLocaleString() ?? 0}</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{row.metricValues[2]?.toLocaleString() ?? 0}</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{formatDuration(row.metricValues[3] ?? 0)}</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{((row.metricValues[4] ?? 0) * 100).toFixed(1)}%</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{((row.metricValues[5] ?? 0) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                No {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} data found.
              </div>
            )}
          </div>

          {/* Realtime details */}
          {realtime && realtime.totalActiveUsers > 0 && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-fuchsia-200 bg-fuchsia-50/30 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/5">
              <div className="border-b border-fuchsia-100 px-6 py-4 dark:border-fuchsia-400/10">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-fuchsia-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Realtime — Active Users Right Now</h2>
                  <Badge className="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-400">{realtime.totalActiveUsers} active</Badge>
                </div>
              </div>
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {realtime.byCountry.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <Globe2 className="size-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{c.country}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-black text-fuchsia-600 dark:text-fuchsia-400">{c.activeUsers}</span>
                        <span className="text-[9px] text-slate-400">{c.pageViews} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Daily data table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daily Traffic Breakdown</h2>
            </div>
            {fetching ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-fuchsia-500" />
              </div>
            ) : data && data.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Sessions</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Users</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Page Views</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Avg Duration</th>
                      <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {[...data.rows].reverse().map((row, i) => (
                      <tr key={i} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">{formatGaDate(row.date)}</td>
                        <td className="px-6 py-3 text-right font-bold text-fuchsia-600 dark:text-fuchsia-400">{row.sessions.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{row.users.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{row.pageViews.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{formatDuration(row.avgSessionDuration)}</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{(row.bounceRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">No daily data available.</div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
