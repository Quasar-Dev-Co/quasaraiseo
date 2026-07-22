"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { AuditNavbar } from "@/components/audit/audit-navbar";
import { AuditHero } from "@/components/audit/audit-hero";
import { AuditForm } from "@/components/audit/audit-form";
import { ReportPreview } from "@/components/audit/report-preview";
import { AuditFooter } from "@/components/audit/audit-footer";
import { PipelineLoader } from "@/components/audit/pipeline-loader";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuditJob } from "@/hooks/use-audit-job";

export default function CreateAuditReportPage() {
  const [toast, setToast] = useState<string | null>(null);
  const { phase, audit, error, submitAudit } = useAuditJob();

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  return (
    <RequireAuth>
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_9%,rgba(16,185,129,0.14),transparent_27%),radial-gradient(circle_at_91%_14%,rgba(245,158,11,0.11),transparent_24%),linear-gradient(180deg,#fbfefd_0%,#f8fafc_45%,#fff_100%)] text-slate-900 antialiased">
      <AuditNavbar />
      <main className="mx-auto w-full max-w-[1240px] px-4 py-18">
        <AuditHero />
        <AuditForm
          showToast={showToast}
          phase={phase}
          audit={audit}
          error={error}
          submitAudit={submitAudit}
        />
        <ReportPreview
          showToast={showToast}
          audit={audit}
          phase={phase}
        />
      </main>
      <AuditFooter />

      <PipelineLoader phase={phase} audit={audit} error={error} />

      {phase === "completed" && (
        <div className="fixed bottom-6 right-6 z-[150] flex w-[min(380px,calc(100%-32px))] gap-3 rounded-[15px] border border-emerald-200 bg-white/96 p-3.75 shadow-[0_24px_65px_rgba(15,23,42,0.18)]">
          <CheckCircle2 className="size-5 text-emerald-600" />
          <div>
            <strong className="text-[13px]">Audit complete!</strong>
            <p className="mt-0.75 text-[11px] text-slate-500">Your report is ready. Scroll down to view it.</p>
          </div>
        </div>
      )}

      {toast && phase !== "completed" && (
        <div className="fixed bottom-6 right-6 z-100 flex w-[min(380px,calc(100%-32px))] gap-3 rounded-[15px] border border-slate-200 bg-white/96 p-3.75 shadow-[0_24px_65px_rgba(15,23,42,0.18)]">
          <CheckCircle2 className="size-5 text-emerald-600" />
          <div>
            <strong className="text-[13px]">Success</strong>
            <p className="mt-0.75 text-[11px] text-slate-500">{toast}</p>
          </div>
        </div>
      )}
    </div>
    </RequireAuth>
  );
}
