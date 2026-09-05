const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "";

const TOKEN_KEY = "quasar_auth_token";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type AiProvider = "openai" | "openrouter";

export interface ProviderInfo {
  hasApiKey: boolean;
  apiKeyPreview: string;
  defaultModel: string;
}

export interface AiProviderSettings {
  activeProvider: string;
  openai: ProviderInfo;
  openrouter: ProviderInfo;
}

export interface AiProviderModel {
  id: string;
  label?: string;
}

class AiProviderApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AiProviderApiError";
    this.status = status;
    this.details = details;
  }
}

async function providerRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {}
    throw new AiProviderApiError(
      `API error ${response.status}: ${response.statusText}`,
      response.status,
      details
    );
  }

  return response.json() as Promise<T>;
}

export interface DiscoveredModel {
  id: string;
  provider: string;
  modelId: string;
  modelName: string | null;
  contextLength: number | null;
  inputCostPer1M: number | null;
  outputCostPer1M: number | null;
  isFree: boolean;
  discoveredAt: string;
  lastSeenAt: string;
}

export interface SyncResult {
  openai: { total: number; new: number };
  openrouter: { total: number; new: number };
  newModels: Array<{
    provider: string;
    modelId: string;
    modelName: string | null;
    inputCostPer1M: number | null;
    outputCostPer1M: number | null;
    isFree: boolean;
    discoveredAt: string;
  }>;
}

export const aiProviderApi = {
  async getSettings(): Promise<{ settings: AiProviderSettings | null }> {
    return providerRequest<{ settings: AiProviderSettings | null }>("/api/ai-provider");
  },

  async saveKey(data: {
    provider: AiProvider;
    apiKey: string;
    defaultModel?: string;
  }): Promise<{ success: boolean; message: string }> {
    return providerRequest<{ success: boolean; message: string }>("/api/ai-provider/save-key", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async switchProvider(data: {
    provider: AiProvider;
  }): Promise<{ success: boolean; message: string }> {
    return providerRequest<{ success: boolean; message: string }>("/api/ai-provider/switch", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteKey(provider: AiProvider): Promise<{ success: boolean; message: string }> {
    return providerRequest<{ success: boolean; message: string }>(`/api/ai-provider/key/${provider}`, {
      method: "DELETE",
    });
  },

  async deleteAllSettings(): Promise<{ success: boolean; message: string }> {
    return providerRequest<{ success: boolean; message: string }>("/api/ai-provider", {
      method: "DELETE",
    });
  },

  async testProvider(data: {
    provider: AiProvider;
    apiKey: string;
  }): Promise<{
    success: boolean;
    message: string;
    modelCount?: number;
    testModel?: string;
    testResponse?: string;
  }> {
    return providerRequest<{
      success: boolean;
      message: string;
      modelCount?: number;
      testModel?: string;
      testResponse?: string;
    }>("/api/ai-provider/test", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async listModels(): Promise<{ models: AiProviderModel[] }> {
    return providerRequest<{ models: AiProviderModel[] }>("/api/ai-provider/models");
  },

  async getDiscoveredModels(filters?: {
    provider?: string;
    onlyNew?: boolean;
    days?: number;
  }): Promise<{ models: DiscoveredModel[] }> {
    const params = new URLSearchParams();
    if (filters?.provider) params.set("provider", filters.provider);
    if (filters?.onlyNew) params.set("onlyNew", "true");
    if (filters?.days) params.set("days", String(filters.days));
    const qs = params.toString();
    return providerRequest<{ models: DiscoveredModel[] }>(
      `/api/ai-provider/discovered-models${qs ? `?${qs}` : ""}`,
    );
  },

  async syncModels(): Promise<SyncResult> {
    return providerRequest<SyncResult>("/api/ai-provider/sync-models", {
      method: "POST",
    });
  },

  isAiProviderApiError(error: unknown): error is AiProviderApiError {
    return error instanceof AiProviderApiError;
  },
};
