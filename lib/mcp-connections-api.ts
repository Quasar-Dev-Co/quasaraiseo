import { authApi } from "@/lib/auth-api";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface McpConnection {
  id: string;
  userId: string;
  name: string;
  url: string;
  token: string;
  enabled: boolean;
  serverName: string;
  serverTitle: string;
  serverVersion: string;
  protocolVersion: string;
  toolCount: number;
  lastTestedAt: string | null;
  lastTestOk: boolean;
  lastTestMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface McpConnectionInput {
  name: string;
  url: string;
  token: string;
  enabled?: boolean;
}

export interface McpTestResult {
  ok: boolean;
  message: string;
  tools?: Array<{ name: string; description?: string }>;
}

export interface McpToolInfo {
  name: string;
  description?: string;
}

function getToken(): string | null {
  return authApi.getToken();
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(data.message || `Request failed with ${res.status}`);
  }

  return res.json();
}

export const mcpConnectionsApi = {
  async getAll(): Promise<McpConnection[]> {
    const data = await apiRequest<{ connections: McpConnection[] }>("/api/mcp-connections");
    return data.connections;
  },

  async create(input: McpConnectionInput): Promise<{ connection: McpConnection; test: McpTestResult }> {
    return apiRequest<{ connection: McpConnection; test: McpTestResult }>("/api/mcp-connections", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: Partial<McpConnectionInput>): Promise<McpConnection> {
    const data = await apiRequest<{ connection: McpConnection }>(`/api/mcp-connections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return data.connection;
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/api/mcp-connections/${id}`, { method: "DELETE" });
  },

  async test(id: string): Promise<{ connection: McpConnection; test: McpTestResult }> {
    return apiRequest(`/api/mcp-connections/${id}/test`, { method: "POST" });
  },

  async listTools(): Promise<McpToolInfo[]> {
    const data = await apiRequest<{ tools: McpToolInfo[] }>("/api/mcp-connections/tools");
    return data.tools;
  },
};
