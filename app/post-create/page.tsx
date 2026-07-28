"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Upload, FileArchive, Sparkles, Loader2, FileText, Download,
  Trash2, Zap, CheckCircle2, XCircle, Clock, Package, Brain,
  ArrowRight, Newspaper, Send, RefreshCw, Globe, AlertCircle,
  Type, Eye, Copy, Layers,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  wordpressApi,
  type WordPressSite,
  type WordPressPost,
  type PostSkillRecord,
  type WordPressSiteData,
  type ModelRecord,
  type GenerationJob,
  type GeneratedContent,
} from "@/lib/wordpress-api";
import { ModelSelector, usePersistentModel } from "@/components/ModelSelector";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  idle: { label: "Idle", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock },
  generating: { label: "Generating", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
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

function PostCreateContent() {
  const searchParams = useSearchParams();

  // Skills
  const [skills, setSkills] = useState<PostSkillRecord[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WordPress sites
  const [wpSites, setWpSites] = useState<WordPressSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [siteData, setSiteData] = useState<WordPressSiteData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Generation
  const [models, setModels] = useState<ModelRecord[]>([]);
  const { selectedModel, setModel } = usePersistentModel(models);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [genJobs, setGenJobs] = useState<GenerationJob[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Publishing
  const [publishStatus, setPublishStatus] = useState<"draft" | "publish">("draft");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [postCategories, setPostCategories] = useState("");
  const [postTags, setPostTags] = useState("");
  const [wpPosts, setWpPosts] = useState<WordPressPost[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [skillsRes, sitesRes] = await Promise.all([
        wordpressApi.listPostSkills(),
        wordpressApi.getSites(),
      ]);
      setSkills(skillsRes.skills);
      const connected = sitesRes.filter((s) => s.connected);
      setWpSites(connected);
      const siteIdFromUrl = searchParams.get("siteId");
      if (siteIdFromUrl && connected.some((s) => s.id === siteIdFromUrl)) {
        setSelectedSiteId(siteIdFromUrl);
      } else if (connected.length > 0) {
        setSelectedSiteId(connected[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    wordpressApi.listModels().then((res) => {
      setModels(res.models);
    }).catch(() => {});
  }, []);

  // Load site data when site changes
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteData(null);
      return;
    }
    wordpressApi.getSiteData(selectedSiteId).then((res) => setSiteData(res.data)).catch(() => {});
    wordpressApi.getPosts(selectedSiteId).then((posts) => setWpPosts(posts)).catch(() => {});
  }, [selectedSiteId]);

  // Poll for active generation jobs
  const hasActiveJob = genJobs.some((j) => j.status === "generating" || j.status === "idle");
  useEffect(() => {
    if (hasActiveJob) {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        const activeJobs = genJobs.filter((j) => j.status === "generating" || j.status === "idle");
        for (const job of activeJobs) {
          try {
            const res = await wordpressApi.getGenerationJob(job.id);
            setGenJobs((prev) => prev.map((j) => (j.id === job.id ? res.job : j)));
            if (res.job.status === "completed" && res.job.result) {
              setGeneratedContent(res.job.result);
              setGenerating(false);
              setGenerationStep("Content ready!");
            } else if (res.job.status === "failed") {
              setGenError(res.job.errorMessage || "Generation failed");
              setGenerating(false);
            }
          } catch {}
        }
      }, 3000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [hasActiveJob, genJobs]);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);
  const selectedSite = wpSites.find((s) => s.id === selectedSiteId);
  const completedJobs = genJobs.filter((j) => j.status === "completed" || j.status === "failed");
  const activeJobs = genJobs.filter((j) => j.status === "generating" || j.status === "idle");

  // Handlers
  const handleUploadSkill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isZip = file.name.endsWith(".zip");
    const isMd = file.name.endsWith(".md") || file.name.endsWith(".markdown");
    if (!isZip && !isMd) {
      setUploadError("Please upload a .md or .zip file");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await wordpressApi.uploadPostSkill(file);
      await loadData();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("Delete this skill?")) return;
    try {
      await wordpressApi.deletePostSkill(id);
      if (selectedSkillId === id) setSelectedSkillId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleSyncData = async () => {
    if (!selectedSiteId) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await wordpressApi.syncSiteData(selectedSiteId);
      setSiteData(res.data);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenError(null);
    setGeneratedContent(null);
    setGenerationStep("Starting AI generation...");

    try {
      setGenerationStep("Sending prompt to AI model...");
      const res = await wordpressApi.generateWithWindsurf({
        prompt,
        skillId: selectedSkillId || undefined,
        model: selectedModel,
        siteId: selectedSiteId || undefined,
      });
      setGenJobs((prev) => [res.job, ...prev]);
      setGenerationStep("AI is processing your request...");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to start generation");
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedSiteId || !generatedContent) return;
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      const result = await wordpressApi.publishPost(selectedSiteId, {
        title: generatedContent.title,
        content: generatedContent.body,
        excerpt: generatedContent.metaDescription,
        status: publishStatus,
        categories: postCategories ? postCategories.split(",").map((c) => c.trim()).filter(Boolean) : [],
        tags: postTags ? postTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      setPublishSuccess(`Post published! View at: ${result.post.permalink}`);
      wordpressApi.getPosts(selectedSiteId).then(setWpPosts).catch(() => {});
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to publish post");
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyContent = () => {
    if (!generatedContent) return;
    const fullText = `${generatedContent.title}\n\n${generatedContent.metaDescription}\n\n${generatedContent.body}`;
    navigator.clipboard.writeText(fullText);
  };

  return (
    <RequireAuth>
      <DashboardLayout>
        {/* Hero */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/60 bg-fuchsia-50/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-400">
            <span className="size-2 rounded-full bg-fuchsia-500" />
            AI Post Generator
          </div>
          <h1 className="mt-5 text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
            Upload Skills{" "}
            <em className="not-italic bg-gradient-to-r from-fuchsia-600 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              & Generate Posts
            </em>
          </h1>
          <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            Upload SEO skill files, connect your WordPress site, give a prompt, and let AI generate optimized content. Review, then publish directly to WordPress.
          </p>
        </section>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Package className="size-4" /> Skills</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{skills.length}</div>
            <div className="mt-1 text-xs text-fuchsia-600 dark:text-fuchsia-400">{skills.filter((s) => s.fileCount > 1).length} multi-file</div>
          </article>
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Globe className="size-4" /> WP Sites</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{wpSites.length}</div>
            <div className="mt-1 text-xs text-fuchsia-600 dark:text-fuchsia-400">{wpSites.filter((s) => s.connected).length} connected</div>
          </article>
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Zap className="size-4" /> Posts Generated</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{genJobs.length}</div>
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">{activeJobs.length} active</div>
          </article>
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><CheckCircle2 className="size-4" /> Published</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{wpPosts.length}</div>
            <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{wpPosts.filter((p) => p.status === "publish").length} live</div>
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
          {/* Left: Generation + Results */}
          <div className="space-y-6">
            {/* Generation card */}
            <article className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/5">
                <div className="flex gap-2.75">
                  <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Brain className="size-[18px]" /></span>
                  <div>
                    <h3 className="m-0 text-base text-slate-900 dark:text-white">Generate Post</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Describe what you want the AI to write</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSkill && (
                    <Badge className="bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200">
                      <Package className="size-3" /> {selectedSkill.name}
                    </Badge>
                  )}
                  {selectedSite && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      <Globe className="size-3" /> {selectedSite.siteName}
                    </Badge>
                  )}
                </div>
              </header>
              <div className="p-5 space-y-4">
                {/* WordPress site selector */}
                {wpSites.length > 0 && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">WP Site</label>
                    <select
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus-visible:border-fuchsia-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                    >
                      {wpSites.map((s) => (
                        <option key={s.id} value={s.id}>{s.siteName} — {s.siteUrl}</option>
                      ))}
                    </select>
                    <Button size="sm" variant="outline" onClick={handleSyncData} disabled={syncing || !selectedSiteId}>
                      {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                      Sync
                    </Button>
                  </div>
                )}

                {syncError && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400">
                    <AlertCircle className="size-4 shrink-0" /> {syncError}
                  </div>
                )}

                {/* Site data preview */}
                {siteData && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                      <Layers className="size-3.5" /> Site Data
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                      <div><span className="font-bold text-slate-700 dark:text-slate-300">{siteData.totalPosts}</span> <span className="text-slate-400">posts</span></div>
                      <div><span className="font-bold text-slate-700 dark:text-slate-300">{siteData.categories.length}</span> <span className="text-slate-400">categories</span></div>
                      <div><span className="font-bold text-slate-700 dark:text-slate-300">{siteData.tags.length}</span> <span className="text-slate-400">tags</span></div>
                    </div>
                    {siteData.categories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {siteData.categories.slice(0, 8).map((c) => (
                          <Badge key={c.id} variant="outline" className="text-[10px]">{c.name}</Badge>
                        ))}
                        {siteData.categories.length > 8 && <Badge variant="outline" className="text-[10px]">+{siteData.categories.length - 8}</Badge>}
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Your Prompt</label>
                  <Textarea
                    className="mt-2 min-h-[120px] resize-y"
                    placeholder="e.g. Write a pillar page about 'Nederlandstalige makelaar Costa del Sol gratis' with answer-first intro, quick facts table, TOC, entity-driven H2s, FAQ, and CTA..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={generating}
                  />
                </div>

                {/* Model selector */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">AI Model</label>
                  <ModelSelector
                    models={models}
                    value={selectedModel}
                    onChange={setModel}
                    className="flex-1"
                  />
                </div>

                {/* Generate button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedSkillId ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Package className="size-3.5" /> Using skill: <strong className="text-slate-700 dark:text-slate-300">{selectedSkill?.name}</strong>
                        <button className="ml-1 text-fuchsia-600 hover:underline" onClick={() => setSelectedSkillId(null)}>remove</button>
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Select a skill from the sidebar →</span>
                    )}
                  </div>
                  <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || generating}
                    className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700"
                  >
                    {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {generating ? "Generating..." : "Generate Post"}
                  </Button>
                </div>

                {/* Generation progress */}
                {generating && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-400/20 dark:bg-blue-400/5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <Sparkles className="size-4 text-fuchsia-500 animate-pulse" />
                      {generationStep}
                    </div>
                  </div>
                )}

                {genError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" /> {genError}
                  </div>
                )}
              </div>
            </article>

            {/* Generated content preview */}
            {generatedContent && (
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/5">
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Eye className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Content Preview</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">AI-generated content ready to publish</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={handleCopyContent}><Copy className="size-3.5" /> Copy</Button>
                  </div>
                </header>
                <div className="p-5">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{generatedContent.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{generatedContent.metaDescription}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Type className="size-3.5" /> {generatedContent.wordCount} words</span>
                      <span className="flex items-center gap-1"><Clock className="size-3.5" /> {generatedContent.readingTime} min read</span>
                      <span className="flex items-center gap-1"><Eye className="size-3.5" /> SEO-optimized</span>
                    </div>
                    <Separator />
                    <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: generatedContent.body }} />
                  </div>
                </div>
              </article>
            )}

            {/* Publishing panel */}
            {generatedContent && wpSites.length > 0 && (
              <article className="overflow-hidden rounded-3xl border border-fuchsia-200 bg-white dark:border-fuchsia-400/20 dark:bg-slate-900/50">
                <header className="flex items-center justify-between gap-4 border-b border-fuchsia-100 px-6 py-5 dark:border-fuchsia-400/10">
                  <div className="flex gap-2.75">
                    <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Newspaper className="size-[18px]" /></span>
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Publish to WordPress</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Send the generated content to your site</p>
                    </div>
                  </div>
                </header>
                <div className="p-5 space-y-4">
                  {publishSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
                      <CheckCircle2 className="size-4 shrink-0" /> {publishSuccess}
                    </div>
                  )}
                  {publishError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                      <AlertCircle className="size-4 shrink-0" /> {publishError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500">Publish Status</label>
                      <select
                        value={publishStatus}
                        onChange={(e) => setPublishStatus(e.target.value as "draft" | "publish")}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="publish">Publish Immediately</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500">Categories (comma-separated)</label>
                      <Input className="mt-2" placeholder="e.g. SEO, Marketing" value={postCategories} onChange={(e) => setPostCategories(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500">Tags (comma-separated)</label>
                    <Input className="mt-2" placeholder="e.g. ai, content, automation" value={postTags} onChange={(e) => setPostTags(e.target.value)} />
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700"
                    onClick={handlePublish}
                    disabled={publishing || !selectedSiteId || !generatedContent}
                  >
                    {publishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {publishing ? "Publishing..." : `Publish as ${publishStatus === "draft" ? "Draft" : "Published"}`}
                  </Button>
                </div>
              </article>
            )}

            {/* Active jobs */}
            {activeJobs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Active Generations</h2>
                {activeJobs.map((job) => {
                  const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.generating;
                  const StatusIcon = status.icon;
                  return (
                    <article key={job.id} className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-400/20 dark:bg-blue-400/5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          <StatusIcon className={`size-5 ${job.status === "generating" ? "animate-spin text-blue-600" : "text-amber-600"}`} />
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
                <TabsTrigger value="posts">Published Posts</TabsTrigger>
              </TabsList>

              {/* Results tab */}
              <TabsContent value="results">
                <div className="mt-4 space-y-4">
                  {completedJobs.length === 0 ? (
                    <article className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-slate-900/30">
                      <FileText className="mx-auto size-10 text-slate-300 dark:text-slate-600" />
                      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No results yet. Generate a post to see AI output here.</p>
                    </article>
                  ) : (
                    completedJobs.map((job) => {
                      const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.completed;
                      const StatusIcon = status.icon;
                      return (
                        <article key={job.id} className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
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
                              <div className="mt-3 space-y-3">
                                <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                                  <p className="font-semibold">{job.result.title}</p>
                                  <p className="mt-1 text-xs text-slate-400">{job.result.wordCount} words · {job.result.readingTime} min read</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setGeneratedContent(job.result);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                >
                                  <Eye className="size-3.5" /> View Content
                                </Button>
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
                  {genJobs.length === 0 ? (
                    <article className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-slate-900/30">
                      <Clock className="mx-auto size-10 text-slate-300 dark:text-slate-600" />
                      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No generation history yet.</p>
                    </article>
                  ) : (
                    genJobs.map((job) => {
                      const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.idle;
                      const StatusIcon = status.icon;
                      return (
                        <div key={job.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900/50">
                          <StatusIcon className={`size-4 shrink-0 ${job.status === "generating" ? "animate-spin text-blue-500" : job.status === "completed" ? "text-emerald-500" : job.status === "failed" ? "text-red-500" : "text-amber-500"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{job.prompt}</p>
                            <p className="text-xs text-slate-400">{formatDate(job.createdAt)}</p>
                          </div>
                          <Badge className={`shrink-0 ${status.color}`}>{status.label}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* Published Posts tab */}
              <TabsContent value="posts">
                <div className="mt-4 space-y-2">
                  {wpPosts.length === 0 ? (
                    <article className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-slate-900/30">
                      <Newspaper className="mx-auto size-10 text-slate-300 dark:text-slate-600" />
                      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No posts published yet.</p>
                    </article>
                  ) : (
                    wpPosts.map((post) => (
                      <div key={post.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900/50">
                        <Newspaper className="size-4 shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{post.title}</p>
                          <p className="text-xs text-slate-400">{formatDate(post.createdAt)}</p>
                        </div>
                        <Badge className={`shrink-0 ${post.status === "publish" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                          {post.status}
                        </Badge>
                        {post.permalink && (
                          <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-600 hover:underline">
                            <ArrowRight className="size-4" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar: Skills + How it works */}
          <aside className="space-y-4">
            {/* Skill Library */}
            <article className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <header className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                <div className="flex gap-2.5">
                  <span className="grid size-8 place-items-center rounded-[10px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Package className="size-4" /></span>
                  <div>
                    <h3 className="m-0 text-sm text-slate-900 dark:text-white">Skill Library</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Upload .md or .zip skill files</p>
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
                    if (file && (file.name.endsWith(".zip") || file.name.endsWith(".md"))) {
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
                    accept=".zip,.md,.markdown"
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
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Drop .md or .zip here or click to upload</p>
                      <p className="text-[10px] text-slate-400">Skills define how AI generates content</p>
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
                    <p className="mt-1 text-[10px] text-slate-400">Upload a .md skill file to get started</p>
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
                            <ArrowRight className="size-3" /> Selected for generation
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
                  Connect your WordPress site & sync data
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-400">2</span>
                  Upload skill files (.md or .zip)
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-400">3</span>
                  Select a skill & write your prompt
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-400">4</span>
                  AI generates content via WindsurfAPI
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-400">5</span>
                  Review & publish to WordPress
                </li>
              </ol>
            </article>
          </aside>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}

export default function PostCreatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-slate-400" /></div>}>
      <PostCreateContent />
    </Suspense>
  );
}
