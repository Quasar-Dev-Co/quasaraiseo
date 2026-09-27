const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quasar_auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message || `Request failed (${res.status})`);
  return body as T;
}

export interface UsageSums {
  calls: number;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  costUsd: number;
  unpricedCalls: number;
}

export interface ModelPrice {
  inputPer1M: number;
  cachedInputPer1M: number | null;
  outputPer1M: number;
  source: "custom" | "synced" | "catalog";
}

export interface CostSummary {
  from: string;
  to: string;
  totals: UsageSums;
  byDay: Array<UsageSums & { day: string }>;
  byModel: Array<UsageSums & { provider: string; model: string; costSources: string[]; price: ModelPrice | null }>;
  byFeature: Array<UsageSums & { feature: string }>;
  byUser: Array<UsageSums & { userId: string | null; name: string | null; email: string | null }>;
  recent: Array<{
    createdAt: string; feature: string; provider: string; model: string; kind: string;
    inputTokens: number; cachedTokens: number; outputTokens: number; reasoningTokens: number;
    costUsd: number; costSource: string; email: string | null;
  }>;
}

export const costsApi = {
  summary(days: number): Promise<CostSummary> {
    return request<CostSummary>(`/api/costs/summary?days=${days}`);
  },
  setPrice(price: { model: string; inputPer1M: number; cachedInputPer1M: number | null; outputPer1M: number }) {
    return request<{ success: boolean }>("/api/costs/prices", { method: "PUT", body: JSON.stringify(price) });
  },
  resetPrice(model: string) {
    return request<{ success: boolean }>(`/api/costs/prices?model=${encodeURIComponent(model)}`, { method: "DELETE" });
  },
};
