"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  TrendingUp, TrendingDown, FileSearch, ClipboardList, Plug, PenLine,
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Activity,
  Users, Zap, BarChart3, Globe2,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/ui/metric-card";

const auditTrend = [42, 55, 48, 67, 72, 80, 76, 88, 92, 85, 98, 110];
const scoreTrend = [58, 62, 65, 68, 70, 72, 75, 76, 78, 80, 79, 82];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const recentActivity = [
  { icon: FileSearch, text: "Audit completed for client-a.com", time: "2 min ago", color: "text-blue-600 dark:text-blue-400" },
  { icon: ClipboardList, text: "Arjun Patel started task: Fix robots.txt blocking", time: "15 min ago", color: "text-blue-600 dark:text-blue-400" },
  { icon: PenLine, text: "New post generated: 'ai seo audit tool'", time: "1 hour ago", color: "text-amber-600 dark:text-amber-400" },
  { icon: Plug, text: "MCP server 'quasar-audit-engine' reconnected", time: "text-blue-600 dark:text-blue-400" },
  { icon: AlertTriangle, text: "5xx errors detected on client-a.com/products/*", time: "3 hours ago", color: "text-red-600 dark:text-red-400" },
  { icon: CheckCircle2, text: "Sarah Chen completed keyword gap analysis", time: "5 hours ago", color: "text-blue-600 dark:text-blue-400" },
];

export default function DashboardPage() {
  const mcp = useSelector((state: RootState) => state.mcp);
  const post = useSelector((state: RootState) => state.post);
  const task = useSelector((state: RootState) => state.task);

  const activeTasks = task.tasks.filter(t => t.status !== "done").length;
  const doneTasks = task.tasks.filter(t => t.status === "done").length;
  const urgentTasks = task.tasks.filter(t => t.priority === "urgent" && t.status !== "done").length;
  const onlineMembers = task.teamMembers.filter(m => m.online).length;

  const maxAudit = Math.max(...auditTrend);
  const maxScore = 100;

  return (
    <RequireAuth>
    <DashboardLayout>
      {/* Hero */}
      <section className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
          <Activity className="size-3.5" />
          Overview
        </div>
        <h1 className="mt-5 text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
          Dashboard{" "}
          <em className="not-italic bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Overview
          </em>
        </h1>
        <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
          Monitor your SEO operations, track team progress, and keep an eye on audit performance across all client projects.
        </p>
      </section>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Audits"
          value="1,284"
          icon={FileSearch}
          trend="+12.8%"
          trendUp
          sparklineData={auditTrend}
          color="#3b82f6"
        />
        <MetricCard
          label="Tasks"
          value={task.tasks.length.toString()}
          icon={ClipboardList}
          trend={`${activeTasks} active`}
          trendUp={activeTasks < 10}
          sparklineData={[doneTasks, activeTasks, urgentTasks, task.tasks.length]}
          color="#8b5cf6"
        />
        <MetricCard
          label="Team"
          value={task.teamMembers.length.toString()}
          icon={Users}
          trend={`${onlineMembers} online`}
          trendUp
          sparklineData={task.teamMembers.map(m => (m.online ? 1 : 0))}
          color="#10b981"
        />
        <MetricCard
          label="Credits"
          value="14"
          icon={Zap}
          trend="14 days left"
          trendUp={false}
          sparklineData={[12, 13, 14, 14, 14, 13, 14]}
          color="#f59e0b"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left column — charts */}
        <div className="space-y-6">
          {/* Audit trend chart */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><BarChart3 className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Audit Performance</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Monthly audits generated over the past year</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-400/15 dark:text-blue-400 dark:border-transparent">+18% YoY</Badge>
            </header>
            <div className="p-6">
              <div className="flex items-end justify-between gap-2 h-[200px]">
                {auditTrend.map((val, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full items-end justify-center" style={{ height: "160px" }}>
                      <div
                        className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-blue-600/40 via-purple-600 to-blue-500 transition-all hover:from-blue-600 hover:to-pink-500 shadow-sm"
                        style={{ height: `${(val / maxAudit) * 100}%` }}
                        title={`${val} audits`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{months[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Score trend + task distribution */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Score trend */}
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <header className="border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
                <div className="flex gap-2.75">
                  <span className="grid size-9 place-items-center rounded-[12px] bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400"><TrendingUp className="size-[18px]" /></span>
                  <div>
                    <h3 className="m-0 text-base text-slate-900 dark:text-white">Avg. Score Lift</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">After recommendations</p>
                  </div>
                </div>
              </header>
              <div className="p-6">
                <div className="flex items-end gap-1.5 h-[140px]">
                  {scoreTrend.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-purple-500/30 via-blue-500 to-pink-500"
                        style={{ height: `${(val / maxScore) * 100}%` }}
                        title={`${val}/100`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">82<span className="text-sm text-slate-400">/100</span></span>
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"><TrendingUp className="size-3" /> +24 pts</span>
                </div>
              </div>
            </article>

            {/* Task status distribution */}
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <header className="border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
                <div className="flex gap-2.75">
                  <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><ClipboardList className="size-[18px]" /></span>
                  <div>
                    <h3 className="m-0 text-base text-slate-900 dark:text-white">Task Status</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Current sprint</p>
                  </div>
                </div>
              </header>
              <div className="p-6 space-y-3.5">
                {[
                  { label: "To Do", count: task.tasks.filter(t => t.status === "todo").length, color: "from-slate-400 to-slate-500" },
                  { label: "In Progress", count: task.tasks.filter(t => t.status === "in_progress").length, color: "from-blue-400 to-blue-500" },
                  { label: "In Review", count: task.tasks.filter(t => t.status === "review").length, color: "from-amber-400 to-amber-500" },
                  { label: "Done", count: task.tasks.filter(t => t.status === "done").length, color: "from-blue-500 to-purple-600" },
                ].map(s => {
                  const pct = task.tasks.length > 0 ? (s.count / task.tasks.length) * 100 : 0;
                  return (
                    <div key={s.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{s.label}</span>
                        <span className="font-bold text-slate-500 dark:text-slate-400">{s.count}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full rounded-full bg-gradient-to-r ${s.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          {/* Quick links */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Globe2 className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Quick Actions</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Jump to any workspace</p>
                </div>
              </div>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/create_audit_report", icon: FileSearch, label: "Create Audit", desc: "Run a new SEO audit" },
                { href: "/audit-mcp", icon: Plug, label: "Audit MCP", desc: `${mcp.servers.length} servers connected` },
                { href: "/post-create", icon: PenLine, label: "Post Create", desc: `${post.contentHistory.length} posts generated` },
                { href: "/task-management", icon: ClipboardList, label: "Tasks", desc: `${activeTasks} active tasks` },
              ].map(link => (
                <Link key={link.href} href={link.href} className="group rounded-2xl border border-slate-200 bg-white/65 p-4 transition-all hover:border-blue-300 hover:shadow-[0_8px_24px_rgba(217,70,239,0.12)] dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-blue-400/30">
                  <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400">
                    <link.icon className="size-[18px]" />
                  </span>
                  <strong className="mt-3 block text-sm text-slate-900 dark:text-white">{link.label}</strong>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{link.desc}</p>
                  <span className="mt-2 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowUpRight className="size-3" />
                  </span>
                </Link>
              ))}
            </div>
          </article>
        </div>

        {/* Right column — activity & team */}
        <div className="space-y-6">
          {/* Recent activity */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Activity className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Recent Activity</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Latest events across projects</p>
                </div>
              </div>
            </header>
            <div className="p-5 space-y-1">
              {recentActivity.map((act, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <act.icon className={`size-4 shrink-0 mt-0.5 ${act.color}`} />
                  <div className="flex-1">
                    <p className="text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">{act.text}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Team performance */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400"><Users className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Team Performance</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Efficiency this month</p>
                </div>
              </div>
            </header>
            <div className="p-5 space-y-4">
              {task.teamMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="relative grid size-9 place-items-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {m.avatar}
                    {m.online && <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-blue-500 dark:border-slate-900" />}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.name}</strong>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{m.efficiency}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500" style={{ width: `${m.efficiency}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* MCP status */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Plug className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">MCP Status</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Server & tools</p>
                </div>
              </div>
            </header>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Servers</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 dark:text-white">{mcp.servers.length}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    <span className="size-1.5 rounded-full bg-blue-500" /> {mcp.servers.filter(s => s.status === "connected").length} live
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tools enabled</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{mcp.tools.filter(t => t.enabled).length}/{mcp.tools.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Port</span>
                <span className="flex items-center gap-2">
                  <code className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">:{mcp.port}</code>
                  <Badge className={mcp.isRunning ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-400/15 dark:text-blue-400 dark:border-transparent" : ""}>{mcp.isRunning ? "Running" : "Stopped"}</Badge>
                </span>
              </div>
              <Link href="/audit-mcp">
                <Button variant="outline" size="sm" className="mt-2 w-full hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-400/10">Manage MCP servers <ArrowUpRight className="size-3.5" /></Button>
              </Link>
            </div>
          </article>
        </div>
      </div>
    </DashboardLayout>
    </RequireAuth>
  );
}
