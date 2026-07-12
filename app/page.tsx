"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  Sparkles,
  Search,
  Globe,
  ChartBar,
  Key,
  Clock,
  ShieldCheck,
  Check,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import MetricCard from "@/components/MetricCard";
import AuditForm from "@/components/AuditForm";

const auditCoverageItems = [
  {
    title: "Technical crawlability & indexing",
    description: "Detect issues that block visibility on Google, Bing, and other search engines.",
  },
  {
    title: "Core Web Vitals & performance",
    description: "Real-user page speed diagnostics, performance metrics, and mobile UX scores.",
  },
  {
    title: "On-page SEO & content depth",
    description: "Evaluate headers structure, meta tags length, and content depth patterns.",
  },
  {
    title: "Keyword gaps & ranking opportunities",
    description: "Highlight valuable terms your competitors rank for but you are missing.",
  },
  {
    title: "Competitor & SERP positioning",
    description: "Benchmarking against top performing URLs in search result placements.",
  },
  {
    title: "Backlinks & authority signals",
    description: "Domain authority ratings and reference link quality diagnostics.",
  },
];

export default function Home() {
  const metrics = useSelector((state: RootState) => state.audit.metrics);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  } as const;

  return (
    <div className="mx-auto max-w-[1360px] px-6 py-9 sm:px-8 lg:px-12">
      {/* Hero Section */}
      <section className="relative grid gap-10 items-end min-h-[225px] mb-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 space-y-5"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-white/60 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 dark:border-white/10 dark:bg-slate-900/60 dark:text-emerald-400 shadow-sm">
            <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            AI-POWERED SEO AUDITS
          </div>

          <h1 className="font-heading text-4xl font-normal leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            Turn one website into a{" "}
            <span className="relative whitespace-nowrap text-emerald-600 dark:text-emerald-400">
              powerful SEO audit report
              <span className="absolute -right-3 bottom-2 size-2 rounded-full bg-emerald-400 shadow-[0_0_17px_rgba(40,217,177,0.8)] animate-pulse" />
            </span>
          </h1>

          <p className="max-w-[540px] text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
            Get crawl insights, keyword intelligence, SERP gaps, and ready-to-present findings in minutes.
          </p>
        </motion.div>

        {/* Decorative Search Orb Visual */}
        <div className="relative hidden lg:block h-[130px] w-full self-start pointer-events-none opacity-85 select-none">
          <div className="absolute top-1 left-[15%] w-[118px] h-[90px] border border-emerald-400/30 rounded-3xl bg-gradient-to-br from-white to-emerald-400/10 shadow-[0_20px_28px_rgba(40,217,177,0.16)] animate-float flex items-center justify-center dark:border-white/10 dark:from-slate-900 dark:to-emerald-400/5">
            <div className="size-[64px] rounded-2xl bg-gradient-to-br from-emerald-200 to-emerald-400/20 shadow-inner flex items-center justify-center">
              <Search className="size-7 text-emerald-700" />
            </div>
          </div>

          {/* Animated Line flows */}
          <span className="absolute left-[30%] right-0 top-[25px] h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent animate-line-flow" />
          <span className="absolute left-[30%] right-0 top-[46px] h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent animate-line-flow [animation-delay:-1s]" />
          <span className="absolute left-[30%] right-0 top-[68px] h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent animate-line-flow [animation-delay:-2s]" />
          <span className="absolute left-[30%] right-0 top-[90px] h-[1px] bg-gradient-to-r from-transparent via-purple-400/10 to-transparent animate-line-flow [animation-delay:-0.6s]" />
        </div>
      </section>

      {/* Metrics Row */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        <motion.div variants={itemVariants}>
          <MetricCard
            label="Indexed pages"
            value={metrics.indexedPages}
            description={metrics.pagesDescription}
            icon={Globe}
            accentBar
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            label="Technical health"
            value={`${metrics.technicalHealth}/100`}
            description={metrics.healthDescription}
            icon={ChartBar}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            label="Untapped keywords"
            value={metrics.untappedKeywords}
            description={metrics.keywordsDescription}
            icon={Key}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            label="Core Web Vitals"
            value={metrics.coreWebVitals}
            description={metrics.vitalsDescription}
            icon={Clock}
          />
        </motion.div>
      </motion.section>

      {/* Main Form + Coverage Grid */}
      <div className="grid gap-[18px] items-stretch lg:grid-cols-[1.2fr_0.8fr] mb-8">
        
        {/* Left Side: Audit Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AuditForm />
        </motion.div>

        {/* Right Side: Coverage Card */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col h-full rounded-[22px] border border-slate-200 bg-white/72 p-6 shadow-xs backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60"
        >
          <div className="flex items-center gap-3.5 pb-6">
            <div className="flex size-[42px] items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-normal text-slate-900 dark:text-white leading-none">
                Audit coverage
              </h2>
              <p className="mt-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Comprehensive, data-driven, and insight-rich
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-2.5">
            {auditCoverageItems.map((item, idx) => (
              <div
                key={item.title}
                className="group relative flex gap-3.5 py-2.5 border-b border-slate-100 dark:border-white/5 last:border-b-0"
              >
                {/* Indicator check circle with connector lines */}
                <div className="relative flex flex-col items-center">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-400">
                    <Check className="size-3.5 stroke-[3px]" />
                  </div>
                  {idx < auditCoverageItems.length - 1 && (
                    <div className="absolute top-6 bottom-[-16px] w-[1px] bg-gradient-to-b from-emerald-400/40 to-transparent" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      {/* How it works Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative grid gap-8 items-center rounded-[22px] border border-slate-200 bg-white/70 p-6.5 shadow-xs backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 lg:grid-cols-[235px_1fr]"
      >
        <div className="absolute -bottom-[70px] -right-[55px] size-[190px] rounded-full bg-emerald-400/5 blur-lg pointer-events-none" />

        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Zap className="size-[22px] text-purple-500" />
            <h2 className="font-heading text-xl font-normal text-slate-900 dark:text-white">
              How it works
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            From URL to actionable SEO report in 3 simple steps.
          </p>
        </div>

        {/* Step indicators */}
        <div className="grid gap-6 sm:grid-cols-3">
          <article className="relative flex gap-3.5 items-start">
            <div className="flex size-[43px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-lg font-extrabold text-emerald-800 dark:from-slate-800 dark:to-slate-700 dark:text-emerald-400">
              1
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Enter & configure
              </h3>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                Add your site, niche focus, and toggle audit outputs.
              </p>
            </div>
            {/* Dashed connector line */}
            <div className="hidden sm:block absolute right-[-10px] top-5 w-5 border-t border-dashed border-slate-300 dark:border-white/20" />
          </article>

          <article className="relative flex gap-3.5 items-start">
            <div className="flex size-[43px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-lg font-extrabold text-emerald-800 dark:from-slate-800 dark:to-slate-700 dark:text-emerald-400">
              2
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Crawl & analyze
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-extrabold text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300">
                  ~ 2-5 min
                </span>
              </h3>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                Our crawler extracts metadata, Core Web Vitals, and keyword gaps.
              </p>
            </div>
            <div className="hidden sm:block absolute right-[-10px] top-5 w-5 border-t border-dashed border-slate-300 dark:border-white/20" />
          </article>

          <article className="flex gap-3.5 items-start">
            <div className="flex size-[43px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-lg font-extrabold text-emerald-800 dark:from-slate-800 dark:to-slate-700 dark:text-emerald-400">
              3
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Get your report
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-extrabold text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300">
                  PDF ready
                </span>
              </h3>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                View clear metrics, checklist issues, and download raw summary data.
              </p>
            </div>
          </article>
        </div>
      </motion.section>
    </div>
  );
}
