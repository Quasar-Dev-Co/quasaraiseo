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

async function getJson<T>(path: string, fallback: string): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quasar_auth_token") : null;
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message || fallback);
  return body as T;
}

export function fetchMyInsights(days: number): Promise<MyInsights> {
  return getJson<MyInsights>(`/api/insights/me?days=${days}`, "Could not load your activity.");
}

/** Admin only: one person's activity, the same view they see on their Overview. */
export function fetchUserInsights(userId: string, days: number): Promise<MyInsights & { costUsd: number }> {
  return getJson(`/api/insights/users/${encodeURIComponent(userId)}?days=${days}`, "Could not load this user's activity.");
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "user" | "super";
  lastActiveAt: string | null;
  activeMinutes: number;
  tokens: number;
  aiCalls: number;
  distinctTools: number;
  toolCalls: number;
  chats: number;
  costUsd: number;
  topWebsite: string | null;
  topTool: string | null;
  topArea: string | null;
}

export interface TeamInsights {
  days: number;
  totals: { users: number; activeUsers: number; tokens: number; activeMinutes: number; toolCalls: number; costUsd: number };
  users: TeamMember[];
}

/** Admin only: everyone's activity in one list. */
export function fetchTeamInsights(days: number): Promise<TeamInsights> {
  return getJson<TeamInsights>(`/api/insights/users?days=${days}`, "Could not load team activity.");
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
