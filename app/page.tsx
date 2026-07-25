"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { LogoStrip } from "@/components/landing/logo-strip";
import { ProblemSection } from "@/components/landing/problem-section";
import { PlatformSection } from "@/components/landing/platform-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { DiscoverySection } from "@/components/landing/discovery-section";
import { ResultsSection } from "@/components/landing/results-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_7%_6%,rgba(217,70,239,0.14),transparent_28%),radial-gradient(circle_at_94%_10%,rgba(147,51,234,0.11),transparent_23%),linear-gradient(180deg,#fdf4ff_0%,#f8fafc_42%,#fff_100%)] text-slate-900 antialiased">
      <Navbar />
      <main>
        <Hero />
        <LogoStrip />
        <ProblemSection />
        <PlatformSection />
        <WorkflowSection />
        <DiscoverySection />
        <ResultsSection />
        <UseCasesSection />
        <PricingSection showToast={showToast} />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection showToast={showToast} />
      </main>
      <Footer />

      {toast && (
        <div className="fixed bottom-6 right-6 z-100 flex w-[min(380px,calc(100%-32px))] gap-3 rounded-[15px] border border-slate-200 bg-white/96 p-3.75 shadow-[0_24px_65px_rgba(15,23,42,0.18)]">
          <CheckCircle2 className="size-5 text-fuchsia-600" />
          <div>
            <strong className="text-[13px]">Action ready</strong>
            <p className="mt-0.75 text-[11px] text-slate-500">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
