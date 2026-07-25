"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, FileArchive, Sparkles, Loader2, FileText, Download,
  Trash2, Zap, CheckCircle2, XCircle, Clock, Package, Brain,
  ArrowRight, FileSpreadsheet, FileImage, File as FileIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  agentApi,
  type AgentJobRecord,
  type AgentJobStatus,
  type GeneratedFileRecord,
  type ModelRecord,
  type SkillRecord,
} from "@/lib/agent-api";

const STATUS_CONFIG: Record<AgentJobStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  running: { label: "Running", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  image: FileImage,
  other: FileIcon,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AuditMcpPage() {
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [jobs, setJobs] = useState<AgentJobRecord[]>([]);
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("glm-5.2");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [skillsRes, jobsRes] = await Promise.all([agentApi.listSkills(), agentApi.listJobs()]);
      setSkills(skillsRes.skills);
      setJobs(jobsRes.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    agentApi.listModels().then((res) => setModels(res.models)).catch(() => {});
  }, []);

  const hasRunningJobs = jobs.some((j) => j.status === "pending" || j.status === "running");

  useEffect(() => {
    if (hasRunningJobs) {
      if (pollRef.current) return;
      pollRef.current = setInterval(loadData, 3000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [hasRunningJobs, loadData]);

  const handleUploadSkill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadError(null);
    try { await agentApi.uploadSkill(file); await loadData(); }
    catch (err) { setUploadError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("Delete this skill?")) return;
    try { await agentApi.deleteSkill(id); if (selectedSkillId === id) setSelectedSkillId(null); await loadData(); }
    catch (err) { setError(err instanceof Error ? err.message : "Delete failed"); }
  };

  const handleSubmitJob = async () => {
    if (!prompt.trim()) return;
    setSubmitting(true); setError(null);
    try { await agentApi.createJob(prompt, selectedSkillId || undefined, selectedModel); setPrompt(""); await loadData(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to submit task"); }
    finally { setSubmitting(false); }
  };

  const handleDownload = async (file: GeneratedFileRecord) => {
    try {
      const blob = await agentApi.downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url; a.download = file.fileName;
      window.document.body.appendChild(a); a.click();
      window.document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) { setError(err instanceof Error ? err.message : "Download failed"); }
  };

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);
  const completedJobs = jobs.filter((j) => j.status === "completed" || j.status === "failed");
  const runningJobs = jobs.filter((j) => j.status === "pending" || j.status === "running");

  return (
    <RequireAuth>
      <DashboardLayout>
        {/* Hero */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/60 bg-fuchsia-50/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-400">
            <span className="size-2 rounded-full bg-fuchsia-500" />
            AI Agent Workspace
          </div>
          <h1 className="mt-5 text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
            Upload, Analyze{" "}
            <em className="not-italic bg-gradient-to-r from-fuchsia-600 via-purple-500 to-amber-500 bg-clip-text text-transparent">
              & Generate
            </em>
          </h1>
          <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            Upload a skill zip, describe what you need, and let the AI agent process it through WindsurfAPI. Get PDFs, spreadsheets, and reports delivered straight to you.
          </p>
        </section>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Package className="size-4" /> Skills</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{skills.length}</div>
            <div className="mt-1 text-xs text-fuchsia-600 dark:text-fuchsia-400">{skills.filter(s => s.fileCount > 1).length} multi-file</div>
          </article>
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Zap className="size-4" /> Tasks Run</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{jobs.length}</div>
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">{runningJobs.length} active</div>
          </article>
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><CheckCircle2 className="size-4" /> Completed</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{jobs.filter(j => j.status === "completed").length}</div>
            <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{jobs.filter(j => j.status === "failed").length} failed</div>
          </article>
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><FileText className="size-4" /> Files Generated</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{jobs.reduce((acc, j) => acc + (j.outputFiles?.length || 0), 0)}</div>
            <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">PDFs, XLSX, more</div>
          </article>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: Task creation + results */}
          <div className="space-y-6">
            {/* Task creation card */}
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/5">
                <div className="flex gap-2.75">
                  <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Brain className="size-[18px]" /></span>
                  <div>
                    <h3 className="m-0 text-base text-slate-900 dark:text-white">Create AI Task</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Describe what you want the AI to do</p>
                  </div>
                </div>
                {selectedSkill && (
                  <Badge className="bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200">
                    <Package className="size-3" /> {selectedSkill.name}
                  </Badge>
                )}
              </header>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Your Prompt</label>
                  <Textarea
                    className="mt-2 min-h-[120px] resize-y"
                    placeholder="e.g. Analyze the uploaded skill files and generate a comprehensive PDF report with key findings, recommendations, and action items..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">AI Model</label>
                  <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v ?? "glm-5.2")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {models.length === 0 && (
                        <SelectItem value={selectedModel}>{selectedModel}</SelectItem>
                      )}
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label || m.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedSkillId ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Package className="size-3.5" /> Using skill: <strong className="text-slate-700 dark:text-slate-300">{selectedSkill?.name}</strong>
                        <button className="ml-1 text-fuchsia-600 hover:underline" onClick={() => setSelectedSkillId(null)}>remove</button>
                      </span>
                    ) : (
                      <span>No skill selected (optional)</span>
                    )}
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSubmitJob}
                    disabled={!prompt.trim() || submitting}
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {submitting ? "Starting..." : "Run AI Task"}
                  </Button>
                </div>
              </div>
            </article>

            {/* Running jobs */}
            {runningJobs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Active Tasks</h2>
                {runningJobs.map((job) => {
                  const status = STATUS_CONFIG[job.status];
                  const StatusIcon = status.icon;
                  return (
                    <article key={job.id} className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-400/20 dark:bg-blue-400/5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          <StatusIcon className={`size-5 ${job.status === "running" ? "animate-spin text-blue-600" : "text-amber-600"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={status.color}>{status.label}</Badge>
                            {job.skill && <Badge variant="outline" className="text-[10px]"><Package className="size-2.5" /> {job.skill.name}</Badge>}
                          </div>
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{job.prompt}</p>
                          <p className="mt-1.5 text-xs text-slate-400">Started {formatDate(job.createdAt)}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Results tabs */}
            <Tabs defaultValue="results">
              <TabsList>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Results tab */}
              <TabsContent value="results">
                <div className="mt-4 space-y-4">
                  {completedJobs.length === 0 ? (
                    <article className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-slate-900/30">
                      <FileText className="mx-auto size-10 text-slate-300 dark:text-slate-600" />
                      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No results yet. Create a task to see AI-generated outputs here.</p>
                    </article>
                  ) : (
                    completedJobs.map((job) => {
                      const status = STATUS_CONFIG[job.status];
                      const StatusIcon = status.icon;
                      return (
                        <article key={job.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
                            <div className="flex items-center gap-2.5">
                              <StatusIcon className={`size-4 ${job.status === "completed" ? "text-emerald-600" : "text-red-500"}`} />
                              <Badge className={status.color}>{status.label}</Badge>
                              {job.skill && <Badge variant="outline" className="text-[10px]"><Package className="size-2.5" /> {job.skill.name}</Badge>}
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(job.completedAt || job.createdAt)}</span>
                          </header>
                          <div className="p-5">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{job.prompt}</p>
                            {job.status === "failed" && job.errorMessage && (
                              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-400/10 dark:text-red-400">
                                {job.errorMessage}
                              </div>
                            )}
                            {job.status === "completed" && job.result && (
                              <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                                <p className="line-clamp-4 whitespace-pre-wrap">{job.result}</p>
                              </div>
                            )}
                            {job.outputFiles && job.outputFiles.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Generated Files</div>
                                {job.outputFiles.map((file) => {
                                  const Icon = FILE_ICONS[file.fileType] || FileIcon;
                                  return (
                                    <div key={file.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-white/10 dark:bg-slate-800/40">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white shadow-sm dark:bg-slate-700">
                                          <Icon className="size-4 text-slate-600 dark:text-slate-300" />
                                        </span>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{file.fileName}</p>
                                          <p className="text-xs text-slate-400">{formatBytes(file.fileSize)}</p>
                                        </div>
                                      </div>
                                      <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                                        <Download className="size-3.5" /> Download
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* History tab */}
              <TabsContent value="history">
                <div className="mt-4 space-y-2">
                  {jobs.length === 0 ? (
                    <article className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-slate-900/30">
                      <Clock className="mx-auto size-10 text-slate-300 dark:text-slate-600" />
                      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No task history yet.</p>
                    </article>
                  ) : (
                    jobs.map((job) => {
                      const status = STATUS_CONFIG[job.status];
                      const StatusIcon = status.icon;
                      return (
                        <div key={job.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900/50">
                          <StatusIcon className={`size-4 shrink-0 ${job.status === "running" ? "animate-spin text-blue-500" : job.status === "completed" ? "text-emerald-500" : job.status === "failed" ? "text-red-500" : "text-amber-500"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{job.prompt}</p>
                            <p className="text-xs text-slate-400">{formatDate(job.createdAt)}</p>
                          </div>
                          <Badge className={`shrink-0 ${status.color}`}>{status.label}</Badge>
                          {job.outputFiles && job.outputFiles.length > 0 && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              <FileText className="size-2.5" /> {job.outputFiles.length}
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar: Skills library */}
          <aside className="space-y-4">
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <header className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                <div className="flex gap-2.5">
                  <span className="grid size-8 place-items-center rounded-[10px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Package className="size-4" /></span>
                  <div>
                    <h3 className="m-0 text-sm text-slate-900 dark:text-white">Skill Library</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Upload and manage skill zips</p>
                  </div>
                </div>
              </header>
              <div className="p-4">
                {/* Upload zone */}
                <div
                  className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center transition-colors hover:border-fuchsia-400 hover:bg-fuchsia-50/30 dark:border-white/15 dark:bg-slate-800/30 dark:hover:border-fuchsia-400/40 dark:hover:bg-fuchsia-400/5"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-fuchsia-400"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("border-fuchsia-400"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-fuchsia-400");
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.name.endsWith(".zip")) {
                      const input = fileInputRef.current;
                      if (input) {
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        input.files = dt.files;
                        input.dispatchEvent(new Event("change"));
                      }
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleUploadSkill}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="size-6 animate-spin text-fuchsia-500" />
                      <p className="text-xs text-slate-500">Uploading & extracting...</p>
                    </div>
                  ) : (
                    <button
                      className="flex w-full flex-col items-center gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="size-6 text-slate-400" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Drop zip here or click to upload</p>
                      <p className="text-[10px] text-slate-400">Must contain a .md file (SKILL.md, README.md)</p>
                    </button>
                  )}
                </div>

                {uploadError && (
                  <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-400/10 dark:text-red-400">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Skills list */}
              <div className="border-t border-slate-100 px-4 py-3 dark:border-white/5">
                {loading ? (
                  <div className="py-6 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin text-slate-400" />
                  </div>
                ) : skills.length === 0 ? (
                  <div className="py-6 text-center">
                    <FileArchive className="mx-auto size-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-xs text-slate-400">No skills uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <div
                        key={skill.id}
                        className={`group rounded-xl border p-3 transition-all cursor-pointer ${
                          selectedSkillId === skill.id
                            ? "border-fuchsia-300 bg-fuchsia-50/50 dark:border-fuchsia-400/30 dark:bg-fuchsia-400/10"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-white/20"
                        }`}
                        onClick={() => setSelectedSkillId(selectedSkillId === skill.id ? null : skill.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="size-3.5 shrink-0 text-fuchsia-500" />
                              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{skill.name}</p>
                            </div>
                            {skill.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{skill.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{skill.fileCount} files</Badge>
                              <span className="text-[10px] text-slate-400">{formatBytes(skill.fileSize)}</span>
                            </div>
                          </div>
                          <button
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-400/10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSkill(skill.id); }}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        {selectedSkillId === skill.id && (
                          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400">
                            <ArrowRight className="size-3" /> Selected for next task
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* How it works */}
            <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-fuchsia-50/80 to-purple-50/40 p-5 dark:border-white/10 dark:from-fuchsia-400/5 dark:to-purple-400/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">How it works</h3>
              <ol className="mt-3 space-y-2.5">
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-400">1</span>
                  Upload a skill zip (must contain a .md file)
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-400">2</span>
                  Select the skill and write your prompt
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-400">3</span>
                  AI processes via WindsurfAPI with tool access
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-400">4</span>
                  Download generated PDFs, spreadsheets & files
                </li>
              </ol>
            </article>
          </aside>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
