"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { useSearchParams } from "next/navigation";
import {
  setGenerating, updateProgress, setGeneratedContent, addToHistory,
} from "@/lib/store/postSlice";
import {
  PenLine, Sparkles, FileText, Clock, Eye, Copy, Download,
  Check, ChevronRight, History, Type, Target,
  Globe, Loader2, AlertCircle, Send, Newspaper,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  wordpressApi,
  type WordPressSite,
  type WordPressPost,
} from "@/lib/wordpress-api";

function PostCreateContent() {
  const post = useSelector((state: RootState) => state.post);
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  const [wpSites, setWpSites] = useState<WordPressSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [wpPosts, setWpPosts] = useState<WordPressPost[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"draft" | "publish" | "future">("draft");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postExcerpt, setPostExcerpt] = useState("");
  const [postCategories, setPostCategories] = useState("");
  const [postTags, setPostTags] = useState("");

  // Form state for content generation
  const [prompt, setPrompt] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [contentType, setContentType] = useState("Blog Post");
  const [tone, setTone] = useState("Professional");
  const [wordCount, setWordCount] = useState("1500");
  const [language, setLanguage] = useState("English");
  const [audience, setAudience] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [outline, setOutline] = useState("");
  const [genError, setGenError] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    try {
      const sites = await wordpressApi.getSites();
      setWpSites(sites.filter((s) => s.connected));
      const siteIdFromUrl = searchParams.get("siteId");
      if (siteIdFromUrl && sites.some((s) => s.id === siteIdFromUrl)) {
        setSelectedSiteId(siteIdFromUrl);
      } else if (sites.length > 0) {
        setSelectedSiteId(sites[0].id);
      }
    } catch {
      // Silently fail - user may not have WordPress connected
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const fetchPosts = useCallback(async () => {
    if (!selectedSiteId) return;
    try {
      const posts = await wordpressApi.getPosts(selectedSiteId);
      setWpPosts(posts);
    } catch {
      // ignore
    }
  }, [selectedSiteId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (post.generatedContent) {
      setPostTitle(post.generatedContent.title);
      setPostContent(post.generatedContent.body);
      setPostExcerpt(post.generatedContent.metaDescription);
    }
  }, [post.generatedContent]);

  const handleGenerate = async () => {
    const finalPrompt = prompt || targetKeyword;
    if (!finalPrompt.trim()) return;

    setGenError(null);
    dispatch(setGenerating(true));
    dispatch(updateProgress({ progress: 10, step: "Analyzing keyword intent..." }));

    try {
      dispatch(updateProgress({ progress: 30, step: "Researching topic and generating outline..." }));

      const result = await wordpressApi.generateContent({
        prompt: finalPrompt,
        contentType,
        tone,
        wordCount: parseInt(wordCount, 10) || 1500,
        language,
        audience,
        callToAction,
        secondaryKeywords,
        outline,
      });

      dispatch(updateProgress({ progress: 80, step: "Finalizing content..." }));

      const content = result.content;
      dispatch(setGeneratedContent({
        title: content.title,
        metaDescription: content.metaDescription,
        slug: content.slug,
        headings: content.headings,
        body: content.body,
        wordCount: content.wordCount,
        readingTime: content.readingTime,
      }));

      setPostTitle(content.title);
      setPostContent(content.body);
      setPostExcerpt(content.metaDescription);

      dispatch(addToHistory({ keyword: finalPrompt, title: content.title }));
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Failed to generate content");
      dispatch(setGenerating(false));
    }
  };

  const handlePublish = async () => {
    if (!selectedSiteId || !postTitle || !postContent) return;
    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    try {
      const result = await wordpressApi.publishPost(selectedSiteId, {
        title: postTitle,
        content: postContent,
        excerpt: postExcerpt,
        status: publishStatus,
        categories: postCategories ? postCategories.split(",").map((c) => c.trim()).filter(Boolean) : [],
        tags: postTags ? postTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      setPublishSuccess(`Post published successfully! View at: ${result.post.permalink}`);
      await fetchPosts();
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to publish post");
    } finally {
      setPublishing(false);
    }
  };

  const publishedCount = wpPosts.filter((p) => p.status === "publish").length;
  const draftCount = wpPosts.filter((p) => p.status === "draft").length;
  const scheduledCount = wpPosts.filter((p) => p.status === "future").length;

  return (
    <RequireAuth>
    <DashboardLayout>
      {/* Hero */}
      <section className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
          <PenLine className="size-3.5" />
          Content Engine
        </div>
        <h1 className="mt-5 text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
          Post{" "}
          <em className="not-italic bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Creator
          </em>
        </h1>
        <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
          Generate SEO-optimized content from a single keyword. AI writes the title, meta description, headings, and full article body — aligned with your audit data and search intent.
        </p>
      </section>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><FileText className="size-4" /> Total Posts</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{wpPosts.length}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Check className="size-4" /> Published</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{publishedCount}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><History className="size-4" /> Drafts</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{draftCount}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Clock className="size-4" /> Scheduled</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{scheduledCount}</div>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Form column */}
        <div className="space-y-6">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><PenLine className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Content Configuration</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Define your target keyword and content parameters</p>
                </div>
              </div>
            </header>
            <div className="p-5 space-y-4">
              {/* Prompt */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Prompt / Topic</label>
                <Textarea className="mt-2" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe what you want the AI to write about..." rows={3} />
              </div>

              {/* Target keyword */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Target Keyword (optional)</label>
                <Input className="mt-2" placeholder="e.g. ai seo audit tool" value={targetKeyword} onChange={(e) => setTargetKeyword(e.target.value)} />
              </div>

              {/* Secondary keywords */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Secondary Keywords</label>
                <Input className="mt-2" placeholder="comma-separated keywords" value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} />
              </div>

              {/* Content type + Tone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Content Type</label>
                  <Select value={contentType} onValueChange={(v) => setContentType(v ?? "Blog Post")}>
                    <SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Blog Post">Blog Post</SelectItem>
                      <SelectItem value="Landing Page">Landing Page</SelectItem>
                      <SelectItem value="Product Page">Product Page</SelectItem>
                      <SelectItem value="Guide">Guide</SelectItem>
                      <SelectItem value="Comparison">Comparison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Tone</label>
                  <Select value={tone} onValueChange={(v) => setTone(v ?? "Professional")}>
                    <SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Persuasive">Persuasive</SelectItem>
                      <SelectItem value="Conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Word count + Language */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Word Count</label>
                  <Select value={wordCount} onValueChange={(v) => setWordCount(v ?? "1500")}>
                    <SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="1000">1,000</SelectItem>
                      <SelectItem value="1500">1,500</SelectItem>
                      <SelectItem value="2000">2,000</SelectItem>
                      <SelectItem value="3000">3,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Language</label>
                  <Select value={language} onValueChange={(v) => setLanguage(v ?? "English")}>
                    <SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Portuguese">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Audience */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Target Audience</label>
                <Input className="mt-2" placeholder="e.g. SaaS marketing managers" value={audience} onChange={(e) => setAudience(e.target.value)} />
              </div>

              {/* Call to action */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Call to Action</label>
                <Input className="mt-2" placeholder="e.g. Start your free audit today" value={callToAction} onChange={(e) => setCallToAction(e.target.value)} />
              </div>

              {/* Outline */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Custom Outline (optional)</label>
                <Textarea className="mt-2" placeholder="Add section headings or notes for the AI..." value={outline} onChange={(e) => setOutline(e.target.value)} />
              </div>

              {genError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                  <AlertCircle className="size-4 shrink-0" />
                  {genError}
                </div>
              )}

              <Separator />

              <Button className="w-full" size="lg" onClick={handleGenerate} disabled={post.isGenerating || (!prompt.trim() && !targetKeyword.trim())}>
                {post.isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {post.isGenerating ? "Generating..." : "Generate Content"}
              </Button>
            </div>
          </article>

          {/* WordPress Publishing Panel */}
          {wpSites.length > 0 ? (
            <article className="overflow-hidden rounded-3xl border border-fuchsia-200 bg-white dark:border-fuchsia-400/20 dark:bg-slate-900/50">
              <header className="flex items-center justify-between gap-4 border-b border-fuchsia-100 px-6 py-5.5 dark:border-fuchsia-400/10">
                <div className="flex gap-2.75">
                  <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Newspaper className="size-[18px]" /></span>
                  <div>
                    <h3 className="m-0 text-base text-slate-900 dark:text-white">Publish to WordPress</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Send your content directly to your WordPress site</p>
                  </div>
                </div>
              </header>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">WordPress Site</label>
                  <Select value={selectedSiteId} onValueChange={(v) => setSelectedSiteId(v ?? "")}>
                    <SelectTrigger className="mt-2 w-full"><SelectValue placeholder="Select a site" /></SelectTrigger>
                    <SelectContent>
                      {wpSites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.siteName || site.siteUrl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Post Title</label>
                  <Input className="mt-2" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Enter post title" />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Excerpt / Meta Description</label>
                  <Textarea className="mt-2" value={postExcerpt} onChange={(e) => setPostExcerpt(e.target.value)} placeholder="Brief description..." rows={2} />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Categories (comma-separated)</label>
                  <Input className="mt-2" value={postCategories} onChange={(e) => setPostCategories(e.target.value)} placeholder="SEO, Marketing, AI" />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Tags (comma-separated)</label>
                  <Input className="mt-2" value={postTags} onChange={(e) => setPostTags(e.target.value)} placeholder="seo, ai, content" />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Publish Status</label>
                  <Select value={publishStatus} onValueChange={(v) => setPublishStatus(v as "draft" | "publish" | "future")}>
                    <SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="publish">Publish Immediately</SelectItem>
                      <SelectItem value="future">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {publishError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    {publishError}
                  </div>
                )}

                {publishSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-400">
                    <Check className="size-4 shrink-0" />
                    {publishSuccess}
                  </div>
                )}

                <Separator />

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePublish}
                  disabled={publishing || !selectedSiteId || !postTitle || !postContent}
                >
                  {publishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {publishing ? "Publishing..." : `Publish as ${publishStatus}`}
                </Button>
              </div>
            </article>
          ) : (
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="p-6 text-center">
                <Globe className="mx-auto size-10 text-slate-300 dark:text-slate-600" />
                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No WordPress Site Connected</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Connect a WordPress site to publish content directly from here.
                </p>
                <Button className="mt-4" size="sm" onClick={() => (window.location.href = "/wordpress")}>
                  Connect WordPress Site
                </Button>
              </div>
            </article>
          )}
        </div>

        {/* Preview column */}
        <div className="space-y-6">
          {/* Generation progress */}
          {post.isGenerating && (
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <div className="p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Sparkles className="size-4 text-blue-500 animate-pulse" />
                  {post.generationStep}
                </div>
                <Progress value={post.generationProgress} className="mt-3" />
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{post.generationProgress}% complete</div>
              </div>
            </article>
          )}

          {/* Generated content preview */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><Eye className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Content Preview</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">AI-generated SEO content will appear here</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline"><Copy className="size-3.5" /> Copy</Button>
                <Button size="sm" variant="outline"><Download className="size-3.5" /> Export</Button>
              </div>
            </header>
            <div className="p-5">
              {post.generatedContent ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{post.generatedContent.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{post.generatedContent.metaDescription}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Type className="size-3.5" /> {post.generatedContent.wordCount} words</span>
                    <span className="flex items-center gap-1"><Clock className="size-3.5" /> {post.generatedContent.readingTime} min read</span>
                    <span className="flex items-center gap-1"><Eye className="size-3.5" /> SEO-optimized</span>
                  </div>
                  <Separator />
                  <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.generatedContent.body }} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="grid size-16 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <PenLine className="size-7 text-slate-400" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-slate-500">No content generated yet</p>
                  <p className="mt-1 text-xs text-slate-400">Fill in the form and click Generate Content</p>
                </div>
              )}
            </div>
          </article>

          {/* WordPress Posts History */}
          {wpSites.length > 0 && wpPosts.length > 0 && (
            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
              <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
                <div className="flex gap-2.75">
                  <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Newspaper className="size-[18px]" /></span>
                  <div>
                    <h3 className="m-0 text-base text-slate-900 dark:text-white">Published Posts</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Posts published to WordPress via Quasar</p>
                  </div>
                </div>
              </header>
              <div className="p-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wpPosts.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200 max-w-[280px] truncate">
                          {item.permalink ? (
                            <a href={item.permalink} target="_blank" rel="noopener noreferrer" className="hover:text-fuchsia-500">
                              {item.title}
                            </a>
                          ) : (
                            item.title
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.status === "publish" ? "default" : "secondary"}
                            className={
                              item.status === "publish"
                                ? "bg-green-100 text-green-700"
                                : item.status === "future"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-orange-100 text-orange-700"
                            }
                          >
                            {item.status === "publish" ? "Published" : item.status === "future" ? "Scheduled" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </TableCell>
                        <TableCell>
                          {item.permalink && (
                            <a href={item.permalink} target="_blank" rel="noopener noreferrer">
                              <Button size="icon-xs" variant="ghost"><ChevronRight className="size-3.5" /></Button>
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </article>
          )}

          {/* Content history */}
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"><History className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Content History</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Recently generated posts</p>
                </div>
              </div>
            </header>
            <div className="p-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {post.contentHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs text-slate-600">{item.keyword}</TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200 max-w-[280px] truncate">{item.title}</TableCell>
                      <TableCell className="text-xs text-slate-500">{item.createdAt}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "published" ? "default" : "secondary"} className={item.status === "published" ? "bg-blue-100 text-blue-700 border-blue-200" : ""}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell><Button size="icon-xs" variant="ghost"><ChevronRight className="size-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </article>
        </div>
      </div>
    </DashboardLayout>
    </RequireAuth>
  );
}

export default function PostCreatePage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-fuchsia-500" /></div>}>
      <PostCreateContent />
    </Suspense>
  );
}
