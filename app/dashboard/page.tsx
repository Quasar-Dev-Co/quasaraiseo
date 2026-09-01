"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, FileSearch, ClipboardList, Plug, PenLine,
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Activity,
  Zap, BarChart3, Globe2, Network, FileText, Newspaper,
  Sparkles, Cpu, Loader2, RefreshCw, Layers,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinLoading } from "@/lib/use-min-loading";
import { useAuth } from "@/hooks/use-auth";
import { taskApi, type SeoTask, type TaskStatus } from "@/lib/task-api";
import { keywordMcpApi, type McpSessionPreview } from "@/lib/keyword-mcp-api";
import { wordpressApi, type WordPressSite, type GenerationJob } from "@/lib/wordpress-api";
import { brandingApi, type Branding } from "@/lib/branding-api";
import { googleApi, type GoogleStatus } from "@/lib/google-api";
import { aiProviderApi, type AiProviderSettings } from "@/lib/ai-provider-api";

const statusColors: Record<TaskStatus, string> = {
  todo: "from-slate-400 to-slate-500",
  in_progress: "from-blue-400 to-blue-500",
  review: "from-amber-400 to-amber-500",
  done: "from-fuchsia-500 to-purple-600",
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function getInitials(name: string): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

interface DashboardData {
  tasks: SeoTask[];
  sessions: McpSessionPreview[];
  wpSites: WordPressSite[];
  genJobs: GenerationJob[];
  brandings: Branding[];
  googleStatus: GoogleStatus | null;
  aiSettings: AiProviderSettings | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinLoading(loading, 800);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel — individual failures don't break the whole dashboard
      const [
        tasksResult, sessionsResult, wpSitesResult, genJobsResult,
        brandingsResult, googleResult, aiResult,
      ] = await Promise.allSettled([
        taskApi.getTasks(),
        keywordMcpApi.listSessions(),
        wordpressApi.getSites(),
        wordpressApi.listGenerationJobs(),
        brandingApi.getAll(),
        googleApi.getStatus(),
        aiProviderApi.getSettings().then(r => r.settings),
      ]);

      const tasks = tasksResult.status === "fulfilled" ? tasksResult.value : [];
      const sessions = sessionsResult.status === "fulfilled" ? sessionsResult.value.sessions : [];
      const wpSites = wpSitesResult.status === "fulfilled" ? wpSitesResult.value : [];
      const genJobs = genJobsResult.status === "fulfilled" ? genJobsResult.value.jobs : [];
      const brandings = brandingsResult.status === "fulfilled" ? brandingsResult.value : [];
      const googleStatus = googleResult.status === "fulfilled" ? googleResult.value : null;
      const aiSettings = aiResult.status === "fulfilled" ? aiResult.value : null;

      setData({ tasks, sessions, wpSites, genJobs, brandings, googleStatus, aiSettings });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Compute stats from real data
  const tasks = data?.tasks ?? [];
  const sessions = data?.sessions ?? [];
  const wpSites = data?.wpSites ?? [];
  const genJobs = data?.genJobs ?? [];
  const brandings = data?.brandings ?? [];
  const googleStatus = data?.googleStatus;
  const aiSettings = data?.aiSettings;

  const activeTasks = tasks.filter(t => t.status !== "done").length;
  const doneTasks = tasks.filter(t => t.status === "done").length;
  const urgentTasks = tasks.filter(t => t.priority === "urgent" && t.status !== "done").length;
  const completedJobs = genJobs.filter(j => j.status === "completed").length;
  const runningJobs = genJobs.filter(j => j.status === "generating" || j.status === "idle").length;
  const totalWpPosts = wpSites.reduce((sum, s) => sum + s.postCount, 0);
  const connectedWpSites = wpSites.filter(s => s.connected).length;

  // Build recent activity from real data
  type ActivityItem = { icon: typeof FileSearch; text: string; time: string; color: string; timestamp: number };
  const activityItems: ActivityItem[] = [];

  // Recent tasks
  tasks.slice(0, 3).forEach(t => {
    activityItems.push({
      icon: ClipboardList,
      text: `Task ${t.status === "done" ? "completed" : "updated"}: ${t.title}`,
      time: formatRelativeTime(t.updatedAt),
      color: t.status === "done" ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-blue-600 dark:text-blue-400",
      timestamp: new Date(t.updatedAt).getTime(),
    });
  });

  // Recent MCP sessions
  sessions.slice(0, 3).forEach(s => {
    activityItems.push({
      icon: Network,
      text: `Chat session: ${s.preview.slice(0, 50)}${s.preview.length > 50 ? "..." : ""}`,
      time: formatRelativeTime(s.updatedAt),
      color: "text-purple-600 dark:text-purple-400",
      timestamp: new Date(s.updatedAt).getTime(),
    });
  });

  // Recent generation jobs
  genJobs.slice(0, 3).forEach(j => {
    activityItems.push({
      icon: PenLine,
      text: `Content generated: ${j.prompt.slice(0, 50)}${j.prompt.length > 50 ? "..." : ""}`,
      time: formatRelativeTime(j.createdAt),
      color: "text-amber-600 dark:text-amber-400",
      timestamp: new Date(j.createdAt).getTime(),
    });
  });

  // Recent WordPress sites
  wpSites.slice(0, 2).forEach(s => {
    if (s.lastSyncAt) {
      activityItems.push({
        icon: Newspaper,
        text: `WordPress site synced: ${s.siteName}`,
        time: formatRelativeTime(s.lastSyncAt),
        color: "text-blue-600 dark:text-blue-400",
        timestamp: new Date(s.lastSyncAt).getTime(),
      });
    }
  });

  activityItems.sort((a, b) => b.timestamp - a.timestamp);
  const recentActivity = activityItems.slice(0, 8);

  // Task distribution by work type
  const workTypeStats: Record<string, number> = {};
  tasks.forEach(t => {
    workTypeStats[t.workType] = (workTypeStats[t.workType] ?? 0) + 1;
  });
  const topWorkTypes = Object.entries(workTypeStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Task distribution by status
  const statusCounts: Record<TaskStatus, number> = {
    todo: tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    review: tasks.filter(t => t.status === "review").length,
    done: tasks.filter(t => t.status === "done").length,
  };

  // Assignee stats
  const assigneeStats: Record<string, { total: number; done: number }> = {};
  tasks.forEach(t => {
    if (!t.assignee) return;
    if (!assigneeStats[t.assignee]) assigneeStats[t.assignee] = { total: 0, done: 0 };
    assigneeStats[t.assignee].total++;
    if (t.status === "done") assigneeStats[t.assignee].done++;
  });
  const topAssignees = Object.entries(assigneeStats)
    .map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Generation jobs last 7 days chart
  const last7Days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    const count = genJobs.filter(j => j.createdAt.startsWith(dayStr)).length;
    last7Days.push({ label: d.toLocaleDateString("en", { weekday: "short" }), count });
  }
  const maxJobCount = Math.max(...last7Days.map(d => d.count), 1);

  return (
    <RequireAuth>
    <DashboardLayout>
      {/* Hero */}
      <section className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/80 bg-fuchsia-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-300">
              <Activity className="size-3.5" />
              Overview
            </div>
            <h1 className="mt-5 text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
              {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}{" "}
              <em className="not-italic bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Overview
              </em>
            </h1>
            <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              Monitor your SEO operations, track team progress, and keep an eye on audit performance across all client projects.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboard} disabled={loading} className="shrink-0">
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Refresh
          </Button>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {showSkeleton ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[18px] border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-3 h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <Skeleton className="h-[250px] w-full rounded-3xl" />
              <div className="grid gap-6 sm:grid-cols-2">
                <Skeleton className="h-[200px] w-full rounded-3xl" />
                <Skeleton className="h-[200px] w-full rounded-3xl" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[300px] w-full rounded-3xl" />
              <Skeleton className="h-[200px] w-full rounded-3xl" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><ClipboardList className="size-4" /> Tasks</div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400"><Clock className="size-3" /> {activeTasks} active</span>
              </div>
              <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{tasks.length}</div>
              <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{doneTasks} completed · {urgentTasks} urgent</div>
            </article>

            <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><PenLine className="size-4" /> Content</div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400"><TrendingUp className="size-3" /> {completedJobs} done</span>
              </div>
              <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{genJobs.length}</div>
              <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{runningJobs} running · {completedJobs} generated</div>
            </article>

            <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Newspaper className="size-4" /> WordPress</div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  <span className={`size-1.5 rounded-full ${connectedWpSites > 0 ? "bg-blue-500" : "bg-slate-300"}`} /> {connectedWpSites} connected
                </span>
              </div>
              <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{wpSites.length}</div>
              <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{totalWpPosts} posts published</div>
            </article>

            <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Network className="size-4" /> MCP Chats</div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400"><Sparkles className="size-3" /> {sessions.length} total</span>
              </div>
              <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{sessions.length}</div>
              <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{brandings.length} brandings extracted</div>
            </article>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Left column — charts */}
            <div className="space-y-6">
              {/* Content generation chart */}
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/5">
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><BarChart3 className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Content Generation</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Posts generated over the last 7 days</p>
                    </div>
                  </div>
                  <Badge className="bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-400/15 dark:text-fuchsia-400 dark:border-transparent">{genJobs.length} total</Badge>
                </header>
                <div className="p-6">
                  {genJobs.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center text-center">
                      <PenLine className="size-8 text-slate-300 dark:text-slate-600" />
                      <p className="mt-3 text-sm font-semibold text-slate-400">No content generated yet</p>
                      <p className="mt-1 text-xs text-slate-400">Start creating posts from the Post Create page</p>
                    </div>
                  ) : (
                    <div className="flex items-end justify-between gap-2 h-[200px]">
                      {last7Days.map((d, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-2">
                          <div className="flex w-full items-end justify-center" style={{ height: "160px" }}>
                            <div
                              className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-fuchsia-600/40 via-purple-600 to-fuchsia-500 transition-all hover:from-fuchsia-600 hover:to-pink-500 shadow-sm"
                              style={{ height: `${(d.count / maxJobCount) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
                              title={`${d.count} posts`}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>

              {/* Task status + work type distribution */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Task status distribution */}
                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                  <header className="border-b border-slate-100 px-6 py-5 dark:border-white/5">
                    <div className="flex gap-2.75">
                      <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><ClipboardList className="size-[18px]" /></span>
                      <div>
                        <h3 className="m-0 text-base text-slate-900 dark:text-white">Task Status</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Current distribution</p>
                      </div>
                    </div>
                  </header>
                  <div className="p-6 space-y-3.5">
                    {(Object.keys(statusCounts) as TaskStatus[]).map(status => {
                      const count = statusCounts[status];
                      const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{statusLabels[status]}</span>
                            <span className="font-bold text-slate-500 dark:text-slate-400">{count}</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className={`h-full rounded-full bg-gradient-to-r ${statusColors[status]}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {tasks.length === 0 && (
                      <p className="py-4 text-center text-xs text-slate-400">No tasks yet</p>
                    )}
                  </div>
                </article>

                {/* Work type distribution */}
                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                  <header className="border-b border-slate-100 px-6 py-5 dark:border-white/5">
                    <div className="flex gap-2.75">
                      <span className="grid size-9 place-items-center rounded-[12px] bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400"><Layers className="size-[18px]" /></span>
                      <div>
                        <h3 className="m-0 text-base text-slate-900 dark:text-white">Work Types</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Top categories</p>
                      </div>
                    </div>
                  </header>
                  <div className="p-6 space-y-3.5">
                    {topWorkTypes.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-400">No tasks yet</p>
                    ) : (
                      topWorkTypes.map(([type, count]) => {
                        const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{type}</span>
                              <span className="font-bold text-slate-500 dark:text-slate-400">{count}</span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </article>
              </div>

              {/* Quick links */}
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <header className="border-b border-slate-100 px-6 py-5 dark:border-white/5">
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Globe2 className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Quick Actions</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Jump to any workspace</p>
                    </div>
                  </div>
                </header>
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { href: "/content-strategy", icon: Network, label: "Quasar MCP", desc: `${sessions.length} chat sessions` },
                    { href: "/audit-mcp", icon: Plug, label: "Audit MCP", desc: "Run SEO audits" },
                    { href: "/post-create", icon: PenLine, label: "Post Create", desc: `${genJobs.length} posts generated` },
                    { href: "/task-management", icon: ClipboardList, label: "Tasks", desc: `${activeTasks} active tasks` },
                  ].map(link => (
                    <Link key={link.href} href={link.href} className="group rounded-2xl border border-slate-200 bg-white/65 p-4 transition-all hover:border-fuchsia-300 hover:shadow-[0_8px_24px_rgba(217,70,239,0.12)] dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-fuchsia-400/30">
                      <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400">
                        <link.icon className="size-[18px]" />
                      </span>
                      <strong className="mt-3 block text-sm text-slate-900 dark:text-white">{link.label}</strong>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{link.desc}</p>
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400 opacity-0 transition-opacity group-hover:opacity-100">
                        Open <ArrowUpRight className="size-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            </div>

            {/* Right column — activity, integrations, team */}
            <div className="space-y-6">
              {/* Recent activity */}
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <header className="border-b border-slate-100 px-6 py-5 dark:border-white/5">
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Activity className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Recent Activity</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Latest events across projects</p>
                    </div>
                  </div>
                </header>
                <div className="p-5 space-y-1">
                  {recentActivity.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">No recent activity</p>
                  ) : (
                    recentActivity.map((act, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5">
                        <act.icon className={`size-4 shrink-0 mt-0.5 ${act.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] leading-relaxed text-slate-700 dark:text-slate-300 truncate">{act.text}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{act.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>

              {/* Team / Assignee performance */}
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <header className="border-b border-slate-100 px-6 py-5 dark:border-white/5">
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400"><TrendingUp className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Team Performance</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Task completion by assignee</p>
                    </div>
                  </div>
                </header>
                <div className="p-5 space-y-4">
                  {topAssignees.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">No assignees yet</p>
                  ) : (
                    topAssignees.map(a => (
                      <div key={a.name} className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {getInitials(a.name)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{a.name}</strong>
                            <span className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400">{a.rate}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500" style={{ width: `${a.rate}%` }} />
                          </div>
                          <span className="mt-1 block text-[10px] text-slate-400">{a.done}/{a.total} tasks done</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>

              {/* Integrations status */}
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <header className="border-b border-slate-100 px-6 py-5 dark:border-white/5">
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Plug className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Integrations</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Connected services</p>
                    </div>
                  </div>
                </header>
                <div className="p-5 space-y-3">
                  {/* AI Provider */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Cpu className="size-4 text-slate-600 dark:text-slate-300" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Provider</p>
                        <p className="text-[10px] text-slate-400">
                          {aiSettings ? `${aiSettings.activeProvider} · ${aiSettings[aiSettings.activeProvider as "openai" | "openrouter"]?.hasApiKey ? "API key set" : "no key"}` : "Not configured"}
                        </p>
                      </div>
                    </div>
                    <span className={`size-2 rounded-full ${aiSettings?.[aiSettings.activeProvider as "openai" | "openrouter"]?.hasApiKey ? "bg-fuchsia-500" : "bg-slate-300"}`} />
                  </div>

                  <Separator />

                  {/* Google */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Globe2 className="size-4 text-slate-600 dark:text-slate-300" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Google</p>
                        <p className="text-[10px] text-slate-400">
                          {googleStatus?.connected
                            ? `Connected as ${googleStatus.email}`
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <span className={`size-2 rounded-full ${googleStatus?.connected ? "bg-blue-500" : "bg-slate-300"}`} />
                  </div>

                  <Separator />

                  {/* WordPress */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Newspaper className="size-4 text-slate-600 dark:text-slate-300" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">WordPress</p>
                        <p className="text-[10px] text-slate-400">
                          {connectedWpSites > 0 ? `${connectedWpSites} site${connectedWpSites !== 1 ? "s" : ""} connected` : "No sites connected"}
                        </p>
                      </div>
                    </div>
                    <span className={`size-2 rounded-full ${connectedWpSites > 0 ? "bg-blue-500" : "bg-slate-300"}`} />
                  </div>

                  <Separator />

                  {/* Branding */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Sparkles className="size-4 text-slate-600 dark:text-slate-300" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Branding</p>
                        <p className="text-[10px] text-slate-400">{brandings.length} brandings extracted</p>
                      </div>
                    </div>
                    <span className={`size-2 rounded-full ${brandings.length > 0 ? "bg-fuchsia-500" : "bg-slate-300"}`} />
                  </div>

                  <Link href="/setting">
                    <Button variant="outline" size="sm" className="mt-2 w-full hover:bg-fuchsia-50 hover:text-fuchsia-700 dark:hover:bg-fuchsia-400/10">
                      Manage integrations <ArrowUpRight className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </article>

              {/* WordPress sites list */}
              {wpSites.length > 0 && (
                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                  <header className="border-b border-slate-100 px-6 py-5 dark:border-white/5">
                    <div className="flex gap-2.75">
                      <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Newspaper className="size-[18px]" /></span>
                      <div>
                        <h3 className="m-0 text-base text-slate-900 dark:text-white">WordPress Sites</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Connected sites</p>
                      </div>
                    </div>
                  </header>
                  <div className="p-5 space-y-3">
                    {wpSites.slice(0, 4).map(site => (
                      <Link key={site.id} href="/wordpress" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition-all hover:border-blue-300 hover:bg-blue-50/30 dark:border-white/10 dark:hover:bg-blue-400/5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                          <Globe2 className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{site.siteName}</p>
                          <p className="truncate text-[10px] text-slate-400">{site.siteUrl.replace("https://", "")}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-black text-slate-900 dark:text-white">{site.postCount}</span>
                          <span className="text-[9px] text-slate-400">posts</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </article>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
    </RequireAuth>
  );
}
