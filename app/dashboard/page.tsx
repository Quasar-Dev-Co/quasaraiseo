"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Circle, ClipboardList,
  Loader2, Network, Newspaper, PenLine, RefreshCw,
} from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MyActivity } from "@/components/dashboard/my-activity";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinLoading } from "@/lib/use-min-loading";
import { useAuth } from "@/hooks/use-auth";
import { isAssignedTo, taskApi, type SeoTask, type TaskStatus } from "@/lib/task-api";
import { keywordMcpApi, type McpSessionPreview } from "@/lib/keyword-mcp-api";
import { wordpressApi, type WordPressSite, type GenerationJob } from "@/lib/wordpress-api";
import { brandingApi, type Branding } from "@/lib/branding-api";
import { googleApi, type GoogleStatus } from "@/lib/google-api";
import { aiProviderApi, type AiProviderSettings } from "@/lib/ai-provider-api";

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "In review",
  done: "Done",
};

// Status is carried by the label and order; color only reinforces it.
const statusFill: Record<TaskStatus, string> = {
  todo: "bg-slate-300 dark:bg-slate-600",
  in_progress: "bg-slate-500 dark:bg-slate-400",
  review: "bg-brand-300 dark:bg-brand-700",
  done: "bg-brand-600 dark:bg-brand-400",
};

function formatRelativeTime(at: number): string {
  const diff = Math.floor((Date.now() - at) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(at).toLocaleDateString();
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

// Each source loads on its own; one failing never blanks the page.
async function loadDashboard(isSuper: boolean): Promise<DashboardData> {
  const [tasksR, sessionsR, sitesR, jobsR, brandsR, googleR, aiR] = await Promise.allSettled([
    taskApi.getTasks(),
    keywordMcpApi.listSessions(),
    wordpressApi.getSites(),
    wordpressApi.listGenerationJobs(),
    brandingApi.getAll(),
    googleApi.getStatus(),
    isSuper ? aiProviderApi.getSettings().then((r) => r.settings) : Promise.resolve(null),
  ]);
  return {
    tasks: tasksR.status === "fulfilled" ? tasksR.value : [],
    sessions: sessionsR.status === "fulfilled" ? sessionsR.value.sessions : [],
    wpSites: sitesR.status === "fulfilled" ? sitesR.value : [],
    genJobs: jobsR.status === "fulfilled" ? jobsR.value.jobs : [],
    brandings: brandsR.status === "fulfilled" ? brandsR.value : [],
    googleStatus: googleR.status === "fulfilled" ? googleR.value : null,
    aiSettings: aiR.status === "fulfilled" ? aiR.value : null,
  };
}

function Panel({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-card dark:border-white/10">
      <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-400">{description}</p>}
        </div>
        {action}
      </header>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuper = user?.role === "super";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinLoading(loading, 600);
  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadDashboard(isSuper)
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the overview."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isSuper, reloadKey]);

  const tasks = (data?.tasks ?? []).filter((task) => isSuper || isAssignedTo(task.assignee, user));
  const sessions = data?.sessions ?? [];
  const wpSites = data?.wpSites ?? [];
  const genJobs = data?.genJobs ?? [];
  const brandings = data?.brandings ?? [];
  const googleStatus = data?.googleStatus;
  const aiSettings = data?.aiSettings;

  const completedJobs = genJobs.filter((j) => j.status === "completed").length;
  const runningJobs = genJobs.filter((j) => j.status === "generating" || j.status === "idle").length;
  const connectedWpSites = wpSites.filter((s) => s.connected).length;
  const totalWpPosts = wpSites.reduce((sum, s) => sum + s.postCount, 0);
  const openTasks = tasks.filter((t) => t.status !== "done");
  const urgentTasks = openTasks.filter((t) => t.priority === "urgent").length;
  const aiReady = !!aiSettings?.[aiSettings.activeProvider as "openai" | "openrouter"]?.hasApiKey;

  // Setup checklist: the few things that make everything else work.
  const checklist = [
    ...(isSuper ? [{ done: aiReady, label: "Add an AI provider key", hint: "Needed for every AI feature. Admins only.", href: "/setting" }] : []),
    { done: brandings.length > 0, label: "Set up Branding", hint: "Logo, colors and tone used in posts and images.", href: "/branding" },
    { done: connectedWpSites > 0, label: "Connect a WordPress site", hint: "So posts can be published directly.", href: "/wordpress" },
    { done: sessions.length > 0, label: "Start an MCP Chat", hint: "Research keywords and plan content for a site.", href: "/content-strategy" },
    { done: completedJobs > 0, label: "Write your first post", hint: "From a chat brief or a short prompt.", href: "/post-create" },
    { done: !!googleStatus?.connected, label: "Connect Google", hint: "See clicks, rankings and visitors.", href: "/setting" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const nextStep = checklist.find((c) => !c.done);

  // The loop the product is built around, with live numbers.
  const loop = [
    {
      icon: Network, stage: "Plan", value: sessions.length, unit: sessions.length === 1 ? "MCP chat" : "MCP chats",
      text: "Research keywords and turn them into a content plan.", href: "/content-strategy", cta: "Open MCP Chat",
    },
    {
      icon: PenLine, stage: "Create", value: completedJobs, unit: completedJobs === 1 ? "post written" : "posts written",
      text: runningJobs > 0 ? `${runningJobs} being written right now.` : "Write posts with images in the brand's style.", href: "/post-create", cta: "Write a post",
    },
    {
      icon: Newspaper, stage: "Publish", value: totalWpPosts, unit: `posts on ${connectedWpSites} ${connectedWpSites === 1 ? "site" : "sites"}`,
      text: connectedWpSites > 0 ? "Publish, draft or schedule on connected sites." : "Connect a WordPress site to publish directly.", href: "/wordpress", cta: connectedWpSites > 0 ? "Manage sites" : "Connect a site",
    },
    {
      icon: BarChart3, stage: "Measure", value: null, unit: googleStatus?.connected ? "Google connected" : "Google not connected",
      text: googleStatus?.connected ? `Reading data as ${googleStatus.email}.` : "Connect Google to see clicks and rankings.", href: googleStatus?.connected ? "/google/search-console" : "/setting", cta: googleStatus?.connected ? "Open Search Console" : "Connect Google",
    },
  ];

  const last7Days = Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - k));
    const dayStr = d.toISOString().split("T")[0];
    return { label: d.toLocaleDateString("en", { weekday: "short" }), date: dayStr, count: genJobs.filter((j) => j.createdAt.startsWith(dayStr)).length };
  });
  const maxJobs = Math.max(...last7Days.map((d) => d.count), 1);
  const weekTotal = last7Days.reduce((s, d) => s + d.count, 0);

  const statusCounts = (Object.keys(statusLabels) as TaskStatus[]).map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }));

  type Activity = { text: string; where: string; href: string; at: number };
  const activity: Activity[] = [
    ...tasks.slice(0, 4).map((t) => ({ text: t.title, where: t.status === "done" ? "Task done" : "Task updated", href: "/task-management", at: new Date(t.updatedAt).getTime() })),
    ...sessions.slice(0, 4).map((s) => ({ text: s.preview, where: "MCP Chat", href: "/content-strategy", at: new Date(s.updatedAt).getTime() })),
    ...genJobs.slice(0, 4).map((j) => ({ text: j.prompt, where: j.status === "completed" ? "Post written" : j.status === "failed" ? "Post failed" : "Post in progress", href: "/post-create", at: new Date(j.createdAt).getTime() })),
  ].sort((a, b) => b.at - a.at).slice(0, 7);

  const firstName = user?.name?.split(" ")[0];

  return (
    <RequireAuth>
      <DashboardLayout>
        <PageHeader
          title={firstName ? `Hi ${firstName}` : "Overview"}
          description="Where your websites stand, and the next thing worth doing."
          actions={
            <Button variant="outline" onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Refresh
            </Button>
          }
        />

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            <AlertTriangle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mb-8">
          <MyActivity />
        </div>

        {showSkeleton ? (
          <div className="space-y-6">
            <Skeleton className="h-[148px] w-full rounded-xl" />
            <Skeleton className="h-[164px] w-full rounded-xl" />
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Skeleton className="h-[260px] w-full rounded-xl" />
              <Skeleton className="h-[260px] w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Next step + setup progress */}
            {nextStep && (
              <section className="grid gap-6 rounded-xl border border-slate-200 bg-card p-5 lg:grid-cols-[1fr_1.2fr] dark:border-white/10">
                <div>
                  <p className="text-[13px] font-semibold text-brand-700 dark:text-brand-300">Next step</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{nextStep.label}</h2>
                  <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-400">{nextStep.hint}</p>
                  <Link href={nextStep.href} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 text-sm font-semibold text-white hover:bg-brand-hover dark:bg-brand-700 dark:text-white dark:hover:bg-brand-hover">
                    Do it now <ArrowRight className="size-4" />
                  </Link>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Setup</p>
                    <p className="text-[13px] tabular-nums text-slate-600 dark:text-slate-400">{doneCount} of {checklist.length} done</p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={checklist.length} aria-valuenow={doneCount} aria-label="Setup progress">
                    <div className="h-full rounded-full bg-brand-600 dark:bg-brand-400" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
                  </div>
                  <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    {checklist.map((c) => (
                      <li key={c.label}>
                        <Link href={c.href} className="flex items-center gap-2 rounded-md py-1 text-[13.5px] text-slate-800 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                          {c.done
                            ? <CheckCircle2 className="size-4 shrink-0 text-brand-600 dark:text-brand-400" aria-label="Done" />
                            : <Circle className="size-4 shrink-0 text-slate-400" aria-label="Not done" />}
                          <span className={c.done ? "text-slate-500 line-through decoration-slate-300 dark:text-slate-500" : ""}>{c.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* The loop */}
            <section aria-labelledby="loop-title">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 id="loop-title" className="text-[15px] font-semibold text-slate-950 dark:text-white">How your work moves</h2>
                <p className="hidden text-[13px] text-slate-600 sm:block dark:text-slate-400">Each stage feeds the next. Repeat it for every site.</p>
              </div>
              <ol className="grid overflow-hidden rounded-xl border border-slate-200 bg-card sm:grid-cols-2 xl:grid-cols-4 dark:border-white/10">
                {loop.map((s, i) => (
                  <li key={s.stage} className="relative flex flex-col border-slate-200 p-5 dark:border-white/10 [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-r xl:[&:not(:last-child)]:border-b-0 xl:[&:not(:last-child)]:border-r">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                      <s.icon className="size-4 text-brand-700 dark:text-brand-300" /> {s.stage}
                      {i < loop.length - 1 && <ArrowRight className="ml-auto size-4 text-slate-400" aria-hidden />}
                    </div>
                    <p className="mt-3 text-slate-950 dark:text-white">
                      {s.value !== null && <span className="mr-1.5 text-3xl font-semibold tabular-nums">{s.value}</span>}
                      <span className={s.value !== null ? "text-sm text-slate-600 dark:text-slate-400" : "text-lg font-semibold"}>{s.unit}</span>
                    </p>
                    <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-400">{s.text}</p>
                    <Link href={s.href} className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-brand-700 hover:text-brand-800 hover:underline dark:text-brand-300 dark:hover:text-brand-200">
                      {s.cta} <ArrowRight className="size-3.5" />
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-6">
                <Panel
                  title="Posts written this week"
                  description={weekTotal > 0 ? `${weekTotal} in the last 7 days` : "Nothing yet this week"}
                  action={<Link href="/post-create" className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300">Post Writer</Link>}
                >
                  {weekTotal === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-white/15">
                      <p className="text-sm text-slate-700 dark:text-slate-300">No posts in the last 7 days.</p>
                      <Link href="/post-create" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
                        Write one now <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex h-44 items-end gap-2" role="img" aria-label={`Posts per day: ${last7Days.map((d) => `${d.label} ${d.count}`).join(", ")}`}>
                      {last7Days.map((d) => (
                        <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.label}: ${d.count} ${d.count === 1 ? "post" : "posts"}`}>
                          <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">{d.count > 0 ? d.count : ""}</span>
                          <div
                            className="w-full max-w-10 rounded-t bg-brand-600 transition-colors group-hover:bg-brand-700 dark:bg-brand-400 dark:group-hover:bg-brand-300"
                            style={{ height: `${(d.count / maxJobs) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                          />
                          <span className="border-t border-slate-200 pt-1 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel
                  title="Tasks"
                  description={tasks.length === 0 ? "No tasks yet" : `${openTasks.length} open${urgentTasks ? `, ${urgentTasks} urgent` : ""}`}
                  action={<Link href="/task-management" className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300">All tasks</Link>}
                >
                  {tasks.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">Create tasks to plan SEO work and assign it to people.</p>
                  ) : (
                    <>
                      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
                        {statusCounts.filter((s) => s.count > 0).map((s) => (
                          <div key={s.status} className={statusFill[s.status]} style={{ width: `${(s.count / tasks.length) * 100}%` }} />
                        ))}
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {statusCounts.map((s) => (
                          <div key={s.status}>
                            <dt className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <span className={`size-2 rounded-sm ${statusFill[s.status]}`} aria-hidden /> {statusLabels[s.status]}
                            </dt>
                            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-950 dark:text-white">{s.count}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  )}
                </Panel>
              </div>

              <Panel title="Recent activity" description="The latest chats, posts and tasks">
                {activity.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">Activity will show up here once you start a chat or write a post.</p>
                ) : (
                  <ul className="-mx-2 divide-y divide-slate-100 dark:divide-white/5">
                    {activity.map((a, i) => (
                      <li key={i}>
                        <Link href={a.href} className="block rounded-md px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5">
                          <p className="truncate text-[13.5px] text-slate-900 dark:text-slate-100">{a.text || "Untitled"}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{a.where} · {formatRelativeTime(a.at)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {!nextStep && (
                  <p className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700 dark:bg-white/5 dark:text-slate-300">
                    <CheckCircle2 className="size-4 text-brand-600 dark:text-brand-400" /> Setup is complete.
                  </p>
                )}
                <Link href="/task-management" className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-slate-700 hover:underline dark:text-slate-300">
                  <ClipboardList className="size-3.5" /> Plan the next piece of work
                </Link>
              </Panel>
            </div>
          </div>
        )}
      </DashboardLayout>
    </RequireAuth>
  );
}
