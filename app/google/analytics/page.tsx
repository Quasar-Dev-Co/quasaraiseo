"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Loader2, AlertCircle, TrendingUp,
  Users, Eye, Clock, RefreshCw, Activity,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  googleApi,
  type AnalyticsProperty,
  type AnalyticsData,
  type GoogleStatus,
} from "@/lib/google-api";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export default function AnalyticsPage() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [properties, setProperties] = useState<AnalyticsProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endDate = formatDate(new Date());
  const startDate = formatDate(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000));

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

  const fetchAnalytics = useCallback(async () => {
    if (!selectedProperty) return;
    setFetching(true);
    setError(null);
    try {
      const result = await googleApi.getAnalyticsData(selectedProperty, startDate, endDate);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch analytics");
    } finally {
      setFetching(false);
    }
  }, [selectedProperty, startDate, endDate]);

  useEffect(() => {
    if (selectedProperty) {
      fetchAnalytics();
    }
  }, [selectedProperty, fetchAnalytics]);

  if (loading) {
    return (
      <RequireAuth>
        <DashboardLayout>
          <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-fuchsia-500" />
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

  const totalsMap: Record<string, number> = {};
  data?.totals.forEach((t) => {
    totalsMap[t.metric] = t.value;
  });

  const maxSessions = data?.rows.length
    ? Math.max(...data.rows.map((r) => r.sessions))
    : 1;

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="px-6 py-8 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Google Analytics
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Traffic data for {startDate} to {endDate}
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

          {/* Property selector */}
          {properties.length > 0 && (
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                {properties.map((p) => (
                  <option key={p.propertyId} value={p.propertyId}>
                    {p.displayName} ({p.propertyId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stats cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Sessions"
              value={(totalsMap.sessions ?? 0).toLocaleString()}
              icon={Activity}
              trend="vs previous period"
              trendUp
              sparklineData={data?.rows.map(r => r.sessions) ?? [0]}
              color="#3b82f6"
            />
            <MetricCard
              label="Total Users"
              value={(totalsMap.totalUsers ?? 0).toLocaleString()}
              icon={Users}
              trend="vs previous period"
              trendUp
              sparklineData={data?.rows.map(r => r.users) ?? [0]}
              color="#8b5cf6"
            />
            <MetricCard
              label="Page Views"
              value={(totalsMap.pageViews ?? 0).toLocaleString()}
              icon={Eye}
              trend="vs previous period"
              trendUp
              sparklineData={data?.rows.map(r => r.pageViews) ?? [0]}
              color="#10b981"
            />
            <MetricCard
              label="Avg Session"
              value={formatDuration(totalsMap.avgSessionDuration ?? 0)}
              icon={Clock}
              trend="vs previous period"
              trendUp={false}
              sparklineData={data?.rows.map(r => r.avgSessionDuration) ?? [0]}
              color="#f59e0b"
            />
          </div>

          {/* Daily sessions bar chart */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daily Sessions
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
            ) : data && data.rows.length > 0 ? (
              <div className="px-6 py-6">
                <div className="flex h-48 items-end gap-1 overflow-x-auto">
                  {data.rows.map((row, i) => {
                    const height = (row.sessions / maxSessions) * 100;
                    return (
                      <div
                        key={i}
                        className="group relative flex min-w-[8px] flex-1 flex-col items-center justify-end"
                        title={`${row.date}: ${row.sessions} sessions`}
                      >
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-fuchsia-600 to-fuchsia-400 transition-all hover:from-fuchsia-700 hover:to-fuchsia-500"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>{data.rows[0]?.date}</span>
                  <span>{data.rows[data.rows.length - 1]?.date}</span>
                </div>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                No analytics data found for this period.
              </div>
            )}
          </div>

          {/* Daily data table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Traffic Breakdown
              </h2>
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
                      <tr
                        key={i}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">
                          {row.date}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-fuchsia-600 dark:text-fuchsia-400">
                          {row.sessions.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">
                          {row.users.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">
                          {row.pageViews.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">
                          {formatDuration(row.avgSessionDuration)}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-400">
                          {(row.bounceRate * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                No daily data available.
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
