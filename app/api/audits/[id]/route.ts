import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest, getAuditById, advanceAuditPipeline, shouldCompleteAudit, completeAudit, deleteAudit } from "@/lib/server/db";
import { generateAuditReport, mapStoredAuditToRecord } from "@/lib/server/audit-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const audit = getAuditById(id);
  if (!audit) {
    return NextResponse.json({ message: "Audit not found." }, { status: 404 });
  }

  if (audit.userId !== auth.userId) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (audit.status !== "completed" && audit.status !== "failed") {
    if (shouldCompleteAudit(id)) {
      const result = generateAuditReport(audit.url, audit.niche ?? undefined);
      completeAudit(id, result.report, result.crawledPages, result.keywordRankings, result.serpCompetitors);
    } else {
      advanceAuditPipeline(id);
    }
  }

  const updatedAudit = getAuditById(id)!;
  return NextResponse.json({
    audit: mapStoredAuditToRecord(updatedAudit),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const audit = getAuditById(id);
  if (!audit) {
    return NextResponse.json({ message: "Audit not found." }, { status: 404 });
  }

  if (audit.userId !== auth.userId) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  deleteAudit(id);
  return NextResponse.json({ success: true });
}
