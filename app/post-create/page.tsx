"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  PenLine, Sparkles, FileText, Clock, Eye, Copy, Download,
  Check, ChevronRight, History, Type, Target,
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

export default function PostCreatePage() {
  const post = useSelector((state: RootState) => state.post);

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
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{post.contentHistory.length}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Check className="size-4" /> Published</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{post.contentHistory.filter(p => p.status === "published").length}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><History className="size-4" /> Drafts</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{post.contentHistory.filter(p => p.status === "draft").length}</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Target className="size-4" /> Avg. Words</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">1,847</div>
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
              {/* Target keyword */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Target Keyword</label>
                <Input className="mt-2" placeholder="e.g. ai seo audit tool" defaultValue={post.form.targetKeyword} />
              </div>

              {/* Secondary keywords */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Secondary Keywords</label>
                <Input className="mt-2" placeholder="comma-separated keywords" defaultValue={post.form.secondaryKeywords} />
              </div>

              {/* Content type + Tone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Content Type</label>
                  <Select defaultValue={post.form.contentType}>
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
                  <Select defaultValue={post.form.tone}>
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
                  <Select defaultValue={String(post.form.wordCount)}>
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
                  <Select defaultValue={post.form.language}>
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
                <Input className="mt-2" placeholder="e.g. SaaS marketing managers" defaultValue={post.form.audience} />
              </div>

              {/* Call to action */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Call to Action</label>
                <Input className="mt-2" placeholder="e.g. Start your free audit today" defaultValue={post.form.callToAction} />
              </div>

              {/* Outline */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Custom Outline (optional)</label>
                <Textarea className="mt-2" placeholder="Add section headings or notes for the AI..." />
              </div>

              <Separator />

              <Button className="w-full" size="lg">
                <Sparkles className="size-4" />
                Generate Content
              </Button>
            </div>
          </article>
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
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {post.generatedContent.body}
                  </div>
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
