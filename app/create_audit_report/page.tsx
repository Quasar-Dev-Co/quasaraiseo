"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { AuditHero } from "@/components/audit/audit-hero";
import { AuditForm } from "@/components/audit/audit-form";
import { ReportPreview } from "@/components/audit/report-preview";
import { PipelineLoader } from "@/components/audit/pipeline-loader";
import { PastAudits } from "@/components/audit/past-audits";
import { RequireAuth } from "@/components/auth/require-auth";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuditJob } from "@/hooks/use-audit-job";
import type { AuditJobRecord } from "@/lib/api";

export default function CreateAuditReportPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const [viewedAudit, setViewedAudit] = useState<AuditJobRecord | null>(null);
  const { phase, audit, error, submitAudit } = useAuditJob();

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleSelectAudit = (selected: AuditJobRecord) => {
    setViewedAudit(selected);
    showToast(`Loaded audit report for ${selected.websiteHost}`);
    const el = document.getElementById("report-preview");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmitAudit = async (payload: Parameters<typeof submitAudit>[0]) => {
    setViewedAudit(null);
    await submitAudit(payload);
  };

  return (
    <RequireAuth>
    <DashboardLayout>
      <AuditHero />
      <AuditForm
        showToast={showToast}
        phase={phase}
        audit={audit}
        error={error}
        submitAudit={handleSubmitAudit}
      />
      <ReportPreview
        showToast={showToast}
        audit={viewedAudit ?? audit}
        phase={viewedAudit ? "completed" : phase}
      />

      <PastAudits
        refreshKey={auditRefreshKey + (phase === "completed" ? 1 : 0)}
        onSelectAudit={handleSelectAudit}
      />

      <PipelineLoader phase={phase} audit={audit} error={error} />

      {phase === "completed" && (
        <div className="fixed bottom-6 right-6 z-[150] flex w-[min(380px,calc(100%-32px))] gap-3 rounded-[15px] border border-blue-200 bg-white/96 p-3.75 shadow-[0_24px_65px_rgba(15,23,42,0.18)]">
          <CheckCircle2 className="size-5 text-blue-600" />
          <div>
            <strong className="text-[13px]">Audit complete!</strong>
            <p className="mt-0.75 text-[11px] text-slate-500">Your report is ready. Scroll down to view it.</p>
          </div>
        </div>
      )}

      {toast && phase !== "completed" && (
        <div className="fixed bottom-6 right-6 z-100 flex w-[min(380px,calc(100%-32px))] gap-3 rounded-[15px] border border-slate-200 bg-white/96 p-3.75 shadow-[0_24px_65px_rgba(15,23,42,0.18)]">
          <CheckCircle2 className="size-5 text-blue-600" />
          <div>
            <strong className="text-[13px]">Success</strong>
            <p className="mt-0.75 text-[11px] text-slate-500">{toast}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
    </RequireAuth>
  );
}
