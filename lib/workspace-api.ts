const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const TOKEN_KEY = "quasar_auth_token";

export type ExportFormat = "pdf" | "json";

export interface WorkspacePreferences {
  autoUpdateReports: boolean;
  exportFormat: ExportFormat;
  compactMode: boolean;
  betaFeatures: boolean;
}

export const defaultWorkspacePreferences: WorkspacePreferences = {
  autoUpdateReports: true,
  exportFormat: "pdf",
  compactMode: false,
  betaFeatures: false,
};

function authHeaders(): HeadersInit {
  const token = typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && typeof body === "object" && "message" in body) {
        message = String(body.message);
      }
    } catch {
      // body is not JSON
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const workspaceApi = {
  get(): Promise<WorkspacePreferences> {
    return request<{ preferences: WorkspacePreferences }>("/api/workspace").then((data) => data.preferences);
  },

  update(patch: Partial<WorkspacePreferences>): Promise<WorkspacePreferences> {
    return request<{ preferences: WorkspacePreferences }>("/api/workspace", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }).then((data) => data.preferences);
  },
};
