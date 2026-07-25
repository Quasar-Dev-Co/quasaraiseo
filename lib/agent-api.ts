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

export interface SkillRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileCount: number;
  mainFile: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFileRecord {
  id: string;
  fileName: string;
  fileType: "pdf" | "docx" | "xlsx" | "csv" | "image" | "other";
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export type AgentJobStatus = "pending" | "running" | "completed" | "failed";

export interface AgentJobRecord {
  id: string;
  prompt: string;
  status: AgentJobStatus;
  result: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  skillId: string | null;
  skill?: SkillRecord | null;
  outputFiles?: GeneratedFileRecord[];
}

class AgentApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AgentApiError";
    this.status = status;
    this.details = details;
  }
}

async function agentRequest<T>(
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
    throw new AgentApiError(
      `API error ${response.status}: ${response.statusText}`,
      response.status,
      details
    );
  }

  return response.json() as Promise<T>;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const agentApi = {
  async listSkills(): Promise<{ skills: SkillRecord[] }> {
    return agentRequest<{ skills: SkillRecord[] }>("/api/agent/skills");
  },

  async uploadSkill(file: File): Promise<{ skill: SkillRecord }> {
    const base64Data = await fileToBase64(file);
    return agentRequest<{ skill: SkillRecord }>("/api/agent/skills/upload", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, data: base64Data }),
    });
  },

  async deleteSkill(id: string): Promise<{ success: boolean }> {
    return agentRequest<{ success: boolean }>(`/api/agent/skills/${id}`, {
      method: "DELETE",
    });
  },

  async createJob(prompt: string, skillId?: string): Promise<{ job: AgentJobRecord }> {
    return agentRequest<{ job: AgentJobRecord }>("/api/agent/jobs", {
      method: "POST",
      body: JSON.stringify({ prompt, skillId }),
    });
  },

  async listJobs(): Promise<{ jobs: AgentJobRecord[] }> {
    return agentRequest<{ jobs: AgentJobRecord[] }>("/api/agent/jobs");
  },

  async getJob(id: string): Promise<{ job: AgentJobRecord }> {
    return agentRequest<{ job: AgentJobRecord }>(`/api/agent/jobs/${id}`);
  },

  getFileDownloadUrl(fileId: string): string {
    return `${API_BASE_URL}/api/agent/files/${fileId}`;
  },

  getDownloadUrlWithAuth(fileId: string): string {
    const token = getAuthToken();
    return `${API_BASE_URL}/api/agent/files/${fileId}?token=${encodeURIComponent(token || "")}`;
  },

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/agent/files/${fileId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new AgentApiError(`Download failed: ${response.status}`, response.status);
    }
    return response.blob();
  },

  isAgentApiError(error: unknown): error is AgentApiError {
    return error instanceof AgentApiError;
  },
};
