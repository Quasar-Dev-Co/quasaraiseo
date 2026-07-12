"use client";

import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  updateForm,
  updateOptions,
  setGenerating,
  updateProgress,
  completeAudit
} from "@/lib/store/auditSlice";
import {
  Sparkles,
  FileInput,
  Link2,
  Tag,
  Globe,
  Languages,
  NotebookText,
  CircleHelp,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function AuditForm() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.audit.form);
  const isGenerating = useSelector((state: RootState) => state.audit.isGenerating);
  const progress = useSelector((state: RootState) => state.audit.generationProgress);
  const currentStep = useSelector((state: RootState) => state.audit.generationStep);

  const [charCount, setCharCount] = useState(form.auditFocus.length);

  // Simulated audit run
  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.websiteUrl) return;

    dispatch(setGenerating(true));

    // Calculate metrics based on the input URL to make it feel "real"
    const urlLength = form.websiteUrl.length;
    const simulatedPages = Math.floor((urlLength * 12) % 350) + 48;
    const simulatedHealth = Math.floor((urlLength * 7) % 18) + 81;
    const simulatedKeywords = Math.floor((urlLength * 9) % 200) + 36;
    const simulatedVitals = urlLength % 2 === 0 ? "Good" : "Needs Work";
    const simulatedVitalsDesc = urlLength % 2 === 0 ? "Under 1.8s LCP" : "1.2s FID, needs optimization";

    const steps = [
      { progress: 10, step: "Initializing scraper..." },
      { progress: 35, step: "Crawling website structure & links..." },
      { progress: 60, step: "Evaluating page speed & Core Web Vitals..." },
      { progress: 85, step: "Running AI keyword gap analysis..." },
      { progress: 95, step: "Structuring audit findings & preparing report..." },
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        dispatch(updateProgress(steps[stepIdx]));
        stepIdx++;
      } else {
        clearInterval(interval);
        dispatch(
          completeAudit({
            indexedPages: simulatedPages,
            technicalHealth: simulatedHealth,
            untappedKeywords: simulatedKeywords,
            coreWebVitals: simulatedVitals,
            pagesDescription: "15 orphan-risk URLs",
            healthDescription: simulatedHealth > 90 ? "Excellent crawl paths" : "Speed warnings detected",
            keywordsDescription: "High-intent search terms",
            vitalsDescription: simulatedVitalsDesc,
          })
        );
      }
    }, 1200);
  };

  const loadPresetExample = () => {
    const example = {
      websiteUrl: "https://stripe.com",
      businessNiche: "SaaS",
      targetCountry: "United States",
      primaryLanguage: "English",
      auditFocus: "Focus on checkout page speed, payment gateway API reference structure, and developer docs keywords.",
    };
    dispatch(updateForm(example));
    setCharCount(example.auditFocus.length);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    dispatch(updateForm({ [id]: value }));
    if (id === "auditFocus") {
      setCharCount(value.length);
    }
  };

  const handleSelectChange = (id: string, value: string | null) => {
    dispatch(updateForm({ [id]: value ?? "" }));
  };

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-slate-200/40 bg-radial-gradient(at_100%_0%,_rgba(40,217,177,0.07),_transparent_33%) p-6 shadow-[0_24px_55px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900/95">
      
      {/* Background Dots Grid */}
      <div className="absolute inset-x-0 bottom-0 top-auto h-[115px] opacity-15 dark:opacity-5 bg-[radial-gradient(rgba(40,217,177,0.5)_1px,transparent_1px)] bg-[size:13px_13px] [mask-image:linear-gradient(to_top,black,transparent)] pointer-events-none" />

      {/* Crawl Simulation Progress Screen */}
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 px-8 text-center text-white"
          >
            <Loader2 className="size-10 animate-spin text-emerald-400" />
            <h3 className="mt-5 font-heading text-xl font-normal tracking-wide">
              Generating Audit Report
            </h3>
            
            <p className="mt-2 text-xs text-slate-400">
              Analyzing URL: <span className="font-mono text-slate-300">{form.websiteUrl}</span>
            </p>

            {/* Progress track */}
            <div className="mt-8 h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(40,217,177,0.5)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            
            <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {progress}%
            </div>

            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-xs font-semibold text-emerald-400/90"
            >
              {currentStep}
            </motion.p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Form Content Header */}
      <div className="relative z-10 flex items-center justify-between pb-7">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">
            <Sparkles className="size-[22px]" />
          </span>
          <h2 className="font-heading text-[23px] font-normal text-slate-900 dark:text-white">
            Start a new audit
          </h2>
        </div>

        <button
          type="button"
          onClick={loadPresetExample}
          className="inline-flex min-h-[36px] items-center gap-2 rounded-xl border border-slate-200 bg-white/10 px-3.5 text-[10px] font-bold text-slate-700 hover:border-emerald-400/50 hover:text-emerald-600 transition-colors cursor-pointer dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:text-emerald-400"
        >
          <FileInput className="size-3.5" />
          Load example
        </button>
      </div>

      <form onSubmit={handleAuditSubmit} className="relative z-10 flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Website URL */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1.5 pb-2 text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider" htmlFor="websiteUrl">
              Website URL
              <CircleHelp className="size-3 text-slate-400" />
            </label>
            <div className="relative">
              <Link2 className="absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="websiteUrl"
                type="url"
                required
                value={form.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="h-[45px] w-full rounded-xl border border-slate-200 bg-white/45 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>

          {/* Business Niche */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1.5 pb-2 text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider" htmlFor="businessNiche">
              Business niche
              <CircleHelp className="size-3 text-slate-400" />
            </label>
            <div className="relative">
              <Tag className="absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <Select
                value={form.businessNiche}
                onValueChange={(val) => handleSelectChange("businessNiche", val)}
              >
                <SelectTrigger
                  className="h-[45px] w-full rounded-xl border border-slate-200 bg-white/45 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none hover:border-slate-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <SelectValue placeholder="SEO agency, SaaS, eCommerce..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-950 dark:border-white/10 dark:text-white">
                  <SelectItem value="SEO Agency">SEO Agency</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="eCommerce">eCommerce</SelectItem>
                  <SelectItem value="Local Business">Local Business</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Legal Services">Legal Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Country */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1.5 pb-2 text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider" htmlFor="targetCountry">
              Target country
            </label>
            <div className="relative">
              <Globe className="absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <Select
                value={form.targetCountry}
                onValueChange={(val) => handleSelectChange("targetCountry", val)}
              >
                <SelectTrigger
                  className="h-[45px] w-full rounded-xl border border-slate-200 bg-white/45 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none hover:border-slate-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <SelectValue placeholder="Select target country" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-950 dark:border-white/10 dark:text-white">
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Netherlands">Netherlands</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Primary Language */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1.5 pb-2 text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider" htmlFor="primaryLanguage">
              Primary language
            </label>
            <div className="relative">
              <Languages className="absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <Select
                value={form.primaryLanguage}
                onValueChange={(val) => handleSelectChange("primaryLanguage", val)}
              >
                <SelectTrigger
                  className="h-[45px] w-full rounded-xl border border-slate-200 bg-white/45 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none hover:border-slate-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <SelectValue placeholder="Select primary language" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-950 dark:border-white/10 dark:text-white">
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Dutch">Dutch</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="Bangla">Bangla</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Focus Notes (Full width) */}
          <div className="flex flex-col md:col-span-2">
            <label className="flex items-center gap-1.5 pb-2 text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider" htmlFor="auditFocus">
              Audit focus
              <CircleHelp className="size-3 text-slate-400" />
            </label>
            <div className="relative">
              <NotebookText className="absolute top-3.5 left-3.5 size-[17px] text-slate-400 pointer-events-none" />
              <textarea
                id="auditFocus"
                maxLength={500}
                value={form.auditFocus}
                onChange={handleInputChange}
                placeholder="Add target services, target keywords, cities, competitors, or any notes for the AI report engine."
                className="min-h-[95px] w-full rounded-2xl border border-slate-200 bg-white/45 py-3 pl-10 pr-14 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              <span className="absolute bottom-3 right-3.5 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                {charCount} / 500
              </span>
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div className="mt-2.5 flex flex-col gap-4.5 border-t border-slate-100/50 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Options Chips */}
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => dispatch(updateOptions({ crawl: !form.options.crawl }))}
              className={cn(
                "inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-3.5 text-[10px] font-bold tracking-wide transition-all duration-200 cursor-pointer hover:-translate-y-0.5",
                form.options.crawl
                  ? "text-emerald-950 border-emerald-400/55 bg-emerald-400/8 dark:text-emerald-100 dark:border-emerald-400/55"
                  : "text-slate-500 border-slate-200 hover:border-emerald-400/45 dark:border-white/10 dark:text-slate-400"
              )}
            >
              <CheckCircle2 className={cn("size-3.5", form.options.crawl ? "text-emerald-500" : "text-slate-400")} />
              <span>Full crawl</span>
            </button>

            <button
              type="button"
              onClick={() => dispatch(updateOptions({ keywords: !form.options.keywords }))}
              className={cn(
                "inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-3.5 text-[10px] font-bold tracking-wide transition-all duration-200 cursor-pointer hover:-translate-y-0.5",
                form.options.keywords
                  ? "text-emerald-950 border-emerald-400/55 bg-emerald-400/8 dark:text-emerald-100 dark:border-emerald-400/55"
                  : "text-slate-500 border-slate-200 hover:border-emerald-400/45 dark:border-white/10 dark:text-slate-400"
              )}
            >
              <CheckCircle2 className={cn("size-3.5", form.options.keywords ? "text-emerald-500" : "text-slate-400")} />
              <span>Keyword gap</span>
            </button>

            <button
              type="button"
              onClick={() => dispatch(updateOptions({ pdf: !form.options.pdf }))}
              className={cn(
                "inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-3.5 text-[10px] font-bold tracking-wide transition-all duration-200 cursor-pointer hover:-translate-y-0.5",
                form.options.pdf
                  ? "text-emerald-950 border-emerald-400/55 bg-emerald-400/8 dark:text-emerald-100 dark:border-emerald-400/55"
                  : "text-slate-500 border-slate-200 hover:border-emerald-400/45 dark:border-white/10 dark:text-slate-400"
              )}
            >
              <CheckCircle2 className={cn("size-3.5", form.options.pdf ? "text-emerald-500" : "text-slate-400")} />
              <span>PDF output</span>
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="group relative inline-flex min-w-[245px] min-h-[54px] items-center justify-center gap-4.5 overflow-hidden rounded-full px-6 font-extrabold text-[12px] text-teal-950 bg-gradient-to-r from-emerald-300 via-[#20dfc2] to-cyan-400 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-95 shadow-[0_13px_30px_rgba(40,217,177,0.24)] cursor-pointer transition-all duration-300"
          >
            {/* Gloss reflection shine effect */}
            <span className="absolute top-[-60%] left-[-45%] w-[38%] h-[220%] rotate-[28deg] bg-white/43 transition-all duration-700 group-hover:left-[125%]" />
            <span>Generate audit report</span>
            <ArrowRight className="size-[19px] transition-transform group-hover:translate-x-1" />
          </button>

        </div>
      </form>
    </article>
  );
}
