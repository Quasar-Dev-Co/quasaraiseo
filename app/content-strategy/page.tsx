"use client";

import { useState } from "react";
import {
  Network, Sparkles, ArrowRight, Layers, Globe,
  Target, FileText, Link2, TrendingUp, Lightbulb,
  CheckCircle2, Circle, ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ClusterPage {
  id: string;
  title: string;
  keyword: string;
  searchIntent: string;
  status: "planned" | "outlined" | "drafted" | "published";
}

interface StrategyPlan {
  pillarTitle: string;
  pillarKeyword: string;
  pillarSummary: string;
  clusters: ClusterPage[];
  internalLinkMap: string;
}

export default function ContentStrategyPage() {
  const [topic, setTopic] = useState("");
  const [targetSite, setTargetSite] = useState("");
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState<StrategyPlan | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setStrategy(null);
    // Placeholder — will connect to backend later
    setTimeout(() => {
      setStrategy({
        pillarTitle: `The Complete Guide to ${topic}`,
        pillarKeyword: topic.toLowerCase(),
        pillarSummary: `A comprehensive pillar page covering everything about ${topic}, serving as the hub for all related cluster content.`,
        clusters: [
          { id: "1", title: `${topic} for Beginners`, keyword: `${topic} beginners`, searchIntent: "Informational", status: "planned" },
          { id: "2", title: `Best ${topic} Tools in 2026`, keyword: `best ${topic} tools`, searchIntent: "Commercial", status: "planned" },
          { id: "3", title: `${topic} vs Alternatives`, keyword: `${topic} alternatives`, searchIntent: "Commercial", status: "planned" },
          { id: "4", title: `How to Choose ${topic}`, keyword: `how to choose ${topic}`, searchIntent: "Informational", status: "planned" },
          { id: "5", title: `${topic} Pricing & Costs`, keyword: `${topic} pricing`, searchIntent: "Transactional", status: "planned" },
        ],
        internalLinkMap: "All cluster pages link to pillar. Pillar links to all clusters. Adjacent clusters cross-link where topically relevant.",
      });
      setGenerating(false);
    }, 1500);
  };

  const statusConfig = {
    planned: { label: "Planned", icon: Circle, color: "text-slate-400" },
    outlined: { label: "Outlined", icon: ChevronRight, color: "text-blue-500" },
    drafted: { label: "Drafted", icon: FileText, color: "text-amber-500" },
    published: { label: "Published", icon: CheckCircle2, color: "text-emerald-500" },
  };

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

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
                Plan pillar pages and topic clusters for SEO dominance
              </p>
            </div>
          </div>

          {/* Input Card */}
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <Target className="size-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Build Your Topic Cluster
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Topic / Seed Keyword
                </label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. AI web development"
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Target Website (optional)
                </label>
                <Input
                  value={targetSite}
                  onChange={(e) => setTargetSite(e.target.value)}
                  placeholder="e.g. https://codemypixel.com"
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The AI will generate a pillar page plan + supporting cluster pages with internal linking strategy.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={!topic.trim() || generating}
                className="gap-2"
              >
                {generating ? (
                  <>
                    <Sparkles className="size-4 animate-pulse" />
                    Planning...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate Strategy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Strategy Result */}
          {strategy && (
            <div className="space-y-6">

              {/* Pillar Page Card */}
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
                <div className="mb-3 flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      PILLAR PAGE
                    </Badge>
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                  {strategy.pillarTitle}
                </h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                  {strategy.pillarSummary}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Target className="size-3" /> {strategy.pillarKeyword}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="size-3" /> Hub page
                  </Badge>
                </div>
              </div>

              {/* Cluster Pages */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Globe className="size-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Cluster Pages ({strategy.clusters.length})
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {strategy.clusters.map((cluster, idx) => {
                    const sc = statusConfig[cluster.status];
                    const StatusIcon = sc.icon;
                    return (
                      <div
                        key={cluster.id}
                        className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-700"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="grid size-6 place-items-center rounded-md bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                              {idx + 1}
                            </span>
                            <StatusIcon className={`size-4 ${sc.color}`} />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {cluster.searchIntent}
                          </Badge>
                        </div>
                        <h4 className="mb-1 font-semibold text-slate-900 dark:text-white">
                          {cluster.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Keyword: {cluster.keyword}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                            <FileText className="size-3" /> Outline
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                            <ArrowRight className="size-3" /> Generate
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Internal Linking Map */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center gap-2">
                  <Link2 className="size-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Internal Linking Strategy
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {strategy.internalLinkMap}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-blue-500" /> Pillar → Clusters
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-purple-500" /> Clusters → Pillar
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-emerald-500" /> Cross-links
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="mb-3 flex items-center gap-2">
                  <Lightbulb className="size-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Next Steps
                  </h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="size-4 text-amber-500" />
                    Review the pillar page plan and cluster topics
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="size-4 text-amber-500" />
                    Generate full content for each page using Post Create
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="size-4 text-amber-500" />
                    Publish to WordPress with internal links
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="size-4 text-amber-500" />
                    Track rankings over time with Audit MCP
                  </li>
                </ul>
              </div>

            </div>
          )}

          {/* Empty State */}
          {!strategy && !generating && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <Network className="mx-auto mb-4 size-12 text-slate-300 dark:text-slate-600" />
              <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
                Start by entering a topic
              </h3>
              <p className="mx-auto max-w-md text-sm text-slate-500 dark:text-slate-400">
                Enter a broad topic or seed keyword above. The AI will analyze it and
                generate a pillar page plan with supporting cluster pages and an
                internal linking strategy.
              </p>
            </div>
          )}

        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
