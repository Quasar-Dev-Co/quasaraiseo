const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// The Quasar MCP server: lets the admin connect Claude, ChatGPT, Cursor or any
// other MCP client to this system and ask it about analytics, team activity,
// schedules and the rest. This is the opposite direction from "Connected
// tools" (mcp-connections-api.ts), where MCP Chat calls outside servers.

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quasar_auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function send(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...init?.headers },
  });
}

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message || `Request failed (${res.status})`);
  return body as T;
}

export interface McpAccessKey {
  id: string;
  name: string;
  /** Start of the key (for example "qmcp_4f2a"), so keys can be told apart. */
  prefix: string;
  createdAt: string;
  createdByEmail: string | null;
  lastUsedAt: string | null;
  /** Null means the key never expires. */
  expiresAt: string | null;
}

export interface McpServerTool {
  name: string;
  description: string;
}

export interface AdminMcpOverview {
  /** Streamable HTTP endpoint that MCP clients connect to. */
  serverUrl: string;
  keys: McpAccessKey[];
  tools: McpServerTool[];
}

/**
 * What the server exposes. All read-only. Shown before the backend is deployed
 * and kept in step with docs/backend-google-accounts-and-mcp.md.
 */
export const PLANNED_MCP_TOOLS: McpServerTool[] = [
  { name: "list_websites", description: "Every website in the system: Search Console sites and Analytics properties from all Google accounts, WordPress sites and brand profiles." },
  { name: "list_google_accounts", description: "Connected Google accounts and which services each one gives access to." },
  { name: "search_console_report", description: "Clicks, impressions, CTR and position for a site, by date, query, page, country or device." },
  { name: "analytics_report", description: "GA4 users, sessions, page views and engagement for a property, split by page, channel, country, device or date." },
  { name: "analytics_realtime", description: "People on a site right now, by country." },
  { name: "team_activity", description: "Everyone's AI tokens, active time, tool runs, top website and cost: who works the most." },
  { name: "user_activity", description: "One person's activity in detail: areas, websites and tools they used." },
  { name: "ai_costs", description: "API spend by day, model, feature and person." },
  { name: "list_scheduled_posts", description: "Posts queued for publishing, with website, date and status." },
  { name: "list_content_changes", description: "Posts and pages MCP Chat created or edited, who did it and when." },
  { name: "list_generation_jobs", description: "Post Writer jobs and their status." },
  { name: "list_tasks", description: "SEO tasks with assignee, status and due date." },
  { name: "list_strategy_sessions", description: "MCP Chat threads per website: keyword research and content plans." },
];

export const adminMcpApi = {
  /** Null while the backend does not have the MCP server yet. */
  async overview(): Promise<AdminMcpOverview | null> {
    const res = await send("/api/admin-mcp");
    if (res.status === 404) return null;
    return parse<AdminMcpOverview>(res);
  },

  /** The full key is returned only here, once. */
  async createKey(input: { name: string; expiresInDays: number | null }): Promise<{ key: McpAccessKey; secret: string }> {
    return parse(await send("/api/admin-mcp/keys", { method: "POST", body: JSON.stringify(input) }));
  },

  async revokeKey(id: string): Promise<void> {
    await parse(await send(`/api/admin-mcp/keys/${encodeURIComponent(id)}`, { method: "DELETE" }));
  },
};
