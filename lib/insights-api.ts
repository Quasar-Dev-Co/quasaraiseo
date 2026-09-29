const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface MyInsights {
  days: number;
  totals: {
    tokens: number;
    aiCalls: number;
    activeMinutes: number;
    toolCalls: number;
    distinctTools: number;
    chats: number;
  };
  byFeature: Array<{ feature: string; tokens: number; calls: number }>;
  websites: Array<{ name: string; url: string | null; minutes: number; chats: number; messages: number; toolCalls: number; tokens: number }>;
  tools: Array<{ name: string; count: number }>;
}

export async function fetchMyInsights(days: number): Promise<MyInsights> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quasar_auth_token") : null;
  const res = await fetch(`${API_BASE_URL}/api/insights/me?days=${days}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message || "Could not load your activity.");
  return body as MyInsights;
}

// Areas are stored under their old internal names; show the names used in the menu.
const FEATURE_LABELS: Record<string, string> = {
  "Quasar MCP": "MCP Chat",
  "Post Create": "Post Writer",
  "Post images": "Post Writer images",
  "Audit MCP": "Site Audit",
};

export function featureLabel(feature: string): string {
  return FEATURE_LABELS[feature] ?? feature;
}
