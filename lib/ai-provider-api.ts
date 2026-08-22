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

export interface AiProviderSettings {
  provider: string;
  defaultModel: string;
  hasApiKey: boolean;
  apiKeyPreview: string;
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

export const aiProviderApi = {
  async getSettings(): Promise<{ settings: AiProviderSettings | null }> {
    return providerRequest<{ settings: AiProviderSettings | null }>("/api/ai-provider");
  },

  async saveSettings(data: {
    provider: AiProvider;
    apiKey: string;
    defaultModel?: string;
  }): Promise<{ success: boolean; message: string }> {
    return providerRequest<{ success: boolean; message: string }>("/api/ai-provider", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteSettings(): Promise<{ success: boolean; message: string }> {
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

  isAiProviderApiError(error: unknown): error is AiProviderApiError {
    return error instanceof AiProviderApiError;
  },
};
