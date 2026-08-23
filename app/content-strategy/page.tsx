"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Network, Sparkles, ArrowRight, Layers, Globe,
  Target, FileText, Link2, TrendingUp, Lightbulb,
  CheckCircle2, Circle, ChevronRight, Search, Zap,
  BarChart3, MapPin, Users, Calendar, Star, Download,
  Loader2, XCircle, Clock, Trash2, AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  keywordResearchApi,
  type KeywordResearchJob,
  type KeywordResearchResult,
  type KeywordRecord,
} from "@/lib/keyword-research-api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  running: { label: "Running", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

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

function ContentStrategyContent() {
  const [seed, setSeed] = useState("");
  const [location, setLocation] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<KeywordResearchJob[]>([]);
  const [activeJob, setActiveJob] = useState<KeywordResearchJob | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await keywordResearchApi.listJobs();
      setJobs(res.jobs);
      const running = res.jobs.find((j) => j.status === "running");
      if (running) setActiveJob(running);
      else if (res.jobs.length > 0 && res.jobs[0].status === "completed") setActiveJob(res.jobs[0]);
    } catch {}
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Poll running jobs
  const hasRunningJob = jobs.some((j) => j.status === "running");
  useEffect(() => {
    if (hasRunningJob) {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        const runningJobs = jobs.filter((j) => j.status === "running");
        for (const job of runningJobs) {
          try {
            const res = await keywordResearchApi.getJob(job.id);
            setJobs((prev) => prev.map((j) => (j.id === job.id ? res.job : j)));
            if (res.job.status === "completed" || res.job.status === "failed") {
              setActiveJob(res.job);
            }
          } catch {}
        }
      }, 3000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [hasRunningJob, jobs]);

  const handleStart = async () => {
    if (!seed.trim()) return;
    setStarting(true);
    setError(null);
    try {
      const res = await keywordResearchApi.startResearch({
        seed: seed.trim(),
        location: location.trim() || undefined,
        industryType: industryType.trim() || undefined,
        businessName: businessName.trim() || undefined,
      });
      setJobs((prev) => [res.job, ...prev]);
      setActiveJob(res.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start research");
    } finally {
      setStarting(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await keywordResearchApi.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (activeJob?.id === jobId) setActiveJob(null);
    } catch {}
  };

  const result = activeJob?.result as KeywordResearchResult | null;
  const isRunning = activeJob?.status === "running";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
          <Network className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Content Strategy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keyword research, topic clusters, and content planning for SEO dominance
          </p>
        </div>
      </div>

      {/* Input Card */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Search className="size-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Keyword Research
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Seed Keyword / Topic *
            </label>
            <Input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="e.g. AI web development"
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Location (optional)
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, NY"
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Industry (auto-detect)
            </label>
            <select
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Auto-detect</option>
              <option value="local_service">Local Service</option>
              <option value="saas">SaaS</option>
              <option value="ecommerce">E-commerce</option>
              <option value="publisher">Blog / Publisher</option>
              <option value="agency">Agency</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Business Name (optional)
            </label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. CodeMyPixel"
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI will research 200+ keywords with volume, difficulty, CPC, intent, clusters, and quick wins.
          </p>
          <Button
            onClick={handleStart}
            disabled={!seed.trim() || starting || isRunning}
            className="gap-2"
          >
            {starting || isRunning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Start Research
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
            <AlertCircle className="size-4" /> {error}
          </div>
        )}
      </div>

      {/* Running Status */}
      {isRunning && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-center gap-3">
            <Loader2 className="size-6 animate-spin text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Researching keywords for "{activeJob?.seed}"
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI is analyzing search volume, difficulty, intent, competitors, and building topic clusters. This takes 1-3 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Failed Status */}
      {activeJob?.status === "failed" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-center gap-3">
            <XCircle className="size-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Research failed</h3>
              <p className="text-sm text-red-600">{activeJob.errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && activeJob?.status === "completed" && (
        <KeywordResearchResults result={result} />
      )}

      {/* Past Jobs */}
      {jobs.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
            Past Research Jobs
          </h3>
          <div className="space-y-2">
            {jobs.map((job) => {
              const sc = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.running;
              const StatusIcon = sc.icon;
              return (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`size-4 ${job.status === "running" ? "animate-spin" : ""} ${sc.color.split(" ")[1]}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {job.seed}
                        {job.location ? ` — ${job.location}` : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(job.createdAt).toLocaleString()}
                        {job.result?.meta?.total_keywords ? ` • ${job.result.meta.total_keywords} keywords` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveJob(job)}
                      className="text-xs"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      className="text-xs text-red-500"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!activeJob && !isRunning && jobs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <Search className="mx-auto mb-4 size-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
            Start with a seed keyword
          </h3>
          <p className="mx-auto max-w-md text-sm text-slate-500 dark:text-slate-400">
            Enter a topic or keyword above. The AI will research 200+ keywords with
            search volume, difficulty, CPC, search intent, topic clusters, competitors,
            quick wins, and a content strategy roadmap.
          </p>
        </div>
      )}

    </div>
  );
}

// ─── Results Component ───

function KeywordResearchResults({ result }: { result: KeywordResearchResult }) {
  const { meta } = result;
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Search}
          label="Total Keywords"
          value={meta.total_keywords.toString()}
          color="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
        />
        <KpiCard
          icon={TrendingUp}
          label="Monthly Volume"
          value={meta.total_monthly_volume.toLocaleString()}
          color="bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
        />
        <KpiCard
          icon={Zap}
          label="Quick Wins"
          value={result.quick_wins.length.toString()}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
        />
        <KpiCard
          icon={BarChart3}
          label="Avg CPC"
          value={`$${meta.avg_cpc.toFixed(2)}`}
          color="bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
        />
      </div>

      {/* Key Findings */}
      {result.kpi_summary.key_findings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Key Findings</h3>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            {result.kpi_summary.key_findings.map((finding, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-amber-500" />
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full flex-wrap gap-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <BarChart3 className="size-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="primary" className="gap-1.5 text-xs">
            <Target className="size-3.5" /> Primary ({result.primary_keywords.length})
          </TabsTrigger>
          <TabsTrigger value="service" className="gap-1.5 text-xs">
            <Layers className="size-3.5" /> By Category ({result.service_keywords.length})
          </TabsTrigger>
          {result.location_keywords.length > 0 && (
            <TabsTrigger value="location" className="gap-1.5 text-xs">
              <MapPin className="size-3.5" /> Location ({result.location_keywords.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="longtail" className="gap-1.5 text-xs">
            <FileText className="size-3.5" /> Long-tail ({result.longtail_keywords.length})
          </TabsTrigger>
          <TabsTrigger value="clusters" className="gap-1.5 text-xs">
            <Network className="size-3.5" /> Clusters ({result.topic_clusters.length})
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-1.5 text-xs">
            <Users className="size-3.5" /> Competitors ({result.competitors.length})
          </TabsTrigger>
          <TabsTrigger value="quickwins" className="gap-1.5 text-xs">
            <Zap className="size-3.5" /> Quick Wins ({result.quick_wins.length})
          </TabsTrigger>
          <TabsTrigger value="serp" className="gap-1.5 text-xs">
            <Star className="size-3.5" /> SERP ({result.serp_features.length})
          </TabsTrigger>
          <TabsTrigger value="seasonality" className="gap-1.5 text-xs">
            <Calendar className="size-3.5" /> Trends ({result.seasonality.length})
          </TabsTrigger>
          <TabsTrigger value="strategy" className="gap-1.5 text-xs">
            <ArrowRight className="size-3.5" /> Strategy ({result.content_strategy.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">Top Opportunity</h4>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{meta.top_opportunity.keyword}</p>
                  <p className="text-sm text-slate-500">{meta.top_opportunity.volume.toLocaleString()} searches/mo</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">Highest CPC</h4>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-orange-100 text-orange-700">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{meta.highest_cpc.keyword}</p>
                  <p className="text-sm text-slate-500">${meta.highest_cpc.cpc.toFixed(2)} per click</p>
                </div>
              </div>
            </div>
          </div>

          {meta.market_description && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="mb-2 font-semibold text-slate-900 dark:text-white">Market Overview</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{meta.market_description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">Industry: {meta.industry_type}</Badge>
                {meta.location && <Badge variant="outline">Location: {meta.location}</Badge>}
                <Badge variant="outline">Data: {meta.data_source}</Badge>
                {meta.market_population && <Badge variant="outline">Pop: {meta.market_population.toLocaleString()}</Badge>}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Primary Keywords Tab */}
        <TabsContent value="primary" className="mt-4">
          <KeywordTable keywords={result.primary_keywords} />
        </TabsContent>

        {/* Service Keywords Tab */}
        <TabsContent value="service" className="mt-4">
          <KeywordTable keywords={result.service_keywords} showCategory />
        </TabsContent>

        {/* Location Keywords Tab */}
        <TabsContent value="location" className="mt-4">
          <KeywordTable keywords={result.location_keywords} showLocation />
        </TabsContent>

        {/* Long-tail Keywords Tab */}
        <TabsContent value="longtail" className="mt-4">
          <div className="space-y-2">
            {result.longtail_keywords.map((kw, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{kw.keyword}</p>
                    {kw.title_suggestion && (
                      <p className="mt-1 text-sm text-slate-500">Title: {kw.title_suggestion}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[kw.priority] ?? ""}`}>{kw.priority}</Badge>
                      <Badge variant="outline" className={`text-xs ${INTENT_COLORS[kw.intent] ?? ""}`}>{kw.intent}</Badge>
                      {kw.content_type && <Badge variant="outline" className="text-xs">{kw.content_type}</Badge>}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-900 dark:text-white">{kw.volume.toLocaleString()} vol</p>
                    <p className={getKdColor(kw.kd)}>KD {kw.kd} — {getKdLabel(kw.kd)}</p>
                    {kw.cpc > 0 && <p className="text-slate-500">${kw.cpc.toFixed(2)} CPC</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Topic Clusters Tab */}
        <TabsContent value="clusters" className="mt-4">
          <div className="space-y-4">
            {result.topic_clusters.map((cluster, i) => (
              <div key={i} className="rounded-xl border-2 border-purple-200 bg-purple-50/30 p-5 dark:border-purple-800 dark:bg-purple-950/20">
                <div className="mb-3 flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-purple-600 text-white">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{cluster.cluster_name}</h4>
                    <p className="text-xs text-slate-500">Pillar: {cluster.pillar_keyword}</p>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">{cluster.total_volume.toLocaleString()} total vol</Badge>
                  <Badge variant="outline" className={`text-xs ${getKdColor(cluster.avg_kd)}`}>Avg KD {cluster.avg_kd}</Badge>
                  <Badge variant="outline" className="text-xs">{cluster.page_type}</Badge>
                  {cluster.content_gap && <Badge variant="outline" className="text-xs text-amber-600">Gap: {cluster.content_gap}</Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cluster.supporting_keywords.map((skw, j) => (
                    <span key={j} className="rounded-md bg-white px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {skw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {result.competitors.map((comp, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-white">{comp.name}</h4>
                  {comp.domain_rating && <Badge variant="outline">DR {comp.domain_rating}</Badge>}
                </div>
                {comp.domain && <p className="mb-2 text-xs text-slate-500">{comp.domain}</p>}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-emerald-600">Strengths: </span>
                    <span className="text-slate-600 dark:text-slate-400">{comp.strengths}</span>
                  </div>
                  <div>
                    <span className="font-medium text-red-600">Weaknesses: </span>
                    <span className="text-slate-600 dark:text-slate-400">{comp.weaknesses}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Opportunity: </span>
                    <span className="text-slate-600 dark:text-slate-400">{comp.opportunity}</span>
                  </div>
                </div>
                {comp.top_keywords && comp.top_keywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {comp.top_keywords.slice(0, 5).map((kw, j) => (
                      <Badge key={j} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Quick Wins Tab */}
        <TabsContent value="quickwins" className="mt-4">
          <div className="space-y-2">
            {result.quick_wins.map((qw, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{qw.keyword}</p>
                  <p className="text-sm text-slate-500">{qw.action}</p>
                  {qw.target_page && <p className="text-xs text-slate-400">→ {qw.target_page}</p>}
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-900 dark:text-white">{qw.volume.toLocaleString()} vol</p>
                  <p className={getKdColor(qw.kd)}>KD {qw.kd}</p>
                  <Badge className={`text-xs ${PRIORITY_COLORS[qw.expected_impact] ?? ""}`}>{qw.expected_impact}</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* SERP Features Tab */}
        <TabsContent value="serp" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {result.serp_features.map((sf, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-white">{sf.feature}</h4>
                  <Badge className={`text-xs ${PRIORITY_COLORS[sf.opportunity_level] ?? ""}`}>{sf.opportunity_level}</Badge>
                </div>
                <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">{sf.how_to_win}</p>
                <p className="text-xs text-slate-500">{sf.keyword_count} keywords</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sf.example_keywords.slice(0, 3).map((kw, j) => (
                    <Badge key={j} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Seasonality Tab */}
        <TabsContent value="seasonality" className="mt-4">
          <div className="space-y-2">
            {result.seasonality.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{s.keyword}</p>
                  <p className="text-sm text-slate-500">{s.volume.toLocaleString()} searches/mo</p>
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3 text-emerald-500" />
                    <span className="text-emerald-600">Peak: {s.peak_months.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3 text-slate-400" />
                    <span className="text-slate-500">Low: {s.low_months.join(", ")}</span>
                  </div>
                  <Badge variant="outline" className={`mt-1 text-xs ${s.trend_direction === "growing" ? "text-emerald-600" : s.trend_direction === "declining" ? "text-red-600" : ""}`}>
                    {s.trend_direction}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Content Strategy Tab */}
        <TabsContent value="strategy" className="mt-4">
          <div className="space-y-2">
            {result.content_strategy.map((cs, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs bg-blue-100 text-blue-700">{cs.priority_phase}</Badge>
                      <span className="font-medium text-slate-900 dark:text-white">{cs.content_type}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Keywords: {cs.target_keywords}</p>
                    <p className="text-xs text-slate-400">URL: {cs.page_url}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-900 dark:text-white">{cs.est_volume}</p>
                    {cs.status && <Badge variant="outline" className="text-xs">{cs.status}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

// ─── KPI Card ───

function KpiCard({ icon: Icon, label, value, color }: { icon: typeof Search; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-2 grid size-9 place-items-center rounded-lg ${color}`}>
        <Icon className="size-5" />
      </div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

// ─── Keyword Table ───

function KeywordTable({ keywords, showCategory, showLocation }: { keywords: KeywordRecord[]; showCategory?: boolean; showLocation?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr className="text-left">
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Keyword</th>
            {showCategory && <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Category</th>}
            {showLocation && <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Location</th>}
            <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Volume</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">KD</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">CPC</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Intent</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Priority</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {keywords.map((kw, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{kw.keyword}</td>
              {showCategory && <td className="px-4 py-3 text-slate-500">{kw.category ?? "—"}</td>}
              {showLocation && <td className="px-4 py-3 text-slate-500">{kw.location ?? "—"}</td>}
              <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{kw.volume.toLocaleString()}</td>
              <td className={`px-4 py-3 text-right font-medium ${getKdColor(kw.kd)}`}>{kw.kd}</td>
              <td className="px-4 py-3 text-right text-slate-500">{kw.cpc > 0 ? `$${kw.cpc.toFixed(2)}` : "—"}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={`text-xs ${INTENT_COLORS[kw.intent] ?? ""}`}>{kw.intent}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[kw.priority] ?? ""}`}>{kw.priority}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ContentStrategyPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <ContentStrategyContent />
      </DashboardLayout>
    </RequireAuth>
  );
}
