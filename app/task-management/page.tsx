"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import {
  setFilterStatus, setFilterPriority, setFilterAssignee,
  selectTask, updateTaskStatus,
  type TaskStatus, type TaskPriority,
} from "@/lib/store/taskSlice";
import {
  ClipboardList, Users, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Plus, ChevronRight, Calendar, Globe2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";

const priorityStyles: Record<TaskPriority, { badge: string; dot: string }> = {
  urgent: { badge: "bg-red-50 text-red-600 dark:bg-red-400/15 dark:text-red-400", dot: "bg-red-500" },
  high: { badge: "bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400", dot: "bg-amber-400" },
  medium: { badge: "bg-blue-50 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400", dot: "bg-blue-500" },
  low: { badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
};

const statusStyles: Record<TaskStatus, { badge: string; label: string }> = {
  todo: { badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", label: "To Do" },
  in_progress: { badge: "bg-blue-50 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400", label: "In Progress" },
  review: { badge: "bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400", label: "In Review" },
  done: { badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400", label: "Done" },
};

export default function TaskManagementPage() {
  const dispatch = useDispatch();
  const task = useSelector((state: RootState) => state.task);

  const filteredTasks = task.tasks.filter(t => {
    if (task.filterStatus !== "all" && t.status !== task.filterStatus) return false;
    if (task.filterPriority !== "all" && t.priority !== task.filterPriority) return false;
    if (task.filterAssignee !== "all" && t.assignee !== task.filterAssignee) return false;
    return true;
  });

  const selectedTask = task.tasks.find(t => t.id === task.selectedTaskId);
  const selectedComments = task.comments.filter(c => c.taskId === task.selectedTaskId);

  const stats = {
    total: task.tasks.length,
    active: task.tasks.filter(t => t.status === "in_progress").length,
    review: task.tasks.filter(t => t.status === "review").length,
    done: task.tasks.filter(t => t.status === "done").length,
    urgent: task.tasks.filter(t => t.priority === "urgent" && t.status !== "done").length,
  };

  return (
    <RequireAuth>
    <DashboardLayout>
      {/* Hero */}
      <section className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
          <ClipboardList className="size-3.5" />
          Team Workflow
        </div>
        <h1 className="mt-5 text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
          Task{" "}
          <em className="not-italic bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
            Management
          </em>
        </h1>
        <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
          Track SEO engineers&apos; work, assign tasks by audit findings, and monitor progress across all client projects in one place.
        </p>
      </section>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><ClipboardList className="size-4" /> Total</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{stats.total}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Clock className="size-4" /> Active</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{stats.active}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><AlertTriangle className="size-4" /> Urgent</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{stats.urgent}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Users className="size-4" /> Review</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{stats.review}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><CheckCircle2 className="size-4" /> Done</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{stats.done}</div>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Task list */}
        <div className="space-y-6">
          {/* Filters */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"><ClipboardList className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">SEO Tasks</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{filteredTasks.length} tasks shown</p>
                </div>
              </div>
              <Button size="sm"><Plus className="size-3.5" /> New Task</Button>
            </header>
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
              <Select value={task.filterStatus} onValueChange={(v) => dispatch(setFilterStatus(v as TaskStatus | "all"))}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={task.filterPriority} onValueChange={(v) => dispatch(setFilterPriority(v as TaskPriority | "all"))}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={task.filterAssignee} onValueChange={(v) => dispatch(setFilterAssignee(v ?? "all"))}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {task.teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((t) => {
                    const ps = priorityStyles[t.priority];
                    const ss = statusStyles[t.status];
                    return (
                      <TableRow key={t.id} className="cursor-pointer" onClick={() => dispatch(selectTask(t.id))}>
                        <TableCell>
                          <div className="flex items-start gap-2.5">
                            <i className={`mt-1.25 size-2.25 shrink-0 rounded-full ${ps.dot}`} />
                            <div>
                              <strong className="block text-[13px] text-slate-900 dark:text-white">{t.title}</strong>
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1"><Globe2 className="size-3" /> {t.websiteUrl.replace("https://", "")}</span>
                                <span>·</span>
                                <span>{t.workType}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="grid size-7 place-items-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{t.assigneeAvatar}</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.assignee.split(" ")[0]}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2.25 py-1.5 text-[10px] font-bold capitalize ${ps.badge}`}>{t.priority}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2.25 py-1.5 text-[10px] font-bold ${ss.badge}`}>{ss.label}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${t.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{t.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="size-3" /> {t.dueDate.slice(5)}</span>
                        </TableCell>
                        <TableCell><ChevronRight className="size-3.5 text-slate-400" /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </article>

          {/* Team members */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"><Users className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">SEO Team</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{task.teamMembers.length} engineers · {task.teamMembers.filter(m => m.online).length} online</p>
                </div>
              </div>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {task.teamMembers.map(m => (
                <div key={m.id} className="rounded-2xl border border-slate-200 bg-white/65 p-4 dark:border-white/10 dark:bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <span className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-extrabold text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300">
                      {m.avatar}
                      {m.online && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-900" />}
                    </span>
                    <div className="flex-1">
                      <strong className="block text-sm text-slate-900 dark:text-white">{m.name}</strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{m.role}</span>
                    </div>
                  </div>
                  <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">{m.activeTasks}</div>
                      <div className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">Active</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">{m.completedTasks}</div>
                      <div className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">Done</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{m.efficiency}%</div>
                      <div className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">Efficiency</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Task detail panel */}
        <div className="space-y-6">
          {selectedTask ? (
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
                <div className="flex gap-2.75">
                  <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"><ClipboardList className="size-[18px]" /></span>
                  <div>
                    <h3 className="m-0 text-base text-slate-900 dark:text-white">Task Details</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{selectedTask.id}</p>
                  </div>
                </div>
                <Button size="icon-xs" variant="ghost" onClick={() => dispatch(selectTask(null))}>✕</Button>
              </header>
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900 dark:text-white">{selectedTask.title}</h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">{selectedTask.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full px-2.25 py-1.5 text-[10px] font-bold capitalize ${priorityStyles[selectedTask.priority].badge}`}>{selectedTask.priority}</span>
                  <span className={`inline-flex rounded-full px-2.25 py-1.5 text-[10px] font-bold ${statusStyles[selectedTask.status].badge}`}>{statusStyles[selectedTask.status].label}</span>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.25 py-1.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">{selectedTask.workType}</span>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Assignee</span>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{selectedTask.assigneeAvatar}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTask.assignee}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Due Date</span>
                    <span className="mt-1.5 flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200"><Calendar className="size-3.5" /> {selectedTask.dueDate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Website</span>
                    <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400"><Globe2 className="size-3.5" /> {selectedTask.websiteUrl}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Progress</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{selectedTask.progress}%</span>
                  </div>
                  <Progress value={selectedTask.progress} className="mt-2" />
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => dispatch(updateTaskStatus({ id: selectedTask.id, status: "in_progress" }))}>Start</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => dispatch(updateTaskStatus({ id: selectedTask.id, status: "review" }))}>Review</Button>
                  <Button size="sm" className="flex-1" onClick={() => dispatch(updateTaskStatus({ id: selectedTask.id, status: "done" }))}>Complete</Button>
                </div>

                <Separator />

                {/* Comments */}
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Comments ({selectedComments.length})</span>
                  <div className="mt-3 space-y-3">
                    {selectedComments.map(c => (
                      <div key={c.id} className="flex gap-2.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{c.avatar}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.author}</strong>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{c.timestamp}</span>
                          </div>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{c.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="grid size-16 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <ClipboardList className="size-7 text-slate-400" />
                </span>
                <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Select a task to view details</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Click any row in the task list</p>
              </div>
            </article>
          )}

          {/* Workload distribution */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"><TrendingUp className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Workload</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Tasks per engineer</p>
                </div>
              </div>
            </header>
            <div className="p-5 space-y-3.5">
              {task.teamMembers.map(m => {
                const count = task.tasks.filter(t => t.assignee === m.name && t.status !== "done").length;
                const maxCount = Math.max(...task.teamMembers.map(tm => task.tasks.filter(t => t.assignee === tm.name && t.status !== "done").length));
                return (
                  <div key={m.id}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{m.name}</span>
                      <span className="font-bold text-slate-500 dark:text-slate-400">{count} active</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </div>
    </DashboardLayout>
    </RequireAuth>
  );
}
