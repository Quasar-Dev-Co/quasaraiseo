"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileArchive, Sparkles, Loader2, FileText, Download,
  Trash2, Zap, CheckCircle2, XCircle, Clock, Package, Brain,
  ArrowRight, Newspaper, Send, RefreshCw, Globe, AlertCircle,
  Type, Eye, Copy, Layers, Image as ImageIcon, X, Tag, ListTree,
  Bold, Italic, Underline, Link2, List, ListOrdered, Quote,
  Heading2, Heading3, Pencil, Save, Undo2, Redo2, Building2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
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
  type PermalinkCheck,
  type SiteTerm,
  type GeneratedImage,
  type ContentFile,
  type SuggestedTopic,
} from "@/lib/wordpress-api";
import { ModelSelector, usePersistentModel } from "@/components/ModelSelector";
import { brandingApi, type Branding } from "@/lib/branding-api";
import { Skeleton } from "@/components/ui/skeleton";
import { keywordMcpApi } from "@/lib/keyword-mcp-api";
import { useMinLoading } from "@/lib/use-min-loading";
import { useAuth } from "@/hooks/use-auth";
import { slugMatchesTitle, slugify, suggestSlug, trimSlug } from "@/lib/slug";
import { ImageReorderLayer, stripImageEditorAttrs } from "@/components/post-editor/image-reorder-layer";
import { insertImagesIntoBody as placeImagesInBody } from "@/lib/blog-images";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  idle: { label: "Idle", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock },
  generating: { label: "Generating", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};


// How long the post page waits for server-side images before showing the post
// without them.
const IMAGE_WAIT_LIMIT_MS = 10 * 60 * 1000;

// Images are finished (made, partly made, or failed) once the worker records a
// status. Posts from before that status existed count as finished once the
// body contains an image.
function imagesSettled(result: GeneratedContent): boolean {
  if (result.imageStatus) return result.imageStatus !== "pending";
  return result.body.includes("<img");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

type PublishStatus = "draft" | "publish" | "future";

function publishActionLabel(status: PublishStatus, busy: boolean): string {
  if (busy) {
    if (status === "future") return "Scheduling...";
    if (status === "draft") return "Saving draft...";
    return "Publishing...";
  }
  if (status === "future") return "Schedule Post";
  if (status === "draft") return "Save as Draft";
  return "Publish Now";
}

function formatWallClock(value: string): string {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[Number(match[2]) - 1] ?? match[2];
  const hour = Number(match[4]);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${month} ${Number(match[3])}, ${hour12}:${match[5]} ${suffix}`;
}

function localDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultScheduleValue(): string {
  return localDateTimeValue(new Date(Date.now() + 60 * 60 * 1000));
}

function postStatusPresentation(status: string): { label: string; className: string } {
  if (status === "publish") {
    return { label: "Published", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
  if (status === "future") {
    return { label: "Scheduled", className: "bg-brand-100 text-brand-700 border-brand-200" };
  }
  return {
    label: status === "draft" ? "Draft" : status,
    className: "bg-amber-100 text-amber-700 border-amber-200",
  };
}

function PostCreateContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isSuper = user?.role === "super";

  // Skills
  const [skills, setSkills] = useState<PostSkillRecord[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Content files (saved pillar/cluster pages from Quasar MCP)
  const [contentFiles, setContentFiles] = useState<ContentFile[]>([]);
  const [selectedContentFileId, setSelectedContentFileId] = useState<string | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<SuggestedTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  // Branding
  const [brands, setBrands] = useState<Branding[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

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
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [postCategories, setPostCategories] = useState("");
  const [taxonomy, setTaxonomy] = useState<{ categories: SiteTerm[]; tags: SiteTerm[] } | null>(null);
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);
  const [taxonomyTick, setTaxonomyTick] = useState(0);
  const [postTags, setPostTags] = useState("");
  const [wpPosts, setWpPosts] = useState<WordPressPost[]>([]);

  // Image generation
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imagesInserted, setImagesInserted] = useState(false);

  // Content preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<GeneratedContent | null>(null);

  // Publish modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishModalContent, setPublishModalContent] = useState<GeneratedContent | null>(null);
  const [publishSlug, setPublishSlug] = useState("");
  const [publishCheck, setPublishCheck] = useState<PermalinkCheck | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editMeta, setEditMeta] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const bodyEditRef = useRef<HTMLDivElement | null>(null);

  const openPreview = (content: GeneratedContent) => {
    setPreviewContent(content);
    setEditTitle(content.title);
    setEditMeta(content.metaDescription);
    setEditSlug(content.slug);
    setEditMode(false);
    setPreviewOpen(true);
  };

  const openPublishModal = (content: GeneratedContent) => {
    setPublishModalContent(content);
    setPublishSlug(suggestSlug(content.title, content.slug));
    setPublishCheck(null);
    setPublishModalOpen(true);
    setPublishSuccess(null);
    setPublishError(null);
  };

  // Load the site's real categories and tags whenever the publish dialog opens or the site changes.
  useEffect(() => {
    if (!publishModalOpen || !selectedSiteId) return;
    let cancelled = false;
    setTaxonomy(null);
    setTaxonomyLoading(true);
    wordpressApi.getTaxonomy(selectedSiteId)
      .then((t) => { if (!cancelled) setTaxonomy(t); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTaxonomyLoading(false); });
    return () => { cancelled = true; };
  }, [publishModalOpen, selectedSiteId, taxonomyTick]);

  const closePublishModal = () => {
    setPublishModalOpen(false);
    setPublishModalContent(null);
  };

  const cleanBodyForPreview = (body: string): string => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    return body
      .replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/\{[\s]*"@context"[\s\S]*?\}(?:\s*\{[\s\S]*?\})*/g, (match) => {
        if (match.includes('"@type"')) return "";
        return match;
      })
      .replace(/src=["'](\/api\/wordpress\/images\/[^"']+)["']/g, (match, path) => {
        return `src="${backendUrl}${path}"`;
      })
      .trim();
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    bodyEditRef.current?.focus();
  };

  const applyHeading = (tag: string) => {
    document.execCommand("formatBlock", false, tag);
    bodyEditRef.current?.focus();
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      document.execCommand("createLink", false, url);
      bodyEditRef.current?.focus();
    }
  };

  const insertImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      // Insert as its own block so it can be dragged like the generated images.
      const safeUrl = url.replace(/"/g, "&quot;");
      document.execCommand("insertHTML", false, `<figure class="wp-block-image"><img src="${safeUrl}" alt="" /></figure><p><br></p>`);
      bodyEditRef.current?.focus();
    }
  };

  const saveEdits = () => {
    const editedBody = bodyEditRef.current ? stripImageEditorAttrs(bodyEditRef.current.innerHTML) : previewContent?.body || "";
    const wordCount = editedBody.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
    const updated: GeneratedContent = {
      ...(previewContent as GeneratedContent),
      title: editTitle,
      metaDescription: editMeta,
      slug: editSlug,
      body: editedBody,
      wordCount,
      readingTime: Math.max(1, Math.round(wordCount / 200)),
    };
    setPreviewContent(updated);
    setGeneratedContent(updated);
    setEditMode(false);
  };

  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinLoading(loading, 800);
  const [error, setError] = useState<string | null>(null);

  const insertImagesIntoBody = (body: string, images: GeneratedImage[]): string =>
    placeImagesInBody(body, images.map((img) => ({ placement: img.placement, url: wordpressApi.imageUrl(img.url) })));

  const loadData = useCallback(async () => {
    try {
      const [skillsRes, sitesRes, jobsRes, brandsRes, contentFilesRes] = await Promise.all([
        wordpressApi.listPostSkills(),
        wordpressApi.getSites(),
        wordpressApi.listGenerationJobs(),
        brandingApi.getAll(),
        wordpressApi.listContentFiles(),
      ]);
      setSkills(skillsRes.skills);
      setGenJobs(jobsRes.jobs || []);
      setBrands(brandsRes);
      setContentFiles(contentFilesRes.files || []);
      const defaultBrand = brandsRes.find((b) => b.isDefault);
      if (defaultBrand) setSelectedBrandId(defaultBrand.id);
      const connected = sitesRes.filter((s) => s.connected);
      setWpSites(connected);
      const siteIdFromUrl = searchParams.get("siteId");
      if (siteIdFromUrl && connected.some((s) => s.id === siteIdFromUrl)) {
        setSelectedSiteId(siteIdFromUrl);
      } else if (connected.length > 0) {
        setSelectedSiteId(connected[0].id);
      }

      // Handle contentFileId and prompt from URL (sent from Quasar MCP legacy)
      const contentFileIdFromUrl = searchParams.get("contentFileId");
      const promptFromUrl = searchParams.get("prompt");
      if (contentFileIdFromUrl && (contentFilesRes.files || []).some((f) => f.id === contentFileIdFromUrl)) {
        setSelectedContentFileId(contentFileIdFromUrl);
      }
      if (promptFromUrl) {
        setPrompt(decodeURIComponent(promptFromUrl));
      }

      // Handle briefId from URL — fetch from MCP and pre-fill
      const briefIdFromUrl = searchParams.get("briefId");
      if (briefIdFromUrl) {
        try {
          const { brief } = await keywordMcpApi.getPendingPostBrief(briefIdFromUrl);
          if (brief.contentFileId && (contentFilesRes.files || []).some((f) => f.id === brief.contentFileId)) {
            setSelectedContentFileId(brief.contentFileId);
          }
          if (brief.prompt) {
            setPrompt(brief.prompt);
          }
          if (brief.title) {
            setMcpBanner(`From Quasar MCP: "${brief.title}"${brief.keyword ? ` — keyword: ${brief.keyword}` : ""}. Reference page selected, prompt pre-filled.`);
          } else {
            setMcpBanner("From Quasar MCP: post brief loaded. Reference page selected, prompt pre-filled.");
          }
        } catch (err) {
          setMcpBanner(`Could not load MCP brief: ${err instanceof Error ? err.message : "Unknown"}`);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { loadData(); }, [loadData]);

  const [modelsError, setModelsError] = useState<string | null>(null);
  const [mcpBanner, setMcpBanner] = useState<string | null>(null);

  // Show banner for legacy MCP params (briefId is handled in loadData)
  useEffect(() => {
    const contentFileIdFromUrl = searchParams.get("contentFileId");
    const promptFromUrl = searchParams.get("prompt");
    if (contentFileIdFromUrl && promptFromUrl) {
      setMcpBanner("Sent from Quasar MCP — reference page selected and prompt pre-filled. Review and click Generate Post when ready.");
    }
  }, [searchParams]);

  useEffect(() => {
    wordpressApi.listModels().then((res) => {
      setModels(res.models);
    }).catch((err) => {
      setModelsError(err instanceof Error ? err.message : "Failed to load models");
    });
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
  const processedJobsRef = useRef<Set<string>>(new Set());
  const imagePollingJobsRef = useRef<Set<string>>(new Set());
  const imagePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (hasActiveJob || imagePollingJobsRef.current.size > 0) {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        const jobsToCheck = genJobs.filter((j) => j.status === "generating" || j.status === "idle" || imagePollingJobsRef.current.has(j.id));
        for (const job of jobsToCheck) {
          try {
            const res = await wordpressApi.getGenerationJob(job.id);
            setGenJobs((prev) => prev.map((j) => (j.id === job.id ? res.job : j)));
            if (res.job.status === "completed" && res.job.result) {
              if (processedJobsRef.current.has(res.job.id)) continue;

              const hasImagePrompts = res.job.result.imagePrompts && res.job.result.imagePrompts.length > 0;
              const bodyHasImages = res.job.result.body && res.job.result.body.includes("<img");

              if (hasImagePrompts && !imagesSettled(res.job.result)) {
                // Images are still being generated server-side; keep main loader active
                if (!imagePollingJobsRef.current.has(res.job.id)) {
                  imagePollingJobsRef.current.add(res.job.id);
                  setGenerationStep("Generating images with AI (server-side)...");
                  setGeneratingImages(true);
                  const imageJobId = res.job.id;
                  const imageWaitStarted = Date.now();
                  if (imagePollRef.current) clearInterval(imagePollRef.current);
                  imagePollRef.current = setInterval(async () => {
                    try {
                      const imgRes = await wordpressApi.getGenerationJob(imageJobId);
                      const result = imgRes.job.result;
                      const timedOut = Date.now() - imageWaitStarted > IMAGE_WAIT_LIMIT_MS;
                      if (result && (imagesSettled(result) || timedOut)) {
                        processedJobsRef.current.add(imageJobId);
                        imagePollingJobsRef.current.delete(imageJobId);
                        setGeneratedContent(result);
                        setGenJobs((prev) => prev.map((j) => (j.id === imageJobId ? imgRes.job : j)));
                        const gotImages = result.body.includes("<img");
                        setImagesInserted(gotImages);
                        setImageError(
                          timedOut && !imagesSettled(result)
                            ? "Images are taking longer than 10 minutes. The post is ready without them — check the server logs, or open the post again later."
                            : result.imageStatus === "failed" || result.imageStatus === "partial"
                              ? `${result.imageStatus === "partial" ? "Some images could not be created" : "Images could not be created"}: ${result.imageError || "unknown error"}`
                              : null,
                        );
                        setGeneratingImages(false);
                        setGenerating(false);
                        setGenerationStep(gotImages ? "Content & images ready!" : "Content ready (no images)");
                        if (imagePollRef.current) { clearInterval(imagePollRef.current); imagePollRef.current = null; }
                      }
                    } catch {}
                  }, 5000);
                }
              } else {
                // No images pending; mark fully complete immediately
                processedJobsRef.current.add(res.job.id);
                imagePollingJobsRef.current.delete(res.job.id);
                setGeneratedContent(res.job.result);
                setGenerating(false);
                setGeneratingImages(false);
                if (res.job.result.imageStatus === "failed" || res.job.result.imageStatus === "partial") {
                  setImageError(`Images could not be created: ${res.job.result.imageError || "unknown error"}`);
                }
                if (bodyHasImages) {
                  setImagesInserted(true);
                  setGenerationStep("Content & images ready!");
                } else {
                  setGenerationStep("Content ready!");
                }
              }
            } else if (res.job.status === "failed") {
              imagePollingJobsRef.current.delete(res.job.id);
              setGenError(res.job.errorMessage || "Generation failed");
              setGenerating(false);
              setGeneratingImages(false);
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
    setGeneratedImages([]);
    setImageError(null);
    setImagesInserted(false);
    setGenerationStep("Starting AI generation...");

    try {
      setGenerationStep("Sending prompt to AI model...");
      const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? null;
      const res = await wordpressApi.generateAiContent({
        prompt,
        skillId: selectedSkillId || undefined,
        model: selectedModel,
        siteId: selectedSiteId || undefined,
        brandingId: selectedBrandId || undefined,
        companyName: selectedBrand?.companyName || undefined,
        url: selectedBrand?.website || undefined,
        contentFileId: selectedContentFileId || undefined,
      });
      setGenJobs((prev) => [res.job, ...prev]);
      setGenerationStep("AI is processing your request...");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to start generation");
      setGenerating(false);
    }
  };

  const handleSuggestTopics = async () => {
    if (!selectedContentFileId) return;
    setLoadingTopics(true);
    setTopicsError(null);
    setSuggestedTopics([]);
    try {
      const result = await wordpressApi.suggestTopicsFromPillar(selectedContentFileId);
      setSuggestedTopics(result.topics || []);
    } catch (err) {
      setTopicsError(err instanceof Error ? err.message : "Failed to suggest topics");
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleSelectTopic = (topic: SuggestedTopic) => {
    const selectedFile = contentFiles.find((f) => f.id === selectedContentFileId);
    const refTitle = selectedFile ? selectedFile.fileName.replace(/\.md$/, "").replace(/_\d+$/, "").replace(/-/g, " ").replace(/(pillar|cluster)/gi, "").trim() : "the reference page";
    setPrompt(`Write a focused, SEO-friendly blog post titled "${topic.title}"

Target keyword: ${topic.keyword}

What to cover: ${topic.description}

This post should support and link UP to the ${refTitle} reference page. It must be a narrower, deeper angle — do NOT rewrite the reference page. Target 1,200–2,000 words. Include relevant H2s, a short answer-first intro, internal links (one link upward to the reference page and, if relevant, one sideways to a related topic), a specific CTA for CodeMyPixel, and Article + FAQPage schema markup.`);
    setSuggestedTopics([]);
  };

  const handleDeleteContentFile = async (fileId: string) => {
    try {
      await wordpressApi.deleteContentFile(fileId);
      setContentFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (selectedContentFileId === fileId) {
        setSelectedContentFileId(null);
        setSuggestedTopics([]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const handleGenerateImages = async () => {
    if (!generatedContent?.imagePrompts || generatedContent.imagePrompts.length === 0) return;
    setGeneratingImages(true);
    setImageError(null);
    try {
      const result = await wordpressApi.generateImages(generatedContent.imagePrompts, selectedBrandId || undefined, generatedContent.title, generatedContent.headings);
      setGeneratedImages(result.images);
      const updatedBody = insertImagesIntoBody(generatedContent.body, result.images);
      setGeneratedContent({ ...generatedContent, body: updatedBody });
      setImagesInserted(true);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to generate images");
    } finally {
      setGeneratingImages(false);
    }
  };

  const handlePublish = async (contentToPublish?: GeneratedContent) => {
    const content = contentToPublish || generatedContent;
    if (!selectedSiteId || !content) return;
    if (publishStatus === "future") {
      if (!scheduledDate) {
        setPublishError("Choose a date and time to schedule this post.");
        setPublishSuccess(null);
        return;
      }
      if (new Date(scheduledDate).getTime() <= Date.now()) {
        setPublishError("Schedule time must be in the future.");
        setPublishSuccess(null);
        return;
      }
    }
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    setPublishCheck(null);
    try {
      // Server-side generation only writes images into the body, so fall back to the
      // figure marked as featured there.
      const featuredFromBody = content.body.match(/<figure[^>]*data-placement="featured"[^>]*>\s*<img[^>]*src="([^"]+)"/i)?.[1];
      const featuredUrl = generatedImages.find((img) => img.placement === "featured")?.url || featuredFromBody;
      const result = await wordpressApi.publishPost(selectedSiteId, {
        title: content.title,
        content: content.body,
        excerpt: content.metaDescription,
        status: publishStatus,
        categories: postCategories ? postCategories.split(",").map((c) => c.trim()).filter(Boolean) : [],
        tags: postTags ? postTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        featuredImage: featuredUrl ? wordpressApi.imageUrl(featuredUrl) : undefined,
        scheduledDate: publishStatus === "future" ? scheduledDate : undefined,
        slug: publishSlug || undefined,
      });
      setPublishCheck(result.post.permalinkCheck ?? null);
      if (result.post.slug) setPublishSlug(result.post.slug);
      const link = result.post.permalink ? ` View at: ${result.post.permalink}` : "";
      if (publishStatus === "future") {
        setPublishSuccess(`Post scheduled for ${formatWallClock(scheduledDate)}.${link}`);
      } else if (publishStatus === "draft") {
        setPublishSuccess(`Saved as draft.${link}`);
      } else {
        setPublishSuccess(`Post published!${link}`);
      }
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

  const handleDeleteJob = async (jobId: string) => {
    try {
      await wordpressApi.deleteGenerationJob(jobId);
      setGenJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const handleDeleteAllJobs = async () => {
    try {
      await wordpressApi.deleteAllGenerationJobs();
      setGenJobs([]);
    } catch (e) {
      console.error("Delete all failed:", e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!selectedSiteId) return;
    try {
      await wordpressApi.deletePost(selectedSiteId, postId);
      setWpPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      console.error("Delete post failed:", e);
    }
  };

  return (
    <RequireAuth>
      <DashboardLayout>
        {/* MCP Banner */}
        {mcpBanner && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-400/10">
            <Sparkles className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-700 dark:text-blue-300">{mcpBanner}</p>
            <button onClick={() => setMcpBanner(null)} className="ml-auto text-blue-400 hover:text-blue-600">
              <X className="size-4" />
            </button>
          </div>
        )}
        <PageHeader />

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Package className="size-4" /> Skills</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{skills.length}</div>
            <div className="mt-1 text-xs text-brand-600 dark:text-brand-400">{skills.filter((s) => s.fileCount > 1).length} multi-file</div>
          </article>
          <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Globe className="size-4" /> WP Sites</div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{wpSites.length}</div>
            <div className="mt-1 text-xs text-brand-600 dark:text-brand-400">{wpSites.filter((s) => s.connected).length} connected</div>
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
                  <Brain className="size-[18px] shrink-0 text-slate-500 dark:text-slate-400" />
                  <div>
                    <h3 className="m-0 text-base text-slate-900 dark:text-white">Generate Post</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Describe what you want the AI to write</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSkill && (
                    <Badge className="bg-brand-100 text-brand-700 border-brand-200">
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus-visible:border-brand-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
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
                {isSuper && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">AI Model</label>
                    <ModelSelector
                      models={models}
                      value={selectedModel}
                      onChange={setModel}
                      className="flex-1"
                    />
                  </div>
                )}
                {modelsError && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>
                      {isSuper
                        ? "Could not load AI models. Open Settings → AI Provider and save the key."
                        : "Could not load AI models. The super user needs to set the AI provider."}
                    </span>
                  </div>
                )}

                {/* Pillar/Cluster reference file selector */}
                {contentFiles.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="size-4 text-slate-600 dark:text-slate-400" />
                        <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">Reference Pages from Quasar MCP</label>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-slate-500">{contentFiles.length} saved</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Select a saved page to use as context. The AI will match its tone, keywords, and link to it.
                    </p>

                    {/* File cards */}
                    <div className="mt-3 space-y-2">
                      {contentFiles.map((f) => {
                        const isPillar = f.pageType === "pillar";
                        const isCluster = f.pageType === "cluster";
                        const isSelected = selectedContentFileId === f.id;
                        const displayName = f.fileName.replace(/\.md$/, "").replace(/_\d+$/, "");

                        return (
                          <div
                            key={f.id}
                            className={`group flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                              isSelected
                                ? isPillar
                                  ? "border-brand-300 bg-brand-50 dark:border-brand-400/40 dark:bg-brand-400/10"
                                  : isCluster
                                  ? "border-teal-300 bg-teal-50 dark:border-teal-400/40 dark:bg-teal-400/10"
                                  : "border-blue-300 bg-blue-50 dark:border-blue-400/40 dark:bg-blue-400/10"
                                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                            }`}
                            onClick={() => {
                              setSelectedContentFileId(isSelected ? null : f.id);
                              setSuggestedTopics([]);
                            }}
                          >
                            {/* Icon */}
                            <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                              isPillar
                                ? "bg-brand-700 text-white hover:bg-brand-hover"
                                : isCluster
                                ? "bg-teal-500 text-white"
                                : "bg-slate-400 text-white"
                            }`}>
                              {isPillar ? <Building2 className="size-4" /> : isCluster ? <Layers className="size-4" /> : <FileText className="size-4" />}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{displayName}</p>
                                <Badge variant="outline" className={`shrink-0 text-[9px] uppercase ${
                                  isPillar
                                    ? "border-brand-200 text-brand-600 dark:border-brand-400/30 dark:text-brand-400"
                                    : isCluster
                                    ? "border-teal-200 text-teal-600 dark:border-teal-400/30 dark:text-teal-400"
                                    : "border-slate-200 text-slate-500 dark:border-slate-600 dark:text-slate-400"
                                }`}>
                                  {isPillar ? "Pillar" : isCluster ? "Cluster" : "Page"}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(f.createdAt)} · {formatBytes(f.fileSize)}</p>
                            </div>

                            {/* Selected check */}
                            {isSelected && (
                              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                            )}

                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete this reference page? This cannot be undone.")) {
                                  handleDeleteContentFile(f.id);
                                }
                              }}
                              className="shrink-0 rounded-md p-1.5 text-slate-500 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-400/10"
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    {selectedContentFileId && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSuggestTopics}
                          disabled={loadingTopics}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-400/30 dark:text-blue-300 dark:hover:bg-blue-400/10"
                        >
                          {loadingTopics ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                          Suggest Topics
                        </Button>
                        <button
                          onClick={() => {
                            setSelectedContentFileId(null);
                            setSuggestedTopics([]);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Clear selection
                        </button>
                      </div>
                    )}

                    {topicsError && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-red-600 dark:text-red-400">
                        <AlertCircle className="size-3" /> {topicsError}
                      </div>
                    )}

                    {/* Suggested topics */}
                    {suggestedTopics.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-3.5 text-blue-500" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Suggested cluster post topics — click to use:</p>
                        </div>
                        {suggestedTopics.map((topic, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectTopic(topic)}
                            className="block w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-blue-400 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-400/40"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{topic.title}</p>
                                <p className="mt-0.5 text-[11px] text-blue-600 dark:text-blue-400">Keyword: {topic.keyword}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{topic.description}</p>
                              </div>
                              <ArrowRight className="mt-1 size-4 shrink-0 text-blue-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Generate button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedSkillId ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Package className="size-3.5" /> Using skill: <strong className="text-slate-700 dark:text-slate-300">{selectedSkill?.name}</strong>
                        <button className="ml-1 text-brand-600 hover:underline" onClick={() => setSelectedSkillId(null)}>remove</button>
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Select a skill from the sidebar →</span>
                    )}
                    {selectedContentFileId && (() => {
                      const sf = contentFiles.find((f) => f.id === selectedContentFileId);
                      const isPillar = sf?.pageType === "pillar";
                      const isCluster = sf?.pageType === "cluster";
                      return (
                        <span className={`ml-2 inline-flex items-center gap-1.5 ${
                          isPillar ? "text-brand-600 dark:text-brand-400"
                          : isCluster ? "text-teal-600 dark:text-teal-400"
                          : "text-blue-600 dark:text-blue-400"
                        }`}>
                          {isPillar ? <Building2 className="size-3.5" /> : isCluster ? <Layers className="size-3.5" /> : <FileText className="size-3.5" />}
                          + {isPillar ? "pillar" : isCluster ? "cluster" : "reference"}
                        </span>
                      );
                    })()}
                  </div>
                  <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || generating || (!selectedSkillId && !selectedContentFileId)}
                    className="bg-brand-700 text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {generating ? "Generating..." : "Generate Post"}
                  </Button>
                </div>

                {/* Generation progress — premium animated loader */}
                <AnimatePresence>
                  {(generating || generatingImages) && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className={`relative overflow-hidden rounded-2xl border p-6 ${generatingImages ? "border-blue-200/60 bg-blue-50/80 dark:border-blue-400/20 dark:bg-blue-400/5" : "border-brand-200/60 bg-brand-50/80 dark:border-brand-400/20 dark:bg-brand-400/5"}`}
                    >
                      {/* Animated shimmer bar at top */}
                      <motion.div
                        className={`absolute inset-x-0 top-0 h-1 ${generatingImages ? "bg-blue-500" : "bg-brand-500"}`}
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: [0, 0.3, 0.6, 0.85, 1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      />

                      <div className="flex items-start gap-5">
                        {/* Animated AI brain icon with pulsing rings */}
                        <div className="relative grid size-16 shrink-0 place-items-center">
                          <motion.div
                            className={`absolute inset-0 rounded-2xl ${generatingImages ? "bg-blue-500/20" : "bg-brand-500/20"}`}
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                          />
                          <motion.div
                            className={`absolute inset-0 rounded-2xl ${generatingImages ? "bg-cyan-500/20" : "bg-brand-500/20"}`}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                          />
                          <motion.div
                            className={`relative grid size-14 place-items-center rounded-2xl shadow-lg ${generatingImages ? "bg-blue-600 shadow-blue-500/30" : "bg-brand-600 shadow-brand-500/30"}`}
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            {generatingImages ? <ImageIcon className="size-7 text-white" /> : <Brain className="size-7 text-white" />}
                          </motion.div>
                        </div>

                        {/* Step text + animated dots */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {generationStep}
                            </h4>
                            <span className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  className={`size-1.5 rounded-full ${generatingImages ? "bg-blue-500" : "bg-brand-500"}`}
                                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                />
                              ))}
                            </span>
                          </div>

                          {/* Progress steps timeline */}
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {[
                              { label: "Sending", icon: Send },
                              { label: "Processing", icon: Brain },
                              { label: "Writing", icon: Sparkles },
                              { label: "Images", icon: ImageIcon },
                              { label: "Done", icon: CheckCircle2 },
                            ].map((step, i) => {
                              const stepIndex = generationStep.includes("Sending") ? 0
                                : generationStep.includes("processing") ? 1
                                : generationStep.includes("Generating images") ? 3
                                : generationStep.includes("ready") ? 4
                                : 2;
                              const isActive = i === stepIndex;
                              const isDone = i < stepIndex;
                              const Icon = step.icon;
                              return (
                                <div key={step.label} className="flex items-center gap-2">
                                  <motion.div
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                      isActive
                                        ? generatingImages && i === 3
                                          ? "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"
                                          : "bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300"
                                        : isDone
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                                    }`}
                                    animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                                    transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                                  >
                                    <Icon className={`size-3.5 ${isActive ? "animate-pulse" : ""}`} />
                                    {step.label}
                                  </motion.div>
                                  {i < 4 && (
                                    <motion.div
                                      className="h-px w-4 bg-slate-200 dark:bg-slate-700"
                                      animate={{ opacity: isDone ? 1 : 0.3 }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                            {generatingImages
                              ? "Generating AI images with GPT Image 2. This may take 30-60 seconds per image."
                              : "This may take 1-3 minutes. The AI is crafting high-quality, SEO-optimized content for you."}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {genError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" /> {genError}
                  </div>
                )}
                {imageError && generatedImages.length === 0 && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span className="[overflow-wrap:anywhere]">{imageError}</span>
                  </div>
                )}
              </div>
            </article>

            {/* Generated content summary */}
            {generatedContent && (
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/5">
                  <div className="flex gap-2.75">
                    <CheckCircle2 className="size-[18px] shrink-0 text-slate-500 dark:text-slate-400" />
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">Generation Complete</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">AI-generated content ready to review</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={handleCopyContent}><Copy className="size-3.5" /> Copy</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => openPreview(generatedContent)}><Eye className="size-3.5" /> View Content</Button>
                    {wpSites.length > 0 && (
                      <Button type="button" size="sm" className="bg-brand-700 hover:bg-brand-hover" onClick={() => openPublishModal(generatedContent)}><Send className="size-3.5" /> Use for Publishing</Button>
                    )}
                  </div>
                </header>
                <div className="p-5">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{generatedContent.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{generatedContent.metaDescription}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Type className="size-3.5" /> {generatedContent.wordCount} words</span>
                      <span className="flex items-center gap-1"><Clock className="size-3.5" /> {generatedContent.readingTime} min read</span>
                      <span className="flex items-center gap-1"><Globe className="size-3.5" /> Slug: {generatedContent.slug}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5" /> SEO-optimized</span>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Generated images gallery (auto-generated, shown after images are ready) */}
            {generatedImages.length > 0 && (
              <article className="overflow-hidden rounded-3xl border border-blue-200 bg-white dark:border-blue-400/20 dark:bg-slate-900/50">
                <header className="flex items-center justify-between gap-4 border-b border-blue-100 px-6 py-5 dark:border-blue-400/10">
                  <div className="flex gap-2.75">
                    <ImageIcon className="size-[18px] shrink-0 text-slate-500 dark:text-slate-400" />
                    <div>
                      <h3 className="m-0 text-base text-slate-900 dark:text-white">AI Generated Images</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{generatedImages.length} image{generatedImages.length > 1 ? "s" : ""} auto-generated and inserted into content</p>
                    </div>
                  </div>
                  <CheckCircle2 className="size-5 text-emerald-500" />
                </header>
                <div className="p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {generatedImages.map((img, i) => (
                      <motion.div
                        key={img.filename}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/10"
                      >
                        <img
                          src={wordpressApi.imageUrl(img.url)}
                          alt={img.placement}
                          className="aspect-video w-full object-cover"
                        />
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                              {img.placement.replace(/-/g, " ")}
                            </span>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{img.prompt.slice(0, 100)}...</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {imageError && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                      <AlertCircle className="size-4 shrink-0" /> {imageError}
                    </div>
                  )}
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
                    <AnimatePresence mode="popLayout">
                    {completedJobs.map((job) => {
                      const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.completed;
                      const StatusIcon = status.icon;
                      return (
                        <motion.article
                          key={job.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
                            <div className="flex items-center gap-2.5">
                              <StatusIcon className={`size-4 ${job.status === "completed" ? "text-emerald-600" : "text-red-500"}`} />
                              <Badge className={status.color}>{status.label}</Badge>
                              {job.skill && <Badge variant="outline" className="text-[10px]"><Package className="size-2.5" /> {job.skill.name}</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">{formatDate(job.completedAt || job.createdAt)}</span>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="grid size-7 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
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
                                  onClick={() => job.result && openPreview(job.result)}
                                >
                                  <Eye className="size-3.5" /> View Content
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-brand-700 hover:bg-brand-hover"
                                  onClick={() => {
                                    if (job.result) openPublishModal(job.result);
                                  }}
                                >
                                  <Send className="size-3.5" /> Use for Publishing
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.article>
                      );
                    })}
                    </AnimatePresence>
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
                    <>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={handleDeleteAllJobs} className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-400/10">
                          <Trash2 className="size-3.5" /> Clear All
                        </Button>
                      </div>
                      <AnimatePresence mode="popLayout">
                      {genJobs.map((job) => {
                      const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.idle;
                      const StatusIcon = status.icon;
                      return (
                        <motion.div
                          key={job.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900/50">
                          <StatusIcon className={`size-4 shrink-0 ${job.status === "generating" ? "animate-spin text-blue-500" : job.status === "completed" ? "text-emerald-500" : job.status === "failed" ? "text-red-500" : "text-amber-500"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{job.prompt}</p>
                            <p className="text-xs text-slate-400">{formatDate(job.createdAt)}</p>
                            {job.status === "completed" && job.result && (
                              <p className="mt-0.5 text-xs text-slate-500">{job.result.title} · {job.result.wordCount} words</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge className={`${status.color}`}>{status.label}</Badge>
                            {job.status === "completed" && job.result && wpSites.length > 0 && (
                              <Button
                                size="xs"
                                className="bg-brand-700 hover:bg-brand-hover"
                                onClick={() => openPublishModal(job.result as GeneratedContent)}
                              >
                                <Send className="size-3" /> Use for Publishing
                              </Button>
                            )}
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                      })}
                      </AnimatePresence>
                    </>
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
                    <AnimatePresence mode="popLayout">
                    {wpPosts.map((post) => {
                      const statusView = postStatusPresentation(post.status);
                      return (
                      <motion.div
                        key={post.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900/50">
                        <Newspaper className="size-4 shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{post.title}</p>
                          <p className="text-xs text-slate-400">
                            {post.status === "future" && post.scheduledDate
                              ? `Scheduled ${formatWallClock(post.scheduledDate)}`
                              : formatDate(post.createdAt)}
                          </p>
                        </div>
                        <Badge className={`shrink-0 ${statusView.className}`}>
                          {statusView.label}
                        </Badge>
                        {post.permalink && (
                          <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-600 hover:underline">
                            <ArrowRight className="size-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </motion.div>
                      );
                    })}
                    </AnimatePresence>
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
                  <Package className="size-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  <div>
                    <h3 className="m-0 text-sm text-slate-900 dark:text-white">Skill Library</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Upload .md or .zip skill files</p>
                  </div>
                </div>
              </header>
              <div className="p-4">
                {/* Upload zone */}
                <div
                  className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/30 dark:border-white/15 dark:bg-slate-800/30 dark:hover:border-brand-400/40 dark:hover:bg-brand-400/5"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-brand-400"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("border-brand-400"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-brand-400");
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
                      <Loader2 className="size-6 animate-spin text-brand-500" />
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
                {showSkeleton ? (
                  <div className="space-y-2 py-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-slate-100 p-3 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="size-8 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="mt-1.5 h-3 w-40" />
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                      </div>
                    ))}
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
                            ? "border-brand-300 bg-brand-50/50 dark:border-brand-400/30 dark:bg-brand-400/10"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-white/20"
                        }`}
                        onClick={() => setSelectedSkillId(selectedSkillId === skill.id ? null : skill.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="size-3.5 shrink-0 text-brand-500" />
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
                            className="shrink-0 rounded-lg p-1.5 text-slate-500 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-400/10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSkill(skill.id); }}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        {selectedSkillId === skill.id && (
                          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                            <ArrowRight className="size-3" /> Selected for generation
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* Brand Profile */}
            <article className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <header className="border-b border-slate-100 px-5 py-4 dark:border-white/5">
                <div className="flex gap-2.5">
                  <Building2 className="size-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  <div>
                    <h3 className="m-0 text-sm text-slate-900 dark:text-white">Brand Profile</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Select brand for content generation</p>
                  </div>
                </div>
              </header>
              <div className="p-4">
                {brands.length === 0 ? (
                  <div className="py-6 text-center">
                    <Building2 className="mx-auto size-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-xs text-slate-400">No brands yet</p>
                    <p className="mt-1 text-[10px] text-slate-400">Create one in Settings → Branding</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {brands.map((brand) => {
                      const selected = selectedBrandId === brand.id;
                      return (
                        <div
                          key={brand.id}
                          className={`group rounded-xl border p-3 transition-all cursor-pointer ${
                            selected
                              ? "border-blue-300 bg-blue-50/50 dark:border-blue-400/30 dark:bg-blue-400/10"
                              : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-white/20"
                          }`}
                          onClick={() => setSelectedBrandId(selected ? null : brand.id)}
                        >
                          <div className="flex items-start gap-3">
                            {brand.logoUrl ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}${brand.logoUrl}`}
                                alt={brand.companyName}
                                className="size-9 shrink-0 rounded-lg border border-slate-200 object-contain dark:border-white/10"
                              />
                            ) : (
                              <span
                                className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-black text-white"
                                style={{ backgroundColor: brand.defaultColor }}
                              >
                                {brand.companyName.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{brand.companyName}</p>
                                {brand.isDefault && (
                                  <Badge variant="outline" className="text-[9px]">Default</Badge>
                                )}
                              </div>
                              {brand.industry && (
                                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{brand.industry}</p>
                              )}
                              {selected && (
                                <div className="mt-2 space-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                                  {brand.tagline && <p className="italic">&ldquo;{brand.tagline}&rdquo;</p>}
                                  {brand.website && <p className="flex items-center gap-1"><Globe className="size-2.5" /> {brand.website.replace(/^https?:\/\//, "")}</p>}
                                  {brand.email && <p className="flex items-center gap-1"><Tag className="size-2.5" /> {brand.email}</p>}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {brand.socialLinks?.twitter && <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">Twitter</span>}
                                    {brand.socialLinks?.linkedin && <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">LinkedIn</span>}
                                    {brand.socialLinks?.facebook && <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">Facebook</span>}
                                    {brand.socialLinks?.instagram && <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">Instagram</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {selected && (
                            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                              <ArrowRight className="size-3" /> Selected for generation
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>

            {/* How it works */}
            <article className="rounded-3xl border border-slate-200 bg-brand-50/80 p-5 dark:border-white/10 dark:bg-brand-400/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">How it works</h3>
              <ol className="mt-3 space-y-2.5">
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-400/20 dark:text-brand-400">1</span>
                  Connect your WordPress site & sync data
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-400/20 dark:text-brand-400">2</span>
                  Upload skill files (.md or .zip)
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-400/20 dark:text-brand-400">3</span>
                  Select a skill & write your prompt
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-400/20 dark:text-brand-400">4</span>
                  AI generates content via your configured provider
                </li>
                <li className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-400/20 dark:text-brand-400">5</span>
                  Review & publish to WordPress
                </li>
              </ol>
            </article>
          </aside>
        </div>
      </DashboardLayout>

      {/* Full content preview modal — WordPress-style editor */}
      {previewOpen && previewContent && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#f0f0f1]" onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false); }}>
          {/* Top bar */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-300 bg-[#1d2327] px-4 text-white md:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded bg-brand-600">
                <FileText className="size-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">
                  {editMode ? "Editing" : "Preview"}: {editMode ? editTitle : previewContent.title}
                </h3>
                <p className="truncate text-xs text-slate-400">
                  {editMode ? "Make changes and save" : "Ready to publish"} · {previewContent.wordCount} words
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {editMode ? (
                <>
                  <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700 hover:text-white" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={saveEdits}>
                    <Save className="size-3.5" /> Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700 hover:text-white" onClick={() => setEditMode(true)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700 hover:text-white" onClick={() => navigator.clipboard.writeText(`${previewContent.title}\n\n${previewContent.metaDescription}\n\n${previewContent.body}`)}>
                    <Copy className="size-3.5" /> Copy
                  </Button>
                  <Button type="button" size="sm" className="bg-brand-700 hover:bg-brand-hover" onClick={() => { if (previewContent) openPublishModal(previewContent); setPreviewOpen(false); }}>
                    <Send className="size-3.5" /> Publish
                  </Button>
                </>
              )}
              <button className="grid size-8 place-items-center rounded text-slate-400 hover:bg-slate-700 hover:text-white" onClick={() => setPreviewOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
          </header>

          {/* Formatting toolbar — clearly visible edit mode */}
          {editMode && (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-300 bg-[#f6f7f7] px-4 py-3">
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 shadow-sm">
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Bold" onClick={() => execCmd("bold")}>
                  <Bold className="size-4" /> <span className="hidden md:inline">Bold</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Italic" onClick={() => execCmd("italic")}>
                  <Italic className="size-4" /> <span className="hidden md:inline">Italic</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Underline" onClick={() => execCmd("underline")}>
                  <Underline className="size-4" /> <span className="hidden md:inline">Underline</span>
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 shadow-sm">
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Paragraph" onClick={() => applyHeading("p")}>
                  <span className="text-xs font-bold">P</span> <span className="hidden md:inline">P</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Heading 2" onClick={() => applyHeading("h2")}>
                  <Heading2 className="size-4" /> <span className="hidden md:inline">H2</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Heading 3" onClick={() => applyHeading("h3")}>
                  <Heading3 className="size-4" /> <span className="hidden md:inline">H3</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Blockquote" onClick={() => applyHeading("blockquote")}>
                  <Quote className="size-4" /> <span className="hidden md:inline">Quote</span>
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 shadow-sm">
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Bulleted List" onClick={() => execCmd("insertUnorderedList")}>
                  <List className="size-4" /> <span className="hidden md:inline">List</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Numbered List" onClick={() => execCmd("insertOrderedList")}>
                  <ListOrdered className="size-4" /> <span className="hidden md:inline">1,2</span>
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 shadow-sm">
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Insert Link" onClick={insertLink}>
                  <Link2 className="size-4" /> <span className="hidden md:inline">Link</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Insert Image" onClick={insertImage}>
                  <ImageIcon className="size-4" /> <span className="hidden md:inline">Image</span>
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 shadow-sm">
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Undo" onClick={() => execCmd("undo")}>
                  <Undo2 className="size-4" /> <span className="hidden md:inline">Undo</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700" title="Redo" onClick={() => execCmd("redo")}>
                  <Redo2 className="size-4" /> <span className="hidden md:inline">Redo</span>
                </button>
                <button className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50" title="Clear Formatting" onClick={() => execCmd("removeFormat")}>
                  <XCircle className="size-4" /> <span className="hidden md:inline">Clear</span>
                </button>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar */}
            <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-slate-300 bg-white p-5 lg:block">
              <div className="space-y-6">
                {/* Slug — editable in edit mode */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500">Slug</h4>
                  {editMode ? (
                    <input
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                    />
                  ) : (
                    <p className="mt-2 break-all text-sm text-slate-700">{previewContent.slug}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500">Stats</h4>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-md bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase text-slate-400">Word Count</p>
                      <p className="mt-0.5 text-sm text-slate-700">{previewContent.wordCount} words</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase text-slate-400">Reading Time</p>
                      <p className="mt-0.5 text-sm text-slate-700">{previewContent.readingTime} min</p>
                    </div>
                  </div>
                </div>

                {previewContent.headings && previewContent.headings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500">Headings</h4>
                    <ul className="mt-3 space-y-2">
                      {previewContent.headings.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                          <span className="line-clamp-2">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewContent.imagePrompts && previewContent.imagePrompts.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500">Image Prompts ({previewContent.imagePrompts.length})</h4>
                    <div className="mt-3 space-y-3">
                      {previewContent.imagePrompts.map((img, i) => (
                        <div key={i} className="rounded-md border border-brand-200 bg-brand-50/50 p-3">
                          <p className="text-xs font-bold text-brand-700">{img.placement}</p>
                          <p className="mt-1 text-xs text-slate-600 line-clamp-4">{img.prompt}</p>
                          <button className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline" onClick={() => navigator.clipboard.writeText(img.prompt)}>
                            <Copy className="size-3" /> Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Main canvas */}
            <main className="flex flex-1 flex-col overflow-hidden bg-[#f0f0f1] p-4 md:p-6 lg:p-8">
              <div className="flex flex-1 flex-col overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-xl">
                <div className="flex-1 px-6 py-10 md:px-12 md:py-14 lg:px-20 lg:py-16">
                  <article className="mx-auto max-w-4xl">
                    {/* Title — editable or static */}
                    {editMode ? (
                      <input
                        className="w-full border-none bg-transparent text-3xl font-extrabold leading-tight text-slate-900 outline-none md:text-4xl lg:text-5xl"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Post title..."
                      />
                    ) : (
                      <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl lg:text-5xl">
                        {previewContent.title}
                      </h1>
                    )}

                    {/* Meta description — editable or static */}
                    {editMode ? (
                      <textarea
                        className="mt-4 w-full resize-none border-none bg-transparent text-lg text-slate-600 outline-none md:text-xl"
                        value={editMeta}
                        onChange={(e) => setEditMeta(e.target.value)}
                        rows={2}
                        placeholder="Meta description..."
                      />
                    ) : (
                      <p className="mt-4 text-lg text-slate-600 md:text-xl">
                        {previewContent.metaDescription}
                      </p>
                    )}

                    {/* Meta badges */}
                    <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-6 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1">
                        <Tag className="size-3.5" /> {editMode ? editSlug : previewContent.slug}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                        <Type className="size-3.5" /> {previewContent.wordCount} words
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                        <Clock className="size-3.5" /> {previewContent.readingTime} min read
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-brand-700">
                        <CheckCircle2 className="size-3.5" /> SEO optimized
                      </span>
                    </div>

                    {/* Body — contentEditable in edit mode, static in preview */}
                    {editMode ? (
                      <div
                        ref={bodyEditRef}
                        contentEditable
                        suppressContentEditableWarning
                        className="prose prose-lg max-w-none space-y-6 pt-8 text-slate-800 outline-none [&>*]:mb-6 [&_h2]:mt-10 [&_h2]:mb-5 [&_h2]:border-b [&_h2]:border-brand-100 [&_h2]:pb-2 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-800 [&_p]:mb-5 [&_p]:leading-[1.85] [&_a]:font-semibold [&_a]:text-brand-600 [&_a]:underline [&_ul]:my-5 [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-6 [&_blockquote]:rounded-md [&_blockquote]:border-l-4 [&_blockquote]:border-brand-500 [&_blockquote]:bg-brand-50/40 [&_blockquote]:p-5 [&_blockquote]:italic [&_strong]:font-bold [&_table]:my-6 [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_thead]:bg-slate-100 [&_th]:border [&_th]:border-slate-300 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-sm [&_th]:font-bold [&_td]:border [&_td]:border-slate-300 [&_td]:px-4 [&_td]:py-3 [&_td]:text-sm [&_tr:nth-child(even)]:bg-slate-50/60 [&_figure]:relative [&_figure]:my-8 [&_figure]:cursor-grab [&_figure]:overflow-hidden [&_figure]:rounded-xl [&_figure]:border [&_figure]:border-slate-200 [&_figure:hover]:ring-2 [&_figure:hover]:ring-brand-400 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-xl focus:outline-none"
                        dangerouslySetInnerHTML={{ __html: cleanBodyForPreview(previewContent.body) }}
                      />
                    ) : (
                      <div
                        className="prose prose-lg max-w-none space-y-6 pt-8 text-slate-800 [&>*]:mb-6 [&_h2]:mt-10 [&_h2]:mb-5 [&_h2]:border-b [&_h2]:border-brand-100 [&_h2]:pb-2 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-800 [&_p]:mb-5 [&_p]:leading-[1.85] [&_a]:font-semibold [&_a]:text-brand-600 [&_a]:underline [&_ul]:my-5 [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-6 [&_blockquote]:rounded-md [&_blockquote]:border-l-4 [&_blockquote]:border-brand-500 [&_blockquote]:bg-brand-50/40 [&_blockquote]:p-5 [&_blockquote]:italic [&_strong]:font-bold [&_table]:my-6 [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_thead]:bg-slate-100 [&_th]:border [&_th]:border-slate-300 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-sm [&_th]:font-bold [&_td]:border [&_td]:border-slate-300 [&_td]:px-4 [&_td]:py-3 [&_td]:text-sm [&_tr:nth-child(even)]:bg-slate-50/60 [&_figure]:my-8 [&_figure]:rounded-xl [&_figure]:overflow-hidden [&_figure]:border [&_figure]:border-slate-200 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-xl [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-slate-500 [&_figcaption]:italic"
                        dangerouslySetInnerHTML={{ __html: cleanBodyForPreview(previewContent.body) }}
                      />
                    )}
                    <ImageReorderLayer editorRef={bodyEditRef} active={editMode} />
                  </article>
                </div>
              </div>
            </main>
          </div>
        </div>,
        document.body
      )}

      {/* Publish to WordPress modal */}
      <PublishModal
        open={publishModalOpen}
        onClose={closePublishModal}
        content={publishModalContent}
        wpSites={wpSites}
        selectedSiteId={selectedSiteId}
        setSelectedSiteId={setSelectedSiteId}
        publishStatus={publishStatus}
        setPublishStatus={setPublishStatus}
        scheduledDate={scheduledDate}
        setScheduledDate={setScheduledDate}
        siteTimezone={siteData?.timezone || ""}
        taxonomy={taxonomy}
        taxonomyLoading={taxonomyLoading}
        onSyncTaxonomy={() => setTaxonomyTick((t) => t + 1)}
        postCategories={postCategories}
        setPostCategories={setPostCategories}
        postTags={postTags}
        setPostTags={setPostTags}
        onPublish={() => publishModalContent && handlePublish(publishModalContent)}
        publishing={publishing}
        publishSuccess={publishSuccess}
        publishError={publishError}
        slug={publishSlug}
        setSlug={setPublishSlug}
        check={publishCheck}
      />
    </RequireAuth>
  );
}

// Existing categories/tags of the site as toggle chips. The value stays a comma
// list of names, so typing a brand-new one still works.
function TermPicker({ label, terms, loading, value, onChange }: { label: string; terms: SiteTerm[] | null; loading: boolean; value: string; onChange: (v: string) => void }) {
  const chosen = value.split(",").map((t) => t.trim()).filter(Boolean);
  const isOn = (name: string) => chosen.some((c) => c.toLowerCase() === name.toLowerCase());
  const toggle = (name: string) => {
    const next = isOn(name) ? chosen.filter((c) => c.toLowerCase() !== name.toLowerCase()) : [...chosen, name];
    onChange(next.join(", "));
  };
  if (loading) return <p className="-mt-2 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="size-3 animate-spin" /> Loading {label.toLowerCase()}…</p>;
  if (!terms) return <p className="-mt-2 text-xs text-slate-500">Could not read this site’s {label.toLowerCase()}. Press Sync to try again, or type them above.</p>;
  if (terms.length === 0) return <p className="-mt-2 text-xs text-slate-500">Nothing found. Press Sync to fetch again, or type a new name above and it will be created.</p>;
  return (
    <div className="-mt-2">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className="mt-1.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
        {terms.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.name)}
            aria-pressed={isOn(t.name)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${isOn(t.name) ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 text-slate-700 hover:border-brand-700 dark:border-white/15 dark:text-slate-200"}`}
          >
            {t.name}{t.count > 0 && <span className="ml-1 opacity-60">{t.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function PublishModal({
  open,
  onClose,
  content,
  wpSites,
  selectedSiteId,
  setSelectedSiteId,
  publishStatus,
  setPublishStatus,
  scheduledDate,
  setScheduledDate,
  siteTimezone,
  taxonomy,
  taxonomyLoading,
  onSyncTaxonomy,
  postCategories,
  setPostCategories,
  postTags,
  setPostTags,
  onPublish,
  publishing,
  publishSuccess,
  publishError,
  slug,
  setSlug,
  check,
}: {
  open: boolean;
  onClose: () => void;
  content: GeneratedContent | null;
  wpSites: WordPressSite[];
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  publishStatus: PublishStatus;
  setPublishStatus: (status: PublishStatus) => void;
  scheduledDate: string;
  setScheduledDate: (value: string) => void;
  siteTimezone: string;
  taxonomy: { categories: SiteTerm[]; tags: SiteTerm[] } | null;
  taxonomyLoading: boolean;
  onSyncTaxonomy: () => void;
  postCategories: string;
  setPostCategories: (v: string) => void;
  postTags: string;
  setPostTags: (v: string) => void;
  onPublish: () => void;
  publishing: boolean;
  publishSuccess: string | null;
  publishError: string | null;
  slug: string;
  setSlug: (v: string) => void;
  check: PermalinkCheck | null;
}) {
  if (!open || !content) return null;
  const siteUrl = (wpSites.find((s) => s.id === selectedSiteId)?.siteUrl ?? "").replace(/\/+$/, "");
  const fromTitle = trimSlug(slugify(content.title));
  const slugOk = slug.length >= 3 && slugMatchesTitle(slug, content.title);
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-brand-200 bg-white shadow-2xl dark:border-brand-400/20 dark:bg-slate-900"
      >
        <header className="flex items-center justify-between gap-4 border-b border-brand-100 px-6 py-5 dark:border-brand-400/10">
          <div className="flex gap-2.75">
            <Newspaper className="size-[18px] shrink-0 text-slate-500 dark:text-slate-400" />
            <div>
              <h3 className="m-0 text-base text-slate-900 dark:text-white">Publish to WordPress</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{content.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            <X className="size-4" />
          </button>
        </header>
        <div className="p-6 space-y-4">
          {publishSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" /> {publishSuccess}
            </div>
          )}
          {check && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${check.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200" : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"}`}>
              <p className="flex items-center gap-2 font-semibold">
                {check.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                {check.ok ? "Link checked: it matches the title" : "Link needs attention"}
              </p>
              <a href={check.url} target="_blank" rel="noreferrer" className="mt-1 block break-all font-mono text-xs underline">{check.url}</a>
              {check.problems.map((p) => <p key={p} className="mt-1.5">{p}</p>)}
              {check.notes.map((n) => <p key={n} className="mt-1.5 text-xs opacity-80">{n}</p>)}
            </div>
          )}
          {publishError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" /> {publishError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">WordPress Site</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select a site...</option>
              {wpSites.map((site) => (
                <option key={site.id} value={site.id}>{site.siteName || site.siteUrl}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Publish Status</label>
              <select
                value={publishStatus}
                onChange={(e) => {
                  const next = e.target.value as PublishStatus;
                  setPublishStatus(next);
                  if (next === "future" && !scheduledDate) setScheduledDate(defaultScheduleValue());
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-800 dark:text-white"
              >
                <option value="draft">Draft</option>
                <option value="publish">Publish Immediately</option>
                <option value="future">Schedule</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Categories</label>
                <button
                  type="button"
                  onClick={onSyncTaxonomy}
                  disabled={taxonomyLoading}
                  title="Fetch the categories and tags that exist on this site"
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold normal-case text-brand-700 hover:bg-brand-50 disabled:opacity-60 dark:text-brand-300 dark:hover:bg-white/5"
                >
                  <RefreshCw className={`size-3 ${taxonomyLoading ? "animate-spin" : ""}`} /> Sync
                </button>
              </div>
              <Input className="mt-2" placeholder="Pick below or type a new one" value={postCategories} onChange={(e) => setPostCategories(e.target.value)} />
            </div>
          </div>
          <TermPicker
            label="Categories on this site"
            terms={taxonomy?.categories ?? null}
            loading={taxonomyLoading}
            value={postCategories}
            onChange={setPostCategories}
          />
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Tags</label>
            <Input className="mt-2" placeholder="Pick below or type a new one" value={postTags} onChange={(e) => setPostTags(e.target.value)} />
          </div>
          <TermPicker
            label="Tags on this site"
            terms={taxonomy?.tags ?? null}
            loading={taxonomyLoading}
            value={postTags}
            onChange={setPostTags}
          />
          <div>
            <label htmlFor="publish-slug" className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Page link</label>
            <div className="mt-2 flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-brand-500/40 dark:border-white/15 dark:bg-slate-800">
              <span className="max-w-[45%] shrink-0 truncate bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">{siteUrl ? `${siteUrl.replace(/^https?:\/\//, "")}/` : "yoursite.com/"}</span>
              <input
                id="publish-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value.replace(/\s+$/, "-")))}
                onBlur={() => setSlug(trimSlug(slugify(slug)))}
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-sm text-slate-900 outline-none dark:text-white"
              />
            </div>
            <p className={`mt-1.5 text-xs ${slugOk ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
              {slugOk
                ? "Matches the title. Short, lowercase words."
                : "This link doesn't match the title, so search engines and readers get a weaker signal."}
              {!slugOk && fromTitle && (
                <button type="button" onClick={() => setSlug(fromTitle)} className="ml-1.5 font-semibold underline">Use “{fromTitle}”</button>
              )}
            </p>
          </div>
          {publishStatus === "future" && (
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Schedule date</label>
              <Input
                className="mt-2"
                type="datetime-local"
                value={scheduledDate}
                min={localDateTimeValue(new Date())}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                WordPress publishes at this time in the site timezone{siteTimezone ? ` (${siteTimezone})` : ""}.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button size="lg" variant="outline" className="flex-1" onClick={onClose} disabled={publishing}>Cancel</Button>
            <Button
              type="button"
              size="lg"
              className="flex-1 bg-brand-700 hover:bg-brand-hover"
              onClick={onPublish}
              disabled={publishing || !selectedSiteId || (publishStatus === "future" && !scheduledDate)}
            >
              {publishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {publishActionLabel(publishStatus, publishing)}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export default function PostCreatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-slate-400" /></div>}>
      <PostCreateContent />
    </Suspense>
  );
}
