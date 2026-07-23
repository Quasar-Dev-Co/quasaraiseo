import { NextRequest, NextResponse } from "next/server";
import {
  getAuthFromRequest,
  createAuditRecord,
  getAuditsByUserId,
} from "@/lib/server/db";
import { getAuditStageDescriptions, mapStoredAuditToRecord } from "@/lib/server/audit-engine";

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, market, language, niche, notes } = body;

    if (!url || !market || !language) {
      return NextResponse.json(
        { message: "URL, market, and language are required." },
        { status: 400 }
      );
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const audit = createAuditRecord({
      userId: auth.userId,
      url: normalizedUrl,
      market,
      language,
      niche,
      notes,
    });

    return NextResponse.json({
      audit: mapStoredAuditToRecord(audit),
      pipeline: getAuditStageDescriptions(),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const userAudits = getAuditsByUserId(auth.userId);
  return NextResponse.json({
    items: userAudits.map(mapStoredAuditToRecord),
  });
}
