"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Network, Sparkles, Loader2, CheckCircle2, XCircle, Clock,
  Search, Zap, Send, Terminal, Cpu, Activity, ArrowRight,
  ChevronRight, Trash2, Download, Bot, User, Wrench,
  TrendingUp, Target, Layers, Users, Star, Calendar,
  BarChart3, MapPin, FileText, Lightbulb, AlertCircle,
  CircleDot, Server,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  keywordResearchApi,
  type KeywordResearchJob,
  type KeywordResearchResult,
  type KeywordRecord,
} from "@/lib/keyword-research-api";

// ─── Types ───

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  jobId?: string;
  result?: KeywordResearchResult;
}

interface TaskStep {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
}

// ─── Helpers ───

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

const INTENT_COLORS: Record<string, string> = {
  Informational: "bg-blue-50 text-blue-600",
  Commercial: "bg-purple-50 text-purple-600",
  Transactional: "bg-green-50 text-green-600",
  Navigational: "bg-slate-50 text-slate-600",
  Local: "bg-cyan-50 text-cyan-600",
};

function getKdColor(kd: number): string {
  if (kd < 15) return "text-emerald-600";
  if (kd < 30) return "text-green-600";
  if (kd < 50) return "text-yellow-600";
  if (kd < 70) return "text-orange-600";
  return "text-red-600";
}

function getKdLabel(kd: number): string {
  if (kd < 15) return "Very Easy";
  if (kd < 30) return "Easy";
  if (kd < 50) return "Medium";
  if (kd < 70) return "Hard";
  if (kd < 85) return "Very Hard";
  return "Extreme";
}

// Simulated agent steps for the task panel
const RESEARCH_STEPS: Omit<TaskStep, "id" | "status">[] = [
  { label: "Detecting industry type", detail: "Auto-classifying business vertical" },
  { label: "Generating seed keywords", detail: "Expanding from user input" },
  { label: "Expanding with modifiers", detail: "Question, commercial, transactional, local" },
  { label: "Classifying search intent", detail: "Informational / Commercial / Transactional" },
  { label: "Estimating metrics", detail: "Volume, KD, CPC, traffic potential" },
  { label: "Clustering keywords", detail: "SERP overlap → topic clusters" },
  { label: "Scoring & prioritizing", detail: "Business value × feasibility × traffic" },
  { label: "Analyzing competitors", detail: "Strengths, weaknesses, opportunities" },
  { label: "Identifying quick wins", detail: "Low KD + decent volume" },
  { label: "Mapping SERP features", detail: "Snippets, PAA, AI Overviews" },
  { label: "Building content strategy", detail: "Phased roadmap with page types" },
  { label: "Compiling final report", detail: "JSON output matching schema" },
];

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Main Component ───

function QuasarMcpContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [jobs, setJobs] = useState<KeywordResearchJob[]>([]);
  const [activeJob, setActiveJob] = useState<KeywordResearchJob | null>(null);
  const [taskSteps, setTaskSteps] = useState<TaskStep[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load past jobs
  const loadJobs = useCallback(async () => {
    try {
      const res = await keywordResearchApi.listJobs();
      setJobs(res.jobs);
      const running = res.jobs.find((j) => j.status === "running");
      if (running) {
        setActiveJob(running);
        setIsWorking(true);
      }
    } catch {}
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll running job
  useEffect(() => {
    if (!isWorking || !activeJob) return;
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      if (!activeJob) return;
      try {
        const res = await keywordResearchApi.getJob(activeJob.id);
        setJobs((prev) => prev.map((j) => (j.id === activeJob.id ? res.job : j)));
        setActiveJob(res.job);
        if (res.job.status === "completed") {
          setIsWorking(false);
          // Mark all steps completed
          setTaskSteps((prev) => prev.map((s) => ({ ...s, status: "completed" as const })));
          // Add assistant message with results
          setMessages((prev) => [...prev, {
            id: uid(),
            role: "assistant",
            content: `Research complete! Found **${res.job.result?.meta?.total_keywords ?? 0} keywords** across all categories. The full report is ready below.`,
            timestamp: Date.now(),
            jobId: res.job.id,
            result: res.job.result ?? undefined,
          }]);
        } else if (res.job.status === "failed") {
          setIsWorking(false);
          setTaskSteps((prev) => prev.map((s) => s.status === "running" ? { ...s, status: "failed" as const } : s));
          setMessages((prev) => [...prev, {
            id: uid(),
            role: "assistant",
            content: `Research failed: ${res.job.errorMessage ?? "Unknown error"}`,
            timestamp: Date.now(),
          }]);
        }
      } catch {}
    }, 3000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [isWorking, activeJob]);

  // Simulate step progression while working
  useEffect(() => {
    if (!isWorking) {
      if (stepTimerRef.current) { clearInterval(stepTimerRef.current); stepTimerRef.current = null; }
      return;
    }
    let currentStep = 0;
    stepTimerRef.current = setInterval(() => {
      setTaskSteps((prev) => {
        const next = [...prev];
        if (currentStep < next.length) {
          next[currentStep] = { ...next[currentStep], status: "running" };
        }
        if (currentStep > 0 && currentStep - 1 < next.length) {
          next[currentStep - 1] = { ...next[currentStep - 1], status: "completed" };
        }
        currentStep++;
        return next;
      });
    }, 2500);
    return () => { if (stepTimerRef.current) { clearInterval(stepTimerRef.current); stepTimerRef.current = null; } };
  }, [isWorking]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isWorking) return;

    // Add user message
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Parse intent — keyword research command
    const researchMatch = text.match(/(?:research|keywords?|keyword research|find keywords?)\s*(?:for|on|about)?\s*(.+)/i);
    if (researchMatch || text.toLowerCase().includes("keyword")) {
      const seed = researchMatch?.[1]?.trim() || text;
      // Initialize task steps
      setTaskSteps(RESEARCH_STEPS.map((s) => ({ ...s, id: uid(), status: "pending" as const })));
      setIsWorking(true);

      // Add system message
      setMessages((prev) => [...prev, {
        id: uid(),
        role: "system",
        content: `Starting keyword research for "${seed}"...`,
        timestamp: Date.now(),
      }]);

      try {
        const res = await keywordResearchApi.startResearch({ seed });
        setActiveJob(res.job);
        setJobs((prev) => [res.job, ...prev]);
      } catch (err) {
        setIsWorking(false);
        setTaskSteps([]);
        setMessages((prev) => [...prev, {
          id: uid(),
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to start research"}`,
          timestamp: Date.now(),
        }]);
      }
      return;
    }

    // Default response
    setMessages((prev) => [...prev, {
      id: uid(),
      role: "assistant",
      content: `I can help with keyword research. Try: "research keywords for AI web development" or "find keywords for dentist in Portland"`,
      timestamp: Date.now(),
    }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await keywordResearchApi.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (activeJob?.id === jobId) { setActiveJob(null); setTaskSteps([]); }
    } catch {}
  };

  const completedSteps = taskSteps.filter((s) => s.status === "completed").length;
  const progress = taskSteps.length > 0 ? Math.round((completedSteps / taskSteps.length) * 100) : 0;

  return (
    <div className="-mx-4 -my-8 flex h-[calc(100vh-64px)] flex-col overflow-hidden lg:-mx-9">

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
            <Server className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Quasar MCP
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI SEO Agent Server
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <CircleDot className="size-3 text-emerald-500" />
            Online
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Cpu className="size-3 text-blue-500" />
            {isWorking ? "Processing" : "Idle"}
          </Badge>
        </div>
      </div>

      {/* Main Layout: Left (Tasks) + Right (Chat) */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ─── LEFT: Task Panel ─── */}
        <div className="hidden w-[340px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 md:flex min-h-0">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Agent Activity</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            {/* Active Steps */}
            {taskSteps.length > 0 && (
              <div className="mb-4">
                {/* Progress bar */}
                {isWorking && (
                  <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-blue-700 dark:text-blue-400">Progress</span>
                      <span className="text-blue-600">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
                      <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {taskSteps.map((step, i) => (
                    <TaskStepItem key={step.id} step={step} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Jobs */}
            <div>
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                Past Tasks
              </h3>
              <div className="space-y-1.5">
                {jobs.length === 0 && !isWorking && (
                  <p className="px-2 py-4 text-center text-xs text-slate-400">
                    No tasks yet. Send a message to start.
                  </p>
                )}
                {jobs.map((job) => (
                  <PastJobItem
                    key={job.id}
                    job={job}
                    isActive={activeJob?.id === job.id}
                    onClick={() => {
                      setActiveJob(job);
                      if (job.status === "completed" && job.result) {
                        setMessages((prev) => {
                          const exists = prev.find((m) => m.jobId === job.id);
                          if (exists) return prev;
                          return [...prev, {
                            id: uid(),
                            role: "assistant",
                            content: `Loaded research for "${job.seed}" — ${job.result?.meta?.total_keywords ?? 0} keywords found.`,
                            timestamp: Date.now(),
                            jobId: job.id,
                            result: job.result ?? undefined,
                          }];
                        });
                      }
                    }}
                    onDelete={() => handleDeleteJob(job.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white p-2 dark:bg-slate-800">
                <p className="text-slate-400">Tasks</p>
                <p className="font-bold text-slate-700 dark:text-slate-200">{jobs.length}</p>
              </div>
              <div className="rounded-lg bg-white p-2 dark:bg-slate-800">
                <p className="text-slate-400">Completed</p>
                <p className="font-bold text-emerald-600">{jobs.filter((j) => j.status === "completed").length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Chat Panel ─── */}
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
            <div className="mx-auto max-w-3xl space-y-4">

              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl">
                    <Bot className="size-8" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                    Quasar MCP Server
                  </h2>
                  <p className="mx-auto mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Your AI SEO agent server. Tell it what to research, and it will
                    execute keyword research, clustering, competitor analysis, and
                    content strategy planning.
                  </p>

                  {/* Suggested commands */}
                  <div className="mx-auto max-w-lg space-y-2">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Try these commands</p>
                    {[
                      "Research keywords for AI web development",
                      "Find keywords for dentist in Portland",
                      "Keyword research for CRM software",
                      "Research keywords for SEO agency in New York",
                    ].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => { setInput(cmd); }}
                        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                      >
                        <Terminal className="size-4 text-blue-500" />
                        {cmd}
                        <ArrowRight className="ml-auto size-3.5 text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input Bar */}
          <div className="border-t border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <div className="relative flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Send a command... e.g. 'research keywords for AI web development'"
                  disabled={isWorking}
                  className="min-h-[44px] max-h-[120px] resize-none rounded-xl border-slate-200 bg-white pr-10 text-sm dark:border-slate-700 dark:bg-slate-900"
                  rows={1}
                />
                <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-400">
                  ↵ to send
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isWorking}
                size="icon"
                className="size-[44px] shrink-0 rounded-xl"
              >
                {isWorking ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Task Step Item ───

function TaskStepItem({ step, index }: { step: TaskStep; index: number }) {
  const icons = {
    pending: <Clock className="size-3.5 text-slate-300" />,
    running: <Loader2 className="size-3.5 animate-spin text-blue-500" />,
    completed: <CheckCircle2 className="size-3.5 text-emerald-500" />,
    failed: <XCircle className="size-3.5 text-red-500" />,
  };

  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
      step.status === "running" ? "bg-blue-50 dark:bg-blue-950/30" : ""
    }`}>
      <div className="mt-0.5 shrink-0">
        {icons[step.status]}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${
          step.status === "pending" ? "text-slate-400" :
          step.status === "running" ? "text-blue-700 dark:text-blue-400" :
          step.status === "completed" ? "text-slate-700 dark:text-slate-300" :
          "text-red-600"
        }`}>
          {step.label}
        </p>
        {step.detail && step.status === "running" && (
          <p className="mt-0.5 text-[10px] text-slate-400">{step.detail}</p>
        )}
      </div>
      <span className="text-[10px] text-slate-300">{index + 1}</span>
    </div>
  );
}

// ─── Past Job Item ───

function PastJobItem({ job, isActive, onClick, onDelete }: {
  job: KeywordResearchJob;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const statusConfig = {
    running: { icon: Loader2, color: "text-blue-500", spin: true },
    completed: { icon: CheckCircle2, color: "text-emerald-500", spin: false },
    failed: { icon: XCircle, color: "text-red-500", spin: false },
  };
  const sc = statusConfig[job.status as keyof typeof statusConfig] ?? statusConfig.running;
  const StatusIcon = sc.icon;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-lg border p-2.5 transition-all ${
        isActive
          ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-2">
        <StatusIcon className={`size-3.5 shrink-0 ${sc.color} ${sc.spin ? "animate-spin" : ""}`} />
        <p className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
          {job.seed}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="size-3 text-red-400 hover:text-red-600" />
        </button>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
        {job.result?.meta?.total_keywords && (
          <span className="text-emerald-500">{job.result.meta.total_keywords} keywords</span>
        )}
        {job.location && <span>• {job.location}</span>}
      </div>
    </div>
  );
}

// ─── Chat Message Item ───

function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Wrench className="size-3" />
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${
        isUser
          ? "bg-gradient-to-br from-slate-600 to-slate-800 text-white"
          : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
      }`}>
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* Content */}
      <div className={`flex max-w-[80%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-slate-800 text-white dark:bg-slate-700"
            : "bg-white text-slate-700 shadow-sm border border-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Results */}
        {message.result && <ResultPanel result={message.result} />}

        <span className="mt-1 px-1 text-[10px] text-slate-400">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// ─── Result Panel (inline in chat) ───

function ResultPanel({ result }: { result: KeywordResearchResult }) {
  const [expanded, setExpanded] = useState(false);
  const { meta } = result;

  return (
    <div className="mt-2 w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-3"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Keyword Research Report
          </span>
        </div>
        <ChevronRight className={`size-4 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {/* KPI mini cards */}
      <div className="grid grid-cols-4 gap-2 px-3 pb-3">
        <MiniKpi icon={Search} label="Keywords" value={meta.total_keywords.toString()} color="text-blue-600" />
        <MiniKpi icon={TrendingUp} label="Volume" value={meta.total_monthly_volume.toLocaleString()} color="text-purple-600" />
        <MiniKpi icon={Zap} label="Quick Wins" value={result.quick_wins.length.toString()} color="text-emerald-600" />
        <MiniKpi icon={BarChart3} label="Avg CPC" value={`$${meta.avg_cpc.toFixed(2)}`} color="text-orange-600" />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          {/* Key Findings */}
          {result.kpi_summary.key_findings.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Lightbulb className="size-3.5 text-amber-500" /> Key Findings
              </h4>
              <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                {result.kpi_summary.key_findings.slice(0, 5).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ChevronRight className="mt-0.5 size-3 shrink-0 text-amber-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Primary Keywords */}
          {result.primary_keywords.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Target className="size-3.5 text-red-500" /> Top Primary Keywords
              </h4>
              <div className="space-y-1">
                {result.primary_keywords.slice(0, 8).map((kw, i) => (
                  <KeywordRow key={i} kw={kw} />
                ))}
              </div>
            </div>
          )}

          {/* Topic Clusters */}
          {result.topic_clusters.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Network className="size-3.5 text-purple-500" /> Topic Clusters
              </h4>
              <div className="space-y-2">
                {result.topic_clusters.slice(0, 5).map((cluster, i) => (
                  <div key={i} className="rounded-lg border border-purple-200 bg-purple-50/30 p-2 dark:border-purple-800 dark:bg-purple-950/20">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{cluster.cluster_name}</p>
                    <p className="text-[10px] text-slate-500">Pillar: {cluster.pillar_keyword}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{cluster.total_volume.toLocaleString()} vol</Badge>
                      <Badge variant="outline" className={`text-[10px] ${getKdColor(cluster.avg_kd)}`}>KD {cluster.avg_kd}</Badge>
                      <Badge variant="outline" className="text-[10px]">{cluster.supporting_keywords.length} supporting</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {result.quick_wins.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Zap className="size-3.5 text-emerald-500" /> Quick Wins
              </h4>
              <div className="space-y-1">
                {result.quick_wins.slice(0, 5).map((qw, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-emerald-50/30 px-2 py-1.5 dark:bg-emerald-950/20">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{qw.keyword}</span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-slate-500">{qw.volume.toLocaleString()} vol</span>
                      <span className={getKdColor(qw.kd)}>KD {qw.kd}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitors */}
          {result.competitors.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Users className="size-3.5 text-cyan-500" /> Competitors
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {result.competitors.slice(0, 4).map((comp, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{comp.name}</p>
                    {comp.domain_rating && <p className="text-[10px] text-slate-500">DR {comp.domain_rating}</p>}
                    <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">{comp.opportunity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERP Features */}
          {result.serp_features.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Star className="size-3.5 text-yellow-500" /> SERP Features
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.serp_features.map((sf, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {sf.feature} ({sf.keyword_count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mini KPI ───

function MiniKpi({ icon: Icon, label, value, color }: { icon: typeof Search; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
      <Icon className={`size-3.5 ${color}`} />
      <p className="mt-1 text-[10px] text-slate-400">{label}</p>
      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

// ─── Keyword Row ───

function KeywordRow({ kw }: { kw: KeywordRecord }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-slate-800/50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{kw.keyword}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Badge variant="outline" className={`h-4 text-[9px] ${INTENT_COLORS[kw.intent] ?? ""}`}>{kw.intent}</Badge>
          <Badge variant="outline" className={`h-4 text-[9px] ${PRIORITY_COLORS[kw.priority] ?? ""}`}>{kw.priority}</Badge>
        </div>
      </div>
      <div className="ml-2 shrink-0 text-right text-[10px]">
        <p className="text-slate-700 dark:text-slate-300">{kw.volume.toLocaleString()}</p>
        <p className={getKdColor(kw.kd)}>KD {kw.kd}</p>
      </div>
    </div>
  );
}

// ─── Page Export ───

export default function ContentStrategyPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <QuasarMcpContent />
      </DashboardLayout>
    </RequireAuth>
  );
}
