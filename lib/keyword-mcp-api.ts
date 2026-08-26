const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quasar_auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface PendingPostBrief {
  id: string;
  contentFileId: string | null;
  prompt: string;
  title: string | null;
  keyword: string | null;
  createdAt: string;
}

export interface ModelRecord {
  id: string;
  label?: string;
}

export interface McpToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

export interface McpFile {
  fileId: string;
  fileName: string;
  fileType: string;
}

export interface McpChatResponse {
  response: string;
  toolCalls?: McpToolCall[];
  files?: McpFile[];
  report?: Record<string, unknown>;
}

export interface McpChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  toolCalls?: McpToolCall[];
  files?: McpFile[];
}

export interface McpSession {
  id: string;
  userId: string;
  messages: McpChatMessage[];
  lastReport: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface McpSessionPreview {
  id: string;
  preview: string;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

export const keywordMcpApi = {
  async getSession(): Promise<{ session: McpSession }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to get session: ${resp.status}`);
    return resp.json();
  },

  async listSessions(): Promise<{ sessions: McpSessionPreview[] }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/sessions`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to list sessions: ${resp.status}`);
    return resp.json();
  },

  async createNewSession(): Promise<{ session: McpSession }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to create session: ${resp.status}`);
    return resp.json();
  },

  async getSessionById(sessionId: string): Promise<{ session: McpSession }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session/${sessionId}`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to get session: ${resp.status}`);
    return resp.json();
  },

  async getPendingPostBrief(briefId: string): Promise<{ brief: PendingPostBrief }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/pending-post-briefs/${briefId}`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to get pending post brief: ${resp.status}`);
    return resp.json();
  },

  async sendMessage(sessionId: string, message: string, model?: string): Promise<McpChatResponse> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ sessionId, message, model }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Failed to send message: ${err.slice(0, 200)}`);
    }
    return resp.json();
  },

  async listModels(): Promise<{ models: ModelRecord[] }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/models`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to list models: ${resp.status}`);
    return resp.json();
  },

  async clearSession(sessionId: string): Promise<void> {
    await fetch(`${BACKEND_URL}/api/keyword-mcp/session/${sessionId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
  },

  getFileUrl(fileId: string): string {
    return `${BACKEND_URL}/api/keyword-mcp/files/${fileId}`;
  },

  async downloadFile(fileId: string, fileName: string): Promise<void> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/files/${fileId}`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
