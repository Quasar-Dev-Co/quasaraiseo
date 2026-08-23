const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quasar_auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
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

export const keywordMcpApi = {
  async getSession(): Promise<{ session: McpSession }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to get session: ${resp.status}`);
    return resp.json();
  },

  async sendMessage(sessionId: string, message: string): Promise<McpChatResponse> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ sessionId, message }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Failed to send message: ${err.slice(0, 200)}`);
    }
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
};
