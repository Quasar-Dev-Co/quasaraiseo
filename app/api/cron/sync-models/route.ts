import { NextResponse } from "next/server";

/**
 * Vercel Cron endpoint — called every hour by Vercel Cron.
 * Forwards the request to the backend's /api/cron/sync-models endpoint.
 *
 * The backend does the actual work: fetches models from OpenAI and
 * OpenRouter APIs and saves any new models to the database.
 *
 * Vercel Cron config is in vercel.json at the project root.
 */
export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.seo.quasarasoft.com";
  const cronSecret = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_CRON_SECRET || "";

  if (!cronSecret) {
    console.error("CRON_SECRET not set — cannot sync models");
    return NextResponse.json(
      { success: false, message: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${backendUrl}/api/cron/sync-models`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Model sync failed:", data);
      return NextResponse.json(data, { status: res.status });
    }

    console.log("Model sync completed:", {
      openai: data.openai,
      openrouter: data.openrouter,
      newModels: data.newModels?.length ?? 0,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Cron sync-models error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}

// Disable caching for cron endpoints
export const dynamic = "force-dynamic";
export const revalidate = 0;
