"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, Network, PenLine, Newspaper, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

// A four-screen introduction shown once per user on first sign-in, and any
// time from the "How it works" button. It explains the one loop the whole
// product is built around: plan, create, publish, measure.

type Step = {
  title: string;
  body: string;
  points?: string[];
  links?: Array<{ href: string; label: string }>;
};

const FLOW = [
  { icon: Network, label: "Plan" },
  { icon: PenLine, label: "Create" },
  { icon: Newspaper, label: "Publish" },
  { icon: BarChart3, label: "Measure" },
];

const STEPS: Step[] = [
  {
    title: "Welcome to Quasar AI SEO",
    body: "Quasar helps you grow a website's search traffic with one repeatable loop. The menu on the left follows the same order.",
  },
  {
    title: "Plan in the strategy chat",
    body: "Open a chat for one website and tell the agent what you need.",
    points: [
      "It researches keywords and builds a pillar and cluster content plan.",
      "Attach files, sheets or screenshots, and choose skills for that chat only.",
      "Ask for a PDF report whenever you want to share the plan.",
    ],
    links: [{ href: "/content-strategy", label: "Open strategy chat" }],
  },
  {
    title: "Create and publish posts",
    body: "Send a brief from the chat, or start in the post writer.",
    points: [
      "Posts come with images placed section by section, in your brand's style.",
      "Edit the text and drag images where you want them.",
      "Publish, save as a draft, or schedule on a connected WordPress site.",
    ],
    links: [
      { href: "/post-create", label: "Open post writer" },
      { href: "/branding", label: "Add a brand profile" },
    ],
  },
  {
    title: "Measure, then repeat",
    body: "Connect Google to see what the new content does, and keep the team moving.",
    points: [
      "Search Console shows clicks, impressions and rankings.",
      "Analytics shows visitors and engagement.",
      "Tasks keep track of who is doing what.",
    ],
    links: [
      { href: "/wordpress", label: "Connect a WordPress site" },
      { href: "/setting", label: "Connect Google" },
    ],
  },
];

const OnboardingContext = createContext<{ openTour: () => void }>({ openTour: () => {} });

export function useOnboarding() {
  return useContext(OnboardingContext);
}

function storageKey(userId: string | undefined) {
  return `quasar_onboarding_seen_v1:${userId ?? "anon"}`;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const primaryRef = useRef<HTMLButtonElement>(null);

  // First sign-in: show the tour once. Storage can be unavailable (private
  // mode), in which case the tour simply doesn't auto-open.
  useEffect(() => {
    if (!userId) return;
    let seen = true;
    try { seen = localStorage.getItem(storageKey(userId)) === "1"; } catch { /* ignore */ }
    if (seen) return;
    const t = window.setTimeout(() => { setStep(0); setOpen(true); }, 400);
    return () => window.clearTimeout(t);
  }, [userId]);

  const close = useCallback(() => {
    setOpen(false);
    try { localStorage.setItem(storageKey(userId), "1"); } catch { /* ignore */ }
  }, [userId]);

  const openTour = useCallback(() => { setStep(0); setOpen(true); }, []);

  useEffect(() => {
    if (!open) return;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setStep((s) => Math.min(STEPS.length - 1, s + 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, step]);

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <OnboardingContext.Provider value={{ openTour }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            className="w-full max-w-[520px] rounded-xl border border-slate-200 bg-card shadow-xl animate-in fade-in-0 slide-in-from-bottom-2 duration-200 dark:border-white/10"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-white/10">
              <ol className="flex items-center gap-1" aria-label="How Quasar works">
                {FLOW.map((f, i) => {
                  const active = step === 0 || (step === 1 && i === 0) || (step === 2 && (i === 1 || i === 2)) || (step === 3 && i === 3);
                  return (
                    <li key={f.label} className="flex items-center gap-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${active ? "bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200" : "text-slate-500 dark:text-slate-400"}`}>
                        <f.icon className="size-3.5" /> {f.label}
                      </span>
                      {i < FLOW.length - 1 && <ArrowRight className="size-3 text-slate-400" aria-hidden />}
                    </li>
                  );
                })}
              </ol>
              <button type="button" onClick={close} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white">
                <X className="size-4" />
              </button>
            </div>

            <div key={step} className="px-6 pb-2 pt-5 animate-in fade-in-0 duration-200">
              <h2 id="onboarding-title" className="text-xl font-semibold text-slate-950 dark:text-white">{current.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{current.body}</p>
              {current.points && (
                <ul className="mt-4 space-y-2">
                  {current.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-600 dark:bg-brand-400" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
              {current.links && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {current.links.map((l) => (
                    <Link key={l.href} href={l.href} onClick={close} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">
                      {l.label} <ArrowRight className="size-3.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-6 pb-5 pt-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">{step + 1} of {STEPS.length}</span>
              <div className="flex items-center gap-2">
                {step > 0 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="size-3.5" /> Back
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={close}>Skip</Button>
                )}
                <Button ref={primaryRef} type="button" size="sm" onClick={() => (last ? close() : setStep(step + 1))}>
                  {last ? "Start working" : "Next"} {!last && <ArrowRight className="size-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OnboardingContext.Provider>
  );
}
