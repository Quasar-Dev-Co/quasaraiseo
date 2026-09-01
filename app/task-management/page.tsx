"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ClipboardList, Users, CheckCircle2, Clock, AlertTriangle,
  Plus, Calendar, Globe2, X, Search, FileSpreadsheet,
  Loader2, AlertCircle, RefreshCw, Trash2, ExternalLink,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinLoading } from "@/lib/use-min-loading";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { googleApi, type GoogleStatus, type GoogleSheet } from "@/lib/google-api";
import {
  taskApi,
  type SeoTask as ApiSeoTask,
  type TaskPriority,
  type TaskStatus,
  type WorkType,
  type CreateTaskInput,
} from "@/lib/task-api";
import { useAuth } from "@/hooks/use-auth";

const priorityStyles: Record<TaskPriority, { badge: string; dot: string; ring: string }> = {
  urgent: { badge: "bg-red-50 text-red-600 dark:bg-red-400/15 dark:text-red-400", dot: "bg-red-500", ring: "ring-red-400/30" },
  high: { badge: "bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400", dot: "bg-amber-400", ring: "ring-amber-400/30" },
  medium: { badge: "bg-blue-50 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400", dot: "bg-blue-500", ring: "ring-blue-400/30" },
  low: { badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400", ring: "ring-slate-400/30" },
};

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; border: string }> = {
  todo: { label: "To Do", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/40", border: "border-slate-200 dark:border-white/5" },
  in_progress: { label: "In Progress", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/50 dark:bg-blue-400/5", border: "border-blue-200 dark:border-blue-400/10" },
  review: { label: "In Review", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-400/5", border: "border-amber-200 dark:border-amber-400/10" },
  done: { label: "Done", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/50 dark:bg-blue-400/5", border: "border-blue-200 dark:border-blue-400/10" },
};

const columnOrder: TaskStatus[] = ["todo", "in_progress", "review", "done"];

const workTypes: WorkType[] = [
  "Technical SEO", "Content Optimization", "Link Building",
  "Keyword Research", "Site Audit", "On-page SEO",
  "Schema Markup", "Core Web Vitals",
];

function getInitials(name: string): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function TaskManagementPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<ApiSeoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinLoading(loading, 800);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [showNewTask, setShowNewTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [showSheetPanel, setShowSheetPanel] = useState(false);
  const [deletingSheetId, setDeletingSheetId] = useState<string | null>(null);
  const [newSheet, setNewSheet] = useState({
    title: "",
    sheetTabName: "Tasks",
    locale: "en_US",
    timeZone: "UTC",
  });

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: "medium" as TaskPriority,
    workType: "Technical SEO" as WorkType,
    websiteUrl: "",
    dueDate: "",
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskApi.getTasks();
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSheets = useCallback(async () => {
    try {
      const sheetList = await googleApi.getSheets();
      setSheets(sheetList);
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Failed to fetch sheets");
    }
  }, []);

  const fetchGoogleData = useCallback(async () => {
    try {
      const s = await googleApi.getStatus();
      setGoogleStatus(s);
      if (s.connected) {
        const sheetList = await googleApi.getSheets();
        setSheets(sheetList);
      }
    } catch {
      // ignore status fetch errors
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchGoogleData();
  }, [fetchTasks, fetchGoogleData]);

  const assignees = Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean)));

  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
    return true;
  });

  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => t.status === "in_progress").length,
    review: tasks.filter(t => t.status === "review").length,
    done: tasks.filter(t => t.status === "done").length,
    urgent: tasks.filter(t => t.priority === "urgent" && t.status !== "done").length,
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(col);
  };

  const handleDrop = async (col: TaskStatus) => {
    if (draggedTaskId) {
      const taskId = draggedTaskId;
      setDraggedTaskId(null);
      setDragOverCol(null);
      setTasks(prev => {
        const next = prev.map(t => t.id === taskId ? { ...t, status: col, progress: col === "done" ? 100 : t.progress } : t);
        void syncTasksToSelectedSheet(selectedSheet, next, true);
        return next;
      });
      try {
        await taskApi.updateTask(taskId, { status: col, progress: col === "done" ? 100 : undefined });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update task");
        fetchTasks();
      }
    }
  };

  const syncTasksToSelectedSheet = useCallback(async (sheetId = selectedSheet, taskList = tasks, quiet = false) => {
    if (!sheetId) return;
    if (!quiet) setSyncing(true);
    try {
      const sheet = sheets.find(s => s.id === sheetId);
      const rows = taskList.map(t => ({
        title: t.title,
        description: t.description,
        assignee: t.assignee,
        priority: t.priority,
        status: t.status,
        workType: t.workType,
        websiteUrl: t.websiteUrl,
        dueDate: t.dueDate,
        progress: t.progress,
        tags: t.tags.join(", "),
      } as Record<string, string | number | undefined>));
      await googleApi.writeAuditTemplate(sheetId, rows, sheet?.sheetTabName ?? "Tasks");
      if (!quiet) setSyncMsg("Synced tasks to Google Sheets");
    } catch (e) {
      if (!quiet) setSyncMsg(e instanceof Error ? e.message : "Failed to sync tasks");
    } finally {
      if (!quiet) setSyncing(false);
    }
  }, [selectedSheet, sheets]);

  const handlePullFromSheet = async () => {
    if (!selectedSheet) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const rows = await googleApi.importTasksFromSheet(selectedSheet);
      const pulled = rows
        .filter((r: Record<string, string | number>) => {
          const v = String(r.title ?? "").trim();
          return v && v.toLowerCase() !== "task / page";
        })
        .map((r: Record<string, string | number>) => ({
          id: "",
          title: String(r.title ?? "New Task").trim(),
          description: String(r.description ?? r.progressNote ?? "").trim(),
          assignee: String(r.assignee ?? "").trim(),
          priority: ["low", "medium", "high", "urgent"].includes(String(r.priority ?? "").toLowerCase())
            ? (String(r.priority).toLowerCase() as TaskPriority)
            : "medium",
          status: ["todo", "in_progress", "review", "done"].includes(String(r.status ?? "").toLowerCase())
            ? (String(r.status).toLowerCase() as TaskStatus)
            : "todo",
          workType: String(r.workType ?? r.type ?? "Technical SEO").trim() || "Technical SEO",
          websiteUrl: String(r.websiteUrl ?? r.for ?? "").trim() || "https://example.com",
          dueDate: String(r.dueDate ?? "").trim() || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          progress: 0,
          tags: r.tags ? [String(r.tags)] : [],
          comments: [],
        }));
      if (pulled.length > 0) {
        for (const t of pulled) {
          if (!t.title || !t.title.replace(/new task/i, "").trim()) continue;
          const created = await taskApi.createTask(t);
          setTasks(prev => [created, ...prev]);
        }
        setSyncMsg(`Pulled ${pulled.length} tasks from Google Sheets`);
      } else {
        setSyncMsg("No new tasks found in sheet");
      }
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Failed to pull from sheet");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title) return;
    setSubmitting(true);
    setError(null);
    try {
      const input: CreateTaskInput = {
        title: newTask.title,
        description: newTask.description,
        assignee: newTask.assignee,
        priority: newTask.priority,
        status: "todo",
        workType: newTask.workType,
        websiteUrl: newTask.websiteUrl || "https://example.com",
        dueDate: newTask.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        tags: [],
      };
      const created = await taskApi.createTask(input);
      const nextTasks = [created, ...tasks];
      setTasks(nextTasks);
      setNewTask({ title: "", description: "", assignee: "", priority: "medium", workType: "Technical SEO", websiteUrl: "", dueDate: "" });
      setShowNewTask(false);
      void syncTasksToSelectedSheet(selectedSheet, nextTasks, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === taskId ? { ...t, status, progress: status === "done" ? 100 : t.progress } : t);
      void syncTasksToSelectedSheet(selectedSheet, next, true);
      return next;
    });
    try {
      await taskApi.updateTask(taskId, { status, progress: status === "done" ? 100 : undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update task");
      fetchTasks();
    }
  };

  const handleUpdateProgress = async (taskId: string, progress: number) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === taskId ? { ...t, progress } : t);
      void syncTasksToSelectedSheet(selectedSheet, next, true);
      return next;
    });
    try {
      await taskApi.updateTask(taskId, { progress });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update progress");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      setSelectedTaskId(null);
      void syncTasksToSelectedSheet(selectedSheet, next, true);
      return next;
    });
    try {
      await taskApi.deleteTask(taskId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete task");
      fetchTasks();
    }
  };

  const handleAddComment = async (taskId: string) => {
    if (!commentText.trim() || !user) return;
    setSubmitting(true);
    try {
      const comment = await taskApi.addComment(taskId, user.name, commentText.trim());
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t));
      setCommentText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncToSheets = async () => {
    if (!selectedSheet) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const tasksData = tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assignee: t.assignee,
        priority: t.priority,
        status: t.status,
        workType: t.workType,
        websiteUrl: t.websiteUrl,
        dueDate: t.dueDate,
        progress: t.progress,
        tags: t.tags.join(", "),
      }));
      const result = await googleApi.writeTasksToSheet(selectedSheet, tasksData);
      setSyncMsg(`Synced ${result.rowsWritten - 1} tasks to Google Sheets (${result.updatedCells} cells updated)`);
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateSheet = async () => {
    if (!newSheet.title) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await googleApi.createTaskSheet(newSheet.title, {
        sheetTabName: newSheet.sheetTabName || "Tasks",
        locale: newSheet.locale || "en_US",
        timeZone: newSheet.timeZone || "UTC",
      });
      setSyncMsg(`Created "${newSheet.title}" successfully`);
      setNewSheet({ title: "", sheetTabName: "Tasks", locale: "en_US", timeZone: "UTC" });
      setShowSheetModal(false);
      await fetchSheets();
      setSelectedSheet(result.spreadsheetId);
      void syncTasksToSelectedSheet(result.spreadsheetId, tasks, false);
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Failed to create sheet");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteSheet = async (sheetId: string, sheetName: string) => {
    if (!confirm(`Delete "${sheetName}"? This cannot be undone.`)) return;
    setDeletingSheetId(sheetId);
    setSyncMsg(null);
    try {
      await googleApi.deleteSheet(sheetId);
      setSheets(prev => prev.filter(s => s.id !== sheetId));
      if (selectedSheet === sheetId) setSelectedSheet("");
      setSyncMsg(`Deleted "${sheetName}"`);
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Failed to delete sheet");
    } finally {
      setDeletingSheetId(null);
    }
  };

  return (
    <RequireAuth>
    <DashboardLayout>
      {/* Hero */}
      <section className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
          <ClipboardList className="size-3.5" />
          Execution Hub
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
              Task{" "}
              <em className="not-italic bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Management
              </em>
            </h1>
            <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              Track, assign, and execute technical SEO recommendations. Sync bidirectionally with Google Sheets, drag-and-drop tasks across workflow columns, and monitor team performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-900">
              <button
                onClick={() => setView("board")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === "board" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
              >
                Board
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
              >
                List
              </button>
            </div>
            <Button size="sm" onClick={() => setShowNewTask(!showNewTask)}>
              <Plus className="size-3.5" /> New Task
            </Button>
          </div>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="size-4" /></button>
        </div>
      )}

      {/* Loading state */}
      {showSkeleton ? (
        <div className="px-6 py-8 lg:px-8">
          {/* Stats skeleton */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-[18px] border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/60">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-2 h-8 w-12" />
              </div>
            ))}
          </div>
          {/* Table skeleton */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-4 dark:border-slate-700">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: "Total", value: stats.total, icon: ClipboardList },
              { label: "Active", value: stats.active, icon: Clock },
              { label: "Urgent", value: stats.urgent, icon: AlertTriangle },
              { label: "Review", value: stats.review, icon: Users },
              { label: "Done", value: stats.done, icon: CheckCircle2 },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <article key={s.label} className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Icon className="size-4" /> {s.label}</div>
                  <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{s.value}</div>
                </article>
              );
            })}
          </div>

          {/* Google Sheets sync bar */}
          {googleStatus?.connected && googleStatus.services.sheets ? (
            <div className="mb-6 rounded-2xl border border-blue-200/60 bg-blue-50/50 px-5 py-4 dark:border-blue-400/20 dark:bg-blue-400/5">
              <div className="flex flex-wrap items-center gap-3">
                <FileSpreadsheet className="size-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Google Sheets</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-400/15 dark:text-blue-400">
                  {sheets.length} sheet{sheets.length !== 1 ? "s" : ""}
                </span>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                >
                  <option value="">Select a sheet...</option>
                  {sheets.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={handleSyncToSheets} disabled={syncing || !selectedSheet}>
                  {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  Sync Tasks
                </Button>
                <Button size="sm" variant="outline" onClick={handlePullFromSheet} disabled={syncing || !selectedSheet}>
                  {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <FileSpreadsheet className="size-3.5" />}
                  Pull from Sheet
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSheetPanel(!showSheetPanel)}>
                  <FileSpreadsheet className="size-3.5" /> Manage
                </Button>
                {/* "New Sheet" button hidden for now — will re-enable later
                <Button size="sm" onClick={() => setShowSheetModal(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <Plus className="size-3.5" /> New Sheet
                </Button>
                */}
                {syncMsg && (
                  <span className={`text-xs font-semibold ${syncMsg.includes("Synced") || syncMsg.includes("Created") || syncMsg.includes("Deleted") || syncMsg.includes("Pulled") ? "text-blue-600 dark:text-blue-400" : "text-red-500"}`}>
                    {syncMsg}
                  </span>
                )}
              </div>

              {/* Sheet management panel */}
              {showSheetPanel && (
                <div className="mt-4 border-t border-blue-200/40 pt-4 dark:border-blue-400/10">
                  {sheets.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No sheets found. Create a new sheet to get started.</p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {sheets.map((s) => (
                        <div
                          key={s.id}
                          className={`group flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${selectedSheet === s.id ? "border-blue-400 bg-blue-50/40 dark:bg-blue-400/5" : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50"}`}
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                            <FileSpreadsheet className="size-4.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{s.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(s.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={`https://docs.google.com/spreadsheets/d/${s.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteSheet(s.id, s.name)}
                              disabled={deletingSheetId === s.id}
                              className="grid size-7 place-items-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10"
                            >
                              {deletingSheetId === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* New Sheet Modal */}
          {showSheetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowSheetModal(false)}>
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
              <div
                className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
                onClick={e => e.stopPropagation()}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                      <FileSpreadsheet className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Google Sheet</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure your new spreadsheet</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSheetModal(false)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white">
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Spreadsheet Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      placeholder="e.g. SEO Tasks Q1 2026"
                      value={newSheet.title}
                      onChange={e => setNewSheet({ ...newSheet, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Sheet Tab Name
                    </label>
                    <input
                      placeholder="e.g. Tasks, Backlog, Sprint"
                      value={newSheet.sheetTabName}
                      onChange={e => setNewSheet({ ...newSheet, sheetTabName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">The name of the first tab inside the spreadsheet</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Locale
                      </label>
                      <select
                        value={newSheet.locale}
                        onChange={e => setNewSheet({ ...newSheet, locale: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="en_US">English (US)</option>
                        <option value="en_GB">English (UK)</option>
                        <option value="es_ES">Spanish</option>
                        <option value="fr_FR">French</option>
                        <option value="de_DE">German</option>
                        <option value="pt_BR">Portuguese (BR)</option>
                        <option value="ja_JP">Japanese</option>
                        <option value="zh_CN">Chinese (Simplified)</option>
                        <option value="hi_IN">Hindi</option>
                        <option value="ar_SA">Arabic</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Time Zone
                      </label>
                      <select
                        value={newSheet.timeZone}
                        onChange={e => setNewSheet({ ...newSheet, timeZone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">US Eastern</option>
                        <option value="America/Chicago">US Central</option>
                        <option value="America/Denver">US Mountain</option>
                        <option value="America/Los_Angeles">US Pacific</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Dubai">Dubai</option>
                        <option value="Asia/Kolkata">India</option>
                        <option value="Asia/Dhaka">Dhaka</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                        <option value="Australia/Sydney">Sydney</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button size="sm" onClick={handleCreateSheet} disabled={!newSheet.title || syncing}>
                    {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                    Create Sheet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSheetModal(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {/* New task form */}
          {showNewTask && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Task</h3>
                <button onClick={() => setShowNewTask(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="size-4" /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
                <input
                  placeholder="Assignee name"
                  value={newTask.assignee}
                  onChange={e => setNewTask({ ...newTask, assignee: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
                <textarea
                  placeholder="Description"
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="col-span-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  rows={2}
                />
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
                <select
                  value={newTask.workType}
                  onChange={e => setNewTask({ ...newTask, workType: e.target.value as WorkType })}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                >
                  {workTypes.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <input
                  placeholder="https://example.com"
                  value={newTask.websiteUrl}
                  onChange={e => setNewTask({ ...newTask, websiteUrl: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleCreateTask} disabled={!newTask.title || submitting}>
                  {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  Create Task
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewTask(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Filters bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as TaskPriority | "all")}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAssignee} onValueChange={(v) => setFilterAssignee(v ?? "all")}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {assignees.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {view === "board" ? (
            /* Kanban Board */
            <div className="grid gap-4 lg:grid-cols-4">
              {columnOrder.map((col) => {
                const colTasks = filteredTasks.filter(t => t.status === col);
                const cfg = statusConfig[col];
                return (
                  <div
                    key={col}
                    onDragOver={(e) => handleDragOver(e, col)}
                    onDragLeave={() => setDragOverCol(null)}
                    onDrop={() => handleDrop(col)}
                    className={`rounded-2xl border-2 p-3 transition-all ${dragOverCol === col ? "border-blue-400 bg-blue-50/30 dark:bg-blue-400/5" : cfg.border + " " + cfg.bg}`}
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${col === "todo" ? "bg-slate-400" : col === "in_progress" ? "bg-blue-500" : col === "review" ? "bg-amber-400" : "bg-blue-500"}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {colTasks.map((t) => {
                        const ps = priorityStyles[t.priority];
                        return (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={() => handleDragStart(t.id)}
                            onClick={() => setSelectedTaskId(t.id)}
                            className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:shadow-md active:cursor-grabbing dark:border-white/10 dark:bg-slate-900 ${draggedTaskId === t.id ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`mt-1 size-2 shrink-0 rounded-full ${ps.dot}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-bold leading-snug text-slate-900 dark:text-white">{t.title}</p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${ps.badge}`}>{t.priority}</span>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{t.workType}</span>
                                </div>
                                {t.websiteUrl && (
                                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                                    <span className="flex items-center gap-1"><Globe2 className="size-3" /> {t.websiteUrl.replace("https://", "")}</span>
                                  </div>
                                )}
                                <div className="mt-2.5 flex items-center justify-between">
                                  {t.assignee && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="grid size-6 place-items-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{getInitials(t.assignee)}</span>
                                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{t.assignee.split(" ")[0]}</span>
                                    </div>
                                  )}
                                  {t.progress > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: `${t.progress}%` }} />
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-400">{t.progress}%</span>
                                    </div>
                                  )}
                                </div>
                                {t.dueDate && (
                                  <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                    <Calendar className="size-3" /> {t.dueDate}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {colTasks.length === 0 && (
                        <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-[11px] font-semibold text-slate-300 dark:border-white/5 dark:text-slate-600">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5">
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Task</th>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Assignee</th>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Priority</th>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Progress</th>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {filteredTasks.map((t) => {
                        const ps = priorityStyles[t.priority];
                        const sc = statusConfig[t.status];
                        return (
                          <tr
                            key={t.id}
                            className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                            onClick={() => setSelectedTaskId(t.id)}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-start gap-2.5">
                                <span className={`mt-1 size-2 shrink-0 rounded-full ${ps.dot}`} />
                                <div>
                                  <strong className="block text-[13px] text-slate-900 dark:text-white">{t.title}</strong>
                                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                    {t.websiteUrl && <span className="flex items-center gap-1"><Globe2 className="size-3" /> {t.websiteUrl.replace("https://", "")}</span>}
                                    <span>·</span>
                                    <span>{t.workType}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              {t.assignee && (
                                <div className="flex items-center gap-2">
                                  <span className="grid size-7 place-items-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{getInitials(t.assignee)}</span>
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.assignee.split(" ")[0]}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${ps.badge}`}>{t.priority}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${sc.color}`}>{sc.label}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                  <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: `${t.progress}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{t.progress}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                              {t.dueDate && <span className="flex items-center gap-1"><Calendar className="size-3" /> {t.dueDate.slice(5)}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Empty state */}
              {filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="grid size-16 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <ClipboardList className="size-7 text-slate-400" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">No tasks found</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Create a new task to get started</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Task detail slide-over */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedTaskId(null)}>
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
          <div
            className="relative h-full w-full max-w-[420px] overflow-y-auto border-l border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/5 dark:bg-slate-950/95">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><ClipboardList className="size-4" /></span>
                <div>
                  <h3 className="m-0 text-sm font-bold text-slate-900 dark:text-white">Task Details</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">{selectedTask.id.slice(0, 8)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleDeleteTask(selectedTask.id)} className="grid size-8 place-items-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10">
                  <Trash2 className="size-4" />
                </button>
                <button onClick={() => setSelectedTaskId(null)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"><X className="size-4" /></button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-[15px] font-bold text-slate-900 dark:text-white">{selectedTask.title}</h4>
                {selectedTask.description && (
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">{selectedTask.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${priorityStyles[selectedTask.priority].badge}`}>{selectedTask.priority}</span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusConfig[selectedTask.status].color}`}>{statusConfig[selectedTask.status].label}</span>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">{selectedTask.workType}</span>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Assignee</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{getInitials(selectedTask.assignee)}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTask.assignee || "Unassigned"}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Due Date</span>
                  <span className="mt-1.5 flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200"><Calendar className="size-3.5" /> {selectedTask.dueDate || "No due date"}</span>
                </div>
                {selectedTask.websiteUrl && (
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Website</span>
                    <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400"><Globe2 className="size-3.5" /> {selectedTask.websiteUrl}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Progress</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{selectedTask.progress}%</span>
                </div>
                <Progress value={selectedTask.progress} className="mt-2" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selectedTask.progress}
                  onChange={e => handleUpdateProgress(selectedTask.id, Number(e.target.value))}
                  className="mt-3 w-full accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {columnOrder.map(col => (
                  <button
                    key={col}
                    onClick={() => handleUpdateStatus(selectedTask.id, col)}
                    className={`rounded-lg px-2 py-2 text-[10px] font-bold transition ${selectedTask.status === col ? statusConfig[col].color + " ring-2 " + (col === "todo" ? "ring-slate-300" : col === "in_progress" ? "ring-blue-300" : col === "review" ? "ring-amber-300" : "ring-blue-300") : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}
                  >
                    {statusConfig[col].label}
                  </button>
                ))}
              </div>

              <Separator />

              {/* Comments */}
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Comments ({selectedTask.comments.length})</span>
                <div className="mt-3 space-y-3">
                  {selectedTask.comments.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{getInitials(c.author)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.author}</strong>
                          <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{c.message}</p>
                      </div>
                    </div>
                  ))}
                  {selectedTask.comments.length === 0 && (
                    <p className="text-[11px] text-slate-400">No comments yet.</p>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(selectedTask.id); } }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                  <Button size="sm" onClick={() => handleAddComment(selectedTask.id)} disabled={!commentText.trim() || submitting}>
                    {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
    </RequireAuth>
  );
}
