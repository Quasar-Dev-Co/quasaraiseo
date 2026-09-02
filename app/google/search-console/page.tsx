"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Globe2, Loader2, AlertCircle, Search, TrendingUp, TrendingDown,
  MousePointerClick, Eye, Target, RefreshCw, MapPin, Smartphone,
  Monitor, Tablet, Sparkles, FileSearch, ArrowUpRight, ArrowDownRight,
  Zap, AlertTriangle, CheckCircle2, XCircle, Clock, Link2, Plus, Trash2,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, BarChart, Bar,
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
  type SearchConsoleDimensionRow,
  type GoogleStatus,
  type SitemapInfo,
  type UrlInspectionResult,
} from "@/lib/google-api";

/* ── helpers ────────────────────────────────────────────────────────────── */

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatScDate(dateStr: string): string {
  if (!dateStr) return dateStr;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPctChange(current: number, previous: number): { text: string; positive: boolean; isGood: boolean } {
  if (previous === 0) return { text: "—", positive: false, isGood: false };
  const pct = ((current - previous) / previous) * 100;
  const positive = pct >= 0;
  // For position, lower is better — so "positive" change is actually bad
  return { text: `${positive ? "+" : ""}${pct.toFixed(1)}%`, positive, isGood: positive };
}

function formatPosChange(current: number, previous: number): { text: string; isGood: boolean } {
  const diff = current - previous;
  // Lower position is better, so negative diff = improvement
  const isGood = diff < 0;
  return { text: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}`, isGood };
}

/* ── constants ──────────────────────────────────────────────────────────── */

const DATE_RANGES = [
  { label: "7 Days", days: 7 },
  { label: "14 Days", days: 14 },
  { label: "28 Days", days: 28 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
];

const SEARCH_TYPES = [
  { label: "Web", value: "web" },
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
  { label: "News", value: "news" },
  { label: "Discover", value: "discover" },
  { label: "Google News", value: "googleNews" },
];

type TabId = "queries" | "pages" | "countries" | "devices" | "appearance";

const TABS: Array<{ id: TabId; label: string; icon: typeof Search; dimension: string }> = [
  { id: "queries", label: "Queries", icon: Search, dimension: "query" },
  { id: "pages", label: "Pages", icon: FileSearch, dimension: "page" },
  { id: "countries", label: "Countries", icon: MapPin, dimension: "country" },
  { id: "devices", label: "Devices", icon: Smartphone, dimension: "device" },
  { id: "appearance", label: "Appearance", icon: Sparkles, dimension: "searchAppearance" },
];

/* ── component ──────────────────────────────────────────────────────────── */

export default function SearchConsolePage() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [sites, setSites] = useState<SearchConsoleSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinLoading(loading, 800);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState(28);
  const [searchType, setSearchType] = useState("web");
  const [activeTab, setActiveTab] = useState<TabId>("queries");

  // Data
  const [queryRows, setQueryRows] = useState<SearchConsoleRow[]>([]);
  const [dailyRows, setDailyRows] = useState<SearchConsoleDailyRow[]>([]);
  const [dimensionRows, setDimensionRows] = useState<SearchConsoleDimensionRow[]>([]);
  const [prevQueryRows, setPrevQueryRows] = useState<SearchConsoleRow[]>([]);
  const [prevDailyRows, setPrevDailyRows] = useState<SearchConsoleDailyRow[]>([]);

  // URL Inspection
  const [inspectUrlInput, setInspectUrlInput] = useState("");
  const [inspectResult, setInspectResult] = useState<UrlInspectionResult | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Sitemaps
  const [sitemaps, setSitemaps] = useState<SitemapInfo[]>([]);
  const [sitemapsLoading, setSitemapsLoading] = useState(false);
  const [sitemapsError, setSitemapsError] = useState<string | null>(null);
  const [newSitemapPath, setNewSitemapPath] = useState("");

  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - (rangeDays - 1) * 24 * 60 * 60 * 1000));
  const prevEndDate = formatDate(new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000));
  const prevStartDate = formatDate(new Date(Date.now() - (2 * rangeDays - 1) * 24 * 60 * 60 * 1000));

  /* ── initial load ─────────────────────────────────────────────────── */

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

  /* ── fetch analytics (current + previous period) ─────────────────── */

  const fetchAnalytics = useCallback(async () => {
    if (!selectedSite) return;
    setFetching(true);
    setError(null);
    try {
      const [queryData, dailyData, prevQueryData, prevDailyData] = await Promise.all([
        googleApi.getSearchConsoleAnalytics(selectedSite, startDate, endDate),
        googleApi.getSearchConsoleDaily(selectedSite, startDate, endDate),
        googleApi.getSearchConsoleAnalytics(selectedSite, prevStartDate, prevEndDate),
        googleApi.getSearchConsoleDaily(selectedSite, prevStartDate, prevEndDate),
      ]);
      setQueryRows(queryData);
      setDailyRows(dailyData);
      setPrevQueryRows(prevQueryData);
      setPrevDailyRows(prevDailyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch analytics");
    } finally {
      setFetching(false);
    }
  }, [selectedSite, startDate, endDate, prevStartDate, prevEndDate]);

  useEffect(() => {
    if (selectedSite) {
      fetchAnalytics();
    }
  }, [selectedSite, fetchAnalytics, rangeDays]);

  /* ── fetch dimension data when tab changes ───────────────────────── */

  const fetchDimensionData = useCallback(async () => {
    if (!selectedSite || activeTab === "queries") return;
    const tab = TABS.find(t => t.id === activeTab);
    if (!tab) return;
    try {
      const data = await googleApi.getSearchConsoleByDimension(
        selectedSite, startDate, endDate,
        { dimensions: [tab.dimension], searchType: searchType !== "web" ? searchType : undefined, rowLimit: 100 },
      );
      setDimensionRows(data);
    } catch (e) {
      setDimensionRows([]);
    }
  }, [selectedSite, activeTab, startDate, endDate, searchType]);

  useEffect(() => {
    fetchDimensionData();
  }, [fetchDimensionData]);

  /* ── fetch sitemaps ──────────────────────────────────────────────── */

  const fetchSitemaps = useCallback(async () => {
    if (!selectedSite) return;
    setSitemapsLoading(true);
    setSitemapsError(null);
    try {
      const data = await googleApi.getSitemaps(selectedSite);
      setSitemaps(data);
    } catch (e) {
      setSitemapsError(e instanceof Error ? e.message : "Failed to fetch sitemaps");
    } finally {
      setSitemapsLoading(false);
    }
  }, [selectedSite]);

  /* ── computed stats ──────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const totalClicks = queryRows.reduce((s, r) => s + r.clicks, 0);
    const totalImpressions = queryRows.reduce((s, r) => s + r.impressions, 0);
    const avgPosition = queryRows.length > 0
      ? queryRows.reduce((s, r) => s + r.position, 0) / queryRows.length
      : 0;
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) : 0;

    const prevClicks = prevQueryRows.reduce((s, r) => s + r.clicks, 0);
    const prevImpressions = prevQueryRows.reduce((s, r) => s + r.impressions, 0);
    const prevPosition = prevQueryRows.length > 0
      ? prevQueryRows.reduce((s, r) => s + r.position, 0) / prevQueryRows.length
      : 0;
    const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) : 0;

    return { totalClicks, totalImpressions, avgPosition, avgCtr, prevClicks, prevImpressions, prevPosition, prevCtr };
  }, [queryRows, prevQueryRows]);

  const chartData = useMemo(() =>
    dailyRows.map((r) => ({
      label: formatScDate(r.date),
      clicks: r.clicks,
      impressions: r.impressions,
    })), [dailyRows]);

  /* ── opportunities ───────────────────────────────────────────────── */

  const opportunities = useMemo(() => {
    // CTR opportunities: ranking in top 20 with impressions but low CTR
    // Thresholds are adaptive — lower bars for small sites
    const ctrOpps = queryRows
      .filter(r => r.position <= 20 && r.impressions >= 10 && r.ctr < 0.03)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    // Page 2 keywords: position 11-30 with some impressions
    const page2Opps = queryRows
      .filter(r => r.position > 10 && r.position <= 30 && r.impressions >= 10)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    // Rising keywords: compare current vs previous
    const rising: Array<{ query: string; currentClicks: number; prevClicks: number; currentPos: number; prevPos: number }> = [];
    const declining: Array<{ query: string; currentClicks: number; prevClicks: number; currentPos: number; prevPos: number }> = [];

    const prevMap = new Map(prevQueryRows.map(r => [r.query, r]));
    queryRows.forEach(r => {
      const prev = prevMap.get(r.query);
      if (!prev) {
        // New query this period — rising if it has impressions
        if (r.impressions >= 10) {
          rising.push({ query: r.query, currentClicks: r.clicks, prevClicks: 0, currentPos: r.position, prevPos: 999 });
        }
        return;
      }
      // Track by impressions too (not just clicks) since small sites may have few clicks
      const imprDiff = r.impressions - prev.impressions;
      const clickDiff = r.clicks - prev.clicks;

      // Rising: impressions grew >= 15% OR clicks grew >= 15%
      if (prev.impressions > 0) {
        const imprGrowth = (imprDiff / prev.impressions) * 100;
        const clickGrowth = prev.clicks > 0 ? (clickDiff / prev.clicks) * 100 : 0;
        if (imprGrowth >= 15 || clickGrowth >= 15) {
          rising.push({ query: r.query, currentClicks: r.clicks, prevClicks: prev.clicks, currentPos: r.position, prevPos: prev.position });
        }
      }
      // Declining: impressions dropped >= 15% OR clicks dropped >= 15%
      if (prev.impressions > 0) {
        const imprDecline = Math.abs((imprDiff / prev.impressions) * 100);
        const clickDecline = prev.clicks > 0 ? Math.abs((clickDiff / prev.clicks) * 100) : 0;
        if (imprDecline >= 15 || clickDecline >= 15) {
          declining.push({ query: r.query, currentClicks: r.clicks, prevClicks: prev.clicks, currentPos: r.position, prevPos: prev.position });
        }
      }
    });

    rising.sort((a, b) => (b.currentClicks - b.prevClicks) - (a.currentClicks - a.prevClicks));
    declining.sort((a, b) => (a.currentClicks - a.prevClicks) - (b.currentClicks - b.prevClicks));

    return {
      ctrOpps,
      page2Opps,
      rising: rising.slice(0, 8),
      declining: declining.slice(0, 8),
    };
  }, [queryRows, prevQueryRows]);

  /* ── URL inspection handler ──────────────────────────────────────── */

  const handleInspect = async () => {
    if (!selectedSite || !inspectUrlInput.trim()) return;
    setInspectLoading(true);
    setInspectError(null);
    setInspectResult(null);
    try {
      let url = inspectUrlInput.trim();
      if (!url.startsWith("http")) url = `https://${url}`;
      const result = await googleApi.inspectUrl(selectedSite, url);
      setInspectResult(result);
    } catch (e) {
      setInspectError(e instanceof Error ? e.message : "Inspection failed");
    } finally {
      setInspectLoading(false);
    }
  };

  /* ── sitemap handlers ────────────────────────────────────────────── */

  const handleSubmitSitemap = async () => {
    if (!selectedSite || !newSitemapPath.trim()) return;
    try {
      await googleApi.submitSitemap(selectedSite, newSitemapPath.trim());
      setNewSitemapPath("");
      await fetchSitemaps();
    } catch (e) {
      setSitemapsError(e instanceof Error ? e.message : "Failed to submit sitemap");
    }
  };

  const handleDeleteSitemap = async (path: string) => {
    if (!selectedSite) return;
    try {
      await googleApi.deleteSitemap(selectedSite, path);
      await fetchSitemaps();
    } catch (e) {
      setSitemapsError(e instanceof Error ? e.message : "Failed to delete sitemap");
    }
  };

  /* ── loading skeleton ────────────────────────────────────────────── */

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

  /* ── not connected ───────────────────────────────────────────────── */

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

  /* ── delta badge component ───────────────────────────────────────── */

  const DeltaBadge = ({ current, previous, isPosition = false }: { current: number; previous: number; isPosition?: boolean }) => {
    if (previous === 0) return <span className="text-[10px] font-bold text-slate-400">—</span>;
    if (isPosition) {
      const { text, isGood } = formatPosChange(current, previous);
      return (
        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${isGood ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-red-500"}`}>
          {isGood ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {text}
        </span>
      );
    }
    const { text, positive, isGood } = formatPctChange(current, previous);
    return (
      <span className={`flex items-center gap-0.5 text-[10px] font-bold ${isGood ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-red-500"}`}>
        {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
        {text}
      </span>
    );
  };

  /* ── stat card ───────────────────────────────────────────────────── */

  const StatCard = ({ label, value, icon: Icon, color, current, previous, isPosition }: {
    label: string; value: string; icon: typeof TrendingUp; color: string;
    current: number; previous: number; isPosition?: boolean;
  }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${color}`} />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span>
        </div>
        <DeltaBadge current={current} previous={previous} isPosition={isPosition} />
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
                Google Search Console
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {startDate} to {endDate} · vs previous {rangeDays} days
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

          {/* Controls row */}
          <div className="mb-6 flex flex-wrap items-end gap-4">
            {sites.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Property
                </label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  {sites.map((s) => (
                    <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Search Type
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                {SEARCH_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date range selector */}
          <div className="mb-6 flex flex-wrap gap-2">
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

          {/* Stats cards with comparison */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Clicks" value={stats.totalClicks.toLocaleString()} icon={MousePointerClick} color="text-fuchsia-600 dark:text-fuchsia-400" current={stats.totalClicks} previous={stats.prevClicks} />
            <StatCard label="Impressions" value={stats.totalImpressions.toLocaleString()} icon={Eye} color="text-blue-600 dark:text-blue-400" current={stats.totalImpressions} previous={stats.prevImpressions} />
            <StatCard label="Avg CTR" value={`${(stats.avgCtr * 100).toFixed(2)}%`} icon={Target} color="text-purple-600 dark:text-purple-400" current={stats.avgCtr * 100} previous={stats.prevCtr * 100} />
            <StatCard label="Avg Position" value={stats.avgPosition.toFixed(1)} icon={TrendingUp} color="text-orange-600 dark:text-orange-400" current={stats.avgPosition} previous={stats.prevPosition} isPosition />
          </div>

          {/* Clicks & Impressions chart */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Clicks & Impressions — {DATE_RANGES.find(r => r.days === rangeDays)?.label ?? "28 Days"}
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
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={Math.max(Math.floor(chartData.length / 8), 1)} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 600 }} labelStyle={{ color: "#64748b", marginBottom: "4px" }} />
                    <Area type="monotone" dataKey="clicks" stroke="#d946ef" strokeWidth={2} fill="url(#clicksGradient)" dot={false} activeDot={{ r: 5, fill: "#d946ef" }} />
                    <Area type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} fill="url(#imprGradient)" dot={false} activeDot={{ r: 5, fill: "#3b82f6" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                No time-series data found for this period.
              </div>
            )}
          </div>

          {/* Opportunities section */}
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <Zap className="size-5 text-fuchsia-500" />
              SEO Opportunities
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* CTR Opportunities */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-fuchsia-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">CTR Opportunities</h3>
                  </div>
                  <Badge className="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-400">{opportunities.ctrOpps.length}</Badge>
                </div>
                <div className="p-3">
                  {opportunities.ctrOpps.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">No CTR opportunities found</p>
                  ) : (
                    <div className="space-y-1">
                      {opportunities.ctrOpps.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{r.query}</p>
                            <p className="text-[10px] text-slate-400">Pos {r.position.toFixed(1)} · {r.impressions.toLocaleString()} impressions</p>
                          </div>
                          <span className="ml-2 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-400/10 dark:text-red-400">
                            CTR {(r.ctr * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 px-3 text-[10px] text-slate-400">
                Position 1-20 with impressions but CTR below 3% — improve title & meta description
              </p>
                </div>
              </div>

              {/* Page 2 Opportunities */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Page 2 Keywords</h3>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-400">{opportunities.page2Opps.length}</Badge>
                </div>
                <div className="p-3">
                  {opportunities.page2Opps.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">No page 2 keywords found</p>
                  ) : (
                    <div className="space-y-1">
                      {opportunities.page2Opps.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{r.query}</p>
                            <p className="text-[10px] text-slate-400">Pos {r.position.toFixed(1)} · {r.impressions.toLocaleString()} impressions</p>
                          </div>
                          <span className="ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                            Near page 1
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 px-3 text-[10px] text-slate-400">
                Position 11-30 with impressions — close to breaking into page 1
              </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rising / Declining */}
          <div className="mb-8 grid gap-4 lg:grid-cols-2">
            {/* Rising */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-fuchsia-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rising Keywords</h3>
                </div>
                <Badge className="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-400">{opportunities.rising.length}</Badge>
              </div>
              <div className="p-3">
                {opportunities.rising.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No rising keywords detected</p>
                ) : (
                  <div className="space-y-1">
                    {opportunities.rising.map((r, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{r.query}</p>
                          <p className="text-[10px] text-slate-400">
                            {r.prevClicks} → {r.currentClicks} clicks · Pos {r.prevPos === 999 ? "—" : r.prevPos.toFixed(1)} → {r.currentPos.toFixed(1)}
                          </p>
                        </div>
                        <span className="ml-2 flex items-center gap-0.5 text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
                          <ArrowUpRight className="size-3" />
                          {r.prevClicks === 0 ? "New" : `${Math.round(((r.currentClicks - r.prevClicks) / r.prevClicks) * 100)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Declining */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <TrendingDown className="size-4 text-red-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Declining Keywords</h3>
                </div>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-400">{opportunities.declining.length}</Badge>
              </div>
              <div className="p-3">
                {opportunities.declining.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No declining keywords detected</p>
                ) : (
                  <div className="space-y-1">
                    {opportunities.declining.map((r, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{r.query}</p>
                          <p className="text-[10px] text-slate-400">
                            {r.prevClicks} → {r.currentClicks} clicks · Pos {r.prevPos.toFixed(1)} → {r.currentPos.toFixed(1)}
                          </p>
                        </div>
                        <span className="ml-2 flex items-center gap-0.5 text-[10px] font-bold text-red-500">
                          <ArrowDownRight className="size-3" />
                          {Math.round(Math.abs(((r.currentClicks - r.prevClicks) / r.prevClicks) * 100))}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance table with tabs */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-2 dark:border-white/5">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
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

            {/* Table content */}
            {fetching ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-fuchsia-500" />
              </div>
            ) : activeTab === "queries" ? (
              /* Queries table (uses existing data) */
              queryRows.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-400">No query data found for this period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Query</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Clicks</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Impressions</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">CTR</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {queryRows.map((row, i) => (
                        <tr key={`${row.query}-${i}`} className="transition-colors hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10">
                          <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">{row.query}</td>
                          <td className="px-6 py-3 text-right font-bold text-fuchsia-600 dark:text-fuchsia-400">{row.clicks.toLocaleString()}</td>
                          <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{row.impressions.toLocaleString()}</td>
                          <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{(row.ctr * 100).toFixed(2)}%</td>
                          <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{row.position.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* Dimension table (pages/countries/devices/appearance) */
              dimensionRows.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-400">No {activeTab} data found for this period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 capitalize">{activeTab === "appearance" ? "Search Appearance" : activeTab}</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Clicks</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Impressions</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">CTR</th>
                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {dimensionRows.map((row, i) => (
                        <tr key={i} className="transition-colors hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10">
                          <td className="max-w-[300px] truncate px-6 py-3 font-semibold text-slate-900 dark:text-white">{row.keys[0] ?? "—"}</td>
                          <td className="px-6 py-3 text-right font-bold text-fuchsia-600 dark:text-fuchsia-400">{row.clicks.toLocaleString()}</td>
                          <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{row.impressions.toLocaleString()}</td>
                          <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{(row.ctr * 100).toFixed(2)}%</td>
                          <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">{row.position.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>

          {/* URL Inspection + Sitemaps */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* URL Inspection */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-white/5">
                <Search className="size-4 text-fuchsia-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">URL Inspection</h3>
              </div>
              <div className="p-5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inspectUrlInput}
                    onChange={(e) => setInspectUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInspect()}
                    placeholder="https://example.com/page"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                  <Button size="sm" onClick={handleInspect} disabled={inspectLoading}>
                    {inspectLoading ? <Loader2 className="size-4 animate-spin" /> : "Inspect"}
                  </Button>
                </div>

                {inspectError && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                    <AlertCircle className="size-3.5" />
                    {inspectError}
                  </div>
                )}

                {inspectResult && (
                  <div className="mt-4 space-y-3">
                    {/* Index status */}
                    {inspectResult.indexStatusResult && (
                      <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          {inspectResult.indexStatusResult.verdict === "PASS" ? (
                            <CheckCircle2 className="size-5 text-fuchsia-500" />
                          ) : inspectResult.indexStatusResult.verdict === "FAIL" ? (
                            <XCircle className="size-5 text-red-500" />
                          ) : (
                            <AlertTriangle className="size-5 text-amber-500" />
                          )}
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {inspectResult.indexStatusResult.verdict === "PASS" ? "URL is indexed" : inspectResult.indexStatusResult.verdict === "FAIL" ? "URL is not indexed" : "Partial"}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1.5 text-xs">
                          {inspectResult.indexStatusResult.coverageState && (
                            <div className="flex justify-between"><span className="text-slate-400">Coverage</span><span className="font-semibold text-slate-700 dark:text-slate-300">{inspectResult.indexStatusResult.coverageState}</span></div>
                          )}
                          {inspectResult.indexStatusResult.lastCrawlTime && (
                            <div className="flex justify-between"><span className="text-slate-400">Last crawl</span><span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(inspectResult.indexStatusResult.lastCrawlTime).toLocaleDateString()}</span></div>
                          )}
                          {inspectResult.indexStatusResult.robotsTxtState && (
                            <div className="flex justify-between"><span className="text-slate-400">Robots.txt</span><span className="font-semibold text-slate-700 dark:text-slate-300">{inspectResult.indexStatusResult.robotsTxtState}</span></div>
                          )}
                          {inspectResult.indexStatusResult.googleCanonical && (
                            <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Google canonical</span><span className="truncate font-semibold text-slate-700 dark:text-slate-300">{inspectResult.indexStatusResult.googleCanonical}</span></div>
                          )}
                          {inspectResult.indexStatusResult.userCanonical && (
                            <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">User canonical</span><span className="truncate font-semibold text-slate-700 dark:text-slate-300">{inspectResult.indexStatusResult.userCanonical}</span></div>
                          )}
                          {inspectResult.indexStatusResult.pageFetchState && (
                            <div className="flex justify-between"><span className="text-slate-400">Page fetch</span><span className="font-semibold text-slate-700 dark:text-slate-300">{inspectResult.indexStatusResult.pageFetchState}</span></div>
                          )}
                          {inspectResult.indexStatusResult.crawledAs && (
                            <div className="flex justify-between"><span className="text-slate-400">Crawled as</span><span className="font-semibold text-slate-700 dark:text-slate-300">{inspectResult.indexStatusResult.crawledAs}</span></div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mobile usability */}
                    {inspectResult.mobileUsabilityResult && (
                      <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <Smartphone className="size-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Mobile Usability</span>
                          <span className={`ml-auto text-[10px] font-bold ${inspectResult.mobileUsabilityResult.verdict === "PASS" ? "text-fuchsia-600" : "text-red-500"}`}>
                            {inspectResult.mobileUsabilityResult.verdict}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Rich results */}
                    {inspectResult.richResultsResult && (
                      <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Rich Results</span>
                          <span className={`ml-auto text-[10px] font-bold ${inspectResult.richResultsResult.verdict === "PASS" ? "text-fuchsia-600" : "text-amber-500"}`}>
                            {inspectResult.richResultsResult.verdict}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sitemaps */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Link2 className="size-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sitemaps</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchSitemaps} disabled={sitemapsLoading}>
                  {sitemapsLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                </Button>
              </div>
              <div className="p-5">
                {/* Submit sitemap */}
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newSitemapPath}
                    onChange={(e) => setNewSitemapPath(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitSitemap()}
                    placeholder="sitemap.xml"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                  <Button size="sm" variant="outline" onClick={handleSubmitSitemap} disabled={!newSitemapPath.trim()}>
                    <Plus className="size-4" />
                  </Button>
                </div>

                {sitemapsError && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                    <AlertCircle className="size-3.5" />
                    {sitemapsError}
                  </div>
                )}

                {sitemaps.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    {sitemapsLoading ? "Loading sitemaps..." : "No sitemaps found. Submit one above."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sitemaps.map((sm, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-xs font-bold text-slate-900 dark:text-white">{sm.path}</span>
                          <div className="flex items-center gap-2">
                            {sm.errors !== "0" && (
                              <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-400/10 dark:text-red-400">{sm.errors} errors</span>
                            )}
                            {sm.warnings !== "0" && (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">{sm.warnings} warnings</span>
                            )}
                            <button
                              onClick={() => handleDeleteSitemap(sm.path)}
                              className="text-slate-300 transition-colors hover:text-red-500"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400">
                          {sm.isPending && <span className="flex items-center gap-0.5"><Clock className="size-3" /> Pending</span>}
                          {sm.lastSubmitted && <span>Submitted: {new Date(sm.lastSubmitted).toLocaleDateString()}</span>}
                          {sm.lastDownloaded && <span>Downloaded: {new Date(sm.lastDownloaded).toLocaleDateString()}</span>}
                          {sm.contents.length > 0 && (
                            <span>{sm.contents.map(c => `${c.submitted} submitted`).join(", ")}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data quality note */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 dark:border-white/10 dark:bg-slate-900/30">
            <p className="text-[11px] leading-relaxed text-slate-400">
              <strong className="font-bold">Note:</strong> Search Console data may be incomplete because Google omits some anonymized queries. Average position is an aggregate and may not reflect what every user sees. Data is fetched live from the Google Search Console API.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
