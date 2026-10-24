"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Minus, RefreshCw } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

import { googleApi, type AnalyticsProperty, type SearchConsoleDailyRow, type SearchConsoleSite } from "@/lib/google-api";
import { aggregateSearchConsole, canonicalGoogleSite } from "@/lib/google-websites";

// At-a-glance traffic for the website a chat is about: Search Console clicks,
// impressions, CTR and position (plus Analytics sessions when a property
// matches), this week or month against the one before.

type Period = "week" | "month";
const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 28 };
const FETCH_DAYS = PERIOD_DAYS.month * 2 + 5;
const CACHE_MS = 15 * 60 * 1000;
const COLLAPSED_KEY = "quasar.chatGlance.collapsed";
const PERIOD_KEY = "quasar.chatGlance.period";

type Day = { date: string; clicks: number; impressions: number; ctr: number | null; position: number | null; sessions: number | null };

type GlanceData =
  | { state: "ok"; scSite: string | null; gaProperty: string | null; days: Day[]; lastDate: string }
  | { state: "unavailable"; message: string; connectLink: boolean };

const cache = new Map<string, { at: number; data: GlanceData }>();

function hostOf(url: string): string {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Domain property first (it counts every variant), then the exact URL, then the same host. */
function matchSearchConsoleSite(sites: SearchConsoleSite[], siteUrl: string): SearchConsoleSite | null {
  const host = hostOf(siteUrl);
  if (!host) return null;
  const domain = sites.find((s) => {
    if (!s.siteUrl.toLowerCase().startsWith("sc-domain:")) return false;
    const d = s.siteUrl.slice("sc-domain:".length).toLowerCase();
    return host === d || host.endsWith(`.${d}`);
  });
  const wanted = canonicalGoogleSite(siteUrl);
  const exact = sites.find((s) => canonicalGoogleSite(s.siteUrl) === wanted);
  const sameHost = sites.find((s) => !s.siteUrl.toLowerCase().startsWith("sc-domain:") && hostOf(s.siteUrl) === host);
  return domain || exact || sameHost || null;
}

function matchAnalyticsProperty(properties: AnalyticsProperty[], siteUrl: string): AnalyticsProperty | null {
  const host = hostOf(siteUrl);
  if (!host) return null;
  return properties.find((p) => (p.websiteUrls ?? []).some((u) => hostOf(u) === host)) || null;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
}

async function loadGlance(siteUrl: string): Promise<GlanceData> {
  const end = addDays(isoDay(new Date()), -1);
  const start = addDays(end, -(FETCH_DAYS - 1));

  let sites: SearchConsoleSite[] = [];
  let properties: AnalyticsProperty[] = [];
  let scError = "";
  try {
    sites = await googleApi.getSearchConsoleSites();
  } catch (err) {
    scError = err instanceof Error ? err.message : "Search Console is not available.";
  }
  try {
    properties = await googleApi.getAnalyticsProperties();
  } catch {
    properties = [];
  }

  const scSite = matchSearchConsoleSite(sites, siteUrl);
  const gaProperty = matchAnalyticsProperty(properties, siteUrl);

  if (!scSite && !gaProperty) {
    if (scError && !sites.length) return { state: "unavailable", message: "Connect Google to see this website's search traffic here.", connectLink: true };
    return {
      state: "unavailable",
      message: `${hostOf(siteUrl) || siteUrl} isn't in your connected Search Console or Analytics accounts.`,
      connectLink: true,
    };
  }

  const [scRows, gaRows] = await Promise.all([
    scSite ? googleApi.getSearchConsoleDaily(scSite.siteUrl, start, end).catch(() => null) : Promise.resolve(null),
    gaProperty ? googleApi.getAnalyticsData(gaProperty.propertyId, start, end).then((r) => r.rows).catch(() => null) : Promise.resolve(null),
  ]);
  if (!scRows && !gaRows) return { state: "unavailable", message: "Couldn't load traffic data from Google right now.", connectLink: false };

  // Search Console runs 2–3 days behind; compare up to its latest day so both periods are complete.
  const scByDate = new Map<string, SearchConsoleDailyRow>((scRows ?? []).map((r) => [r.date.slice(0, 10), r]));
  const gaByDate = new Map<string, number>((gaRows ?? []).map((r) => {
    const d = r.date.length === 8 ? `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}` : r.date.slice(0, 10);
    return [d, r.sessions];
  }));
  const lastDate = scRows?.length ? [...scByDate.keys()].sort().at(-1)! : end;

  const days: Day[] = [];
  for (let date = start; date <= lastDate; date = addDays(date, 1)) {
    const sc = scByDate.get(date);
    days.push({
      date,
      clicks: sc?.clicks ?? 0,
      impressions: sc?.impressions ?? 0,
      ctr: sc && sc.impressions > 0 ? sc.clicks / sc.impressions : null,
      position: sc && sc.impressions > 0 ? sc.position : null,
      sessions: gaRows ? gaByDate.get(date) ?? 0 : null,
    });
  }

  return {
    state: "ok",
    scSite: scRows ? scSite?.siteUrl ?? null : null,
    gaProperty: gaRows ? gaProperty?.displayName ?? null : null,
    days,
    lastDate,
  };
}

// ─── Formatting ───

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
  return Math.round(n).toLocaleString("en-US");
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

type MetricKey = "clicks" | "impressions" | "ctr" | "position" | "sessions";

type Metric = {
  key: MetricKey;
  label: string;
  value: string;
  change: { text: string; tone: "good" | "bad" | "flat"; detail: string } | null;
  series: Array<{ date: string; prev: number | null; cur: number | null }>;
  format: (n: number) => string;
  lowerIsBetter?: boolean;
};

function percentChange(cur: number, prev: number, label: string, fmt: (n: number) => string): Metric["change"] {
  if (prev === 0 && cur === 0) return { text: "0%", tone: "flat", detail: `${label}: none in either period` };
  if (prev === 0) return { text: "new", tone: "good", detail: `${label}: ${fmt(cur)}, none in the period before` };
  const pct = ((cur - prev) / prev) * 100;
  const tone = Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "good" : "bad";
  return { text: `${pct > 0 ? "+" : ""}${pct.toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`, tone, detail: `${label}: ${fmt(cur)} vs ${fmt(prev)} the period before` };
}

function buildMetrics(days: Day[], period: Period, hasSc: boolean, hasGa: boolean): { metrics: Metric[]; current: Day[]; previous: Day[] } {
  const n = PERIOD_DAYS[period];
  const current = days.slice(-n);
  const previous = days.slice(-2 * n, -n);
  const window = days.slice(-2 * n);

  const series = (pick: (d: Day) => number | null) => window.map((d, i) => {
    const v = pick(d);
    // The previous stretch is drawn muted; its last point also starts the current line so they join.
    return { date: d.date, prev: i < previous.length ? v : null, cur: i >= previous.length - 1 ? v : null };
  });

  const metrics: Metric[] = [];
  if (hasSc) {
    const cur = aggregateSearchConsole(current.map((d) => ({ date: d.date, clicks: d.clicks, impressions: d.impressions, ctr: d.ctr ?? 0, position: d.position ?? 0 })));
    const prev = aggregateSearchConsole(previous.map((d) => ({ date: d.date, clicks: d.clicks, impressions: d.impressions, ctr: d.ctr ?? 0, position: d.position ?? 0 })));
    const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
    const pos = (v: number) => v.toFixed(1);

    metrics.push({ key: "clicks", label: "Clicks", value: compact(cur.totalClicks), change: percentChange(cur.totalClicks, prev.totalClicks, "Clicks", compact), series: series((d) => d.clicks), format: compact });
    metrics.push({ key: "impressions", label: "Impressions", value: compact(cur.totalImpressions), change: percentChange(cur.totalImpressions, prev.totalImpressions, "Impressions", compact), series: series((d) => d.impressions), format: compact });

    const ctrDiff = (cur.avgCtr - prev.avgCtr) * 100;
    metrics.push({
      key: "ctr",
      label: "CTR",
      value: pct(cur.avgCtr),
      change: prev.totalImpressions && cur.totalImpressions
        ? { text: `${ctrDiff > 0 ? "+" : ""}${ctrDiff.toFixed(1)} pt`, tone: Math.abs(ctrDiff) < 0.05 ? "flat" : ctrDiff > 0 ? "good" : "bad", detail: `CTR: ${pct(cur.avgCtr)} vs ${pct(prev.avgCtr)} the period before` }
        : null,
      series: series((d) => d.ctr),
      format: pct,
    });

    const posDiff = cur.avgPosition - prev.avgPosition;
    metrics.push({
      key: "position",
      label: "Avg position",
      value: cur.totalImpressions ? pos(cur.avgPosition) : "—",
      change: prev.totalImpressions && cur.totalImpressions
        ? { text: `${posDiff > 0 ? "+" : ""}${posDiff.toFixed(1)}`, tone: Math.abs(posDiff) < 0.05 ? "flat" : posDiff < 0 ? "good" : "bad", detail: `Average position: ${pos(cur.avgPosition)} vs ${pos(prev.avgPosition)} the period before (lower is better)` }
        : null,
      series: series((d) => d.position),
      format: pos,
      lowerIsBetter: true,
    });
  }
  if (hasGa) {
    const curSessions = current.reduce((s, d) => s + (d.sessions ?? 0), 0);
    const prevSessions = previous.reduce((s, d) => s + (d.sessions ?? 0), 0);
    metrics.push({ key: "sessions", label: "Sessions", value: compact(curSessions), change: percentChange(curSessions, prevSessions, "Sessions", compact), series: series((d) => d.sessions), format: compact });
  }
  return { metrics, current, previous };
}

// ─── View ───

// Full class names so Tailwind keeps them; a single tile stays tile-sized.
const GRID_COLS: Record<number, string> = { 1: "sm:grid-cols-4", 2: "sm:grid-cols-4", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5" };

const TONE_CLASS = {
  good: "text-emerald-700 dark:text-emerald-400",
  bad: "text-red-600 dark:text-red-400",
  flat: "text-slate-500 dark:text-slate-400",
} as const;

function ChangeBadge({ change }: { change: NonNullable<Metric["change"]> }) {
  const Icon = change.tone === "good" ? ArrowUpRight : change.tone === "bad" ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${TONE_CLASS[change.tone]}`} title={change.detail}>
      <Icon className="size-3" aria-hidden />
      {change.text}
      <span className="sr-only">{change.tone === "good" ? "(better)" : change.tone === "bad" ? "(worse)" : "(about the same)"}</span>
    </span>
  );
}

function SparkTooltip({ active, payload, format }: { active?: boolean; payload?: Array<{ payload: { date: string; prev: number | null; cur: number | null } }>; format: (n: number) => string }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const value = point.cur ?? point.prev;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] shadow-sm dark:border-white/10 dark:bg-slate-900">
      <span className="text-slate-500 dark:text-slate-400">{shortDate(point.date)}</span>{" "}
      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{value === null ? "—" : format(value)}</span>
    </div>
  );
}

function MetricTile({ metric }: { metric: Metric }) {
  return (
    <div className="w-[148px] shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:w-auto sm:min-w-0 dark:border-white/10 dark:bg-slate-900" aria-label={metric.change ? metric.change.detail : `${metric.label}: ${metric.value}`}>
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{metric.label}</span>
        {metric.change && <ChangeBadge change={metric.change} />}
      </div>
      <p className="text-base font-semibold leading-tight tabular-nums text-slate-950 dark:text-white">{metric.value}</p>
      <div className="mt-0.5 h-6 [--glance-cur:var(--color-brand-700)] [--glance-prev:#94a3b8] dark:[--glance-cur:var(--color-brand-400)] dark:[--glance-prev:#64748b]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metric.series} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <YAxis hide domain={["dataMin", "dataMax"]} reversed={metric.lowerIsBetter} />
            <Tooltip content={<SparkTooltip format={metric.format} />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="prev" stroke="var(--glance-prev)" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="cur" stroke="var(--glance-cur)" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} activeDot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Only a convenience.
  }
}

export function SiteTrafficGlance({ siteUrl }: { siteUrl: string }) {
  const siteKey = siteUrl.trim().toLowerCase();
  // Rendered only once a chat's website is known (never during the server render), so storage is readable here.
  const [period, setPeriod] = useState<Period>(() => (readStored(PERIOD_KEY) === "month" ? "month" : "week"));
  const [collapsed, setCollapsed] = useState(() => readStored(COLLAPSED_KEY) === "1");
  const [result, setResult] = useState<{ key: string; data: GlanceData } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFor = useCallback((key: string, url: string) => loadGlance(url)
    .then((next) => {
      cache.set(key, { at: Date.now(), data: next });
      return next;
    })
    .catch((): GlanceData => ({ state: "unavailable", message: "Couldn't load traffic data from Google right now.", connectLink: false })), []);

  useEffect(() => {
    if (!siteKey) return;
    const hit = cache.get(siteKey);
    if (hit && Date.now() - hit.at < CACHE_MS) return;
    let cancelled = false;
    fetchFor(siteKey, siteUrl).then((next) => {
      if (!cancelled) setResult({ key: siteKey, data: next });
    });
    return () => { cancelled = true; };
  }, [siteKey, siteUrl, fetchFor]);

  const cached = cache.get(siteKey);
  const data = result?.key === siteKey ? result.data : cached?.data ?? null;
  const loading = refreshing || !data;
  const refresh = async () => {
    setRefreshing(true);
    const next = await fetchFor(siteKey, siteUrl);
    setResult({ key: siteKey, data: next });
    setRefreshing(false);
  };

  if (!siteUrl.trim()) return null;

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      writeStored(COLLAPSED_KEY, c ? "0" : "1");
      return !c;
    });
  };
  const choosePeriod = (p: Period) => {
    setPeriod(p);
    writeStored(PERIOD_KEY, p);
  };

  const ok = data?.state === "ok" ? data : null;
  const built = ok ? buildMetrics(ok.days, period, Boolean(ok.scSite), Boolean(ok.gaProperty)) : null;
  const clicks = built?.metrics.find((m) => m.key === "clicks") ?? built?.metrics[0];
  const range = built && built.current.length
    ? `${shortDate(built.current[0].date)}–${shortDate(built.current[built.current.length - 1].date)} vs ${built.previous.length ? `${shortDate(built.previous[0].date)}–${shortDate(built.previous[built.previous.length - 1].date)}` : "the period before"}`
    : "";

  return (
    <div className="mx-auto mt-2 max-w-4xl">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          aria-expanded={!collapsed}
        >
          <ChevronDown className={`size-3 shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          <span className="shrink-0">{data?.state === "unavailable" ? "Search traffic" : `Last ${PERIOD_DAYS[period]} days at a glance`}</span>
          {collapsed && clicks && (
            <span className="flex min-w-0 items-center gap-1.5 font-normal text-slate-500 dark:text-slate-400">
              <span className="truncate">· {clicks.label} {clicks.value}</span>
              {clicks.change && <ChangeBadge change={clicks.change} />}
            </span>
          )}
          {!collapsed && range && <span className="hidden truncate font-normal text-slate-400 sm:inline">· {range}</span>}
        </button>
        {!collapsed && ok && (
          <div className="flex shrink-0 items-center gap-1">
            <div className="flex rounded-md border border-slate-200 p-0.5 dark:border-white/10" role="group" aria-label="Compare period">
              {(["week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => choosePeriod(p)}
                  aria-pressed={period === p}
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${period === p ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
                >
                  {p === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="grid size-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
              title="Refresh"
              aria-label="Refresh traffic data"
            >
              <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="mt-1.5">
          {!data && loading && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-[66px] animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}
            </div>
          )}
          {data?.state === "unavailable" && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {data.message}{" "}
              {data.connectLink && (
                <Link href="/setting" className="font-semibold text-brand-700 hover:text-brand-hover dark:text-brand-400">
                  Google Connect
                </Link>
              )}
            </p>
          )}
          {built && (
            <>
              <div className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 ${GRID_COLS[built.metrics.length] ?? "sm:grid-cols-5"}`}>
                {built.metrics.map((m) => <MetricTile key={m.key} metric={m} />)}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {[ok?.scSite && `Search Console: ${ok.scSite}`, ok?.gaProperty && `Analytics: ${ok.gaProperty}`].filter(Boolean).join(" · ")}
                {ok?.scSite ? " · Search Console data runs 2–3 days behind" : ""}
                {" · gray line = the period before"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
