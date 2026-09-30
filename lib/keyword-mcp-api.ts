const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

export interface McpChatAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  kind: "image" | "sheet" | "document" | "pdf" | "file";
  size: number;
  url: string;
  mediaId?: number;
  alt?: string;
  source?: "upload" | "website";
}

export interface McpChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  toolCalls?: McpToolCall[];
  files?: McpFile[];
  attachments?: McpChatAttachment[];
}

export interface McpSession {
  id: string;
  userId: string;
  websiteName?: string | null;
  websiteUrl?: string | null;
  websiteLogoUrl?: string | null;
  additionalInstructions?: string | null;
  mcpConnectionId?: string | null;
  skillIds?: string[];
  messages: McpChatMessage[];
  lastReport: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface McpSessionPreview {
  id: string;
  preview: string;
  websiteName?: string | null;
  websiteUrl?: string | null;
  websiteLogoUrl?: string | null;
  additionalInstructions?: string | null;
  mcpConnectionId?: string | null;
  skillIds?: string[];
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface SessionMetadataInput {
  skillIds?: string[];
  websiteName?: string;
  websiteUrl?: string;
  websiteLogoUrl?: string;
  additionalInstructions?: string;
  mcpConnectionId?: string | null;
}

// createNewSession falls back to a browser-only id when the server is unreachable;
// such chats can't hold uploads until a real server session exists.
export function isLocalOnlySession(sessionId: string | null | undefined): boolean {
  return !sessionId || sessionId.startsWith("sess_");
}

export function getStoredSessionSite(sessionId: string): SessionMetadataInput | null {
  if (typeof window === "undefined" || !sessionId) return null;
  try {
    const raw = localStorage.getItem(`quasar_session_site_${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSessionSite(sessionId: string, meta: SessionMetadataInput) {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    const existing = getStoredSessionSite(sessionId) || {};
    localStorage.setItem(`quasar_session_site_${sessionId}`, JSON.stringify({ ...existing, ...meta }));
  } catch {}
}

export function getStoredSessionMessages(sessionId: string): McpChatMessage[] | null {
  if (typeof window === "undefined" || !sessionId) return null;
  try {
    const raw = localStorage.getItem(`quasar_session_msgs_${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSessionMessages(sessionId: string, msgs: McpChatMessage[]) {
  if (typeof window === "undefined" || !sessionId) return;
  try {
    localStorage.setItem(`quasar_session_msgs_${sessionId}`, JSON.stringify(msgs));
  } catch {}
}

export interface McpChange {
  id: string;
  sessionId: string | null;
  kind: "post_update" | "post_create" | "post_trash" | "content_file";
  tool: string;
  label: string;
  title: string | null;
  postType: string | null;
  siteName: string | null;
  createdAt: string;
  reverted: boolean;
  isUndo: boolean;
  canUndo: boolean;
  url: string | null;
}

export interface McpRevertResult {
  ok: boolean;
  message: string;
  needsConfirm?: boolean;
}

export const keywordMcpApi = {
  /** What the chat changed on the website (and saved pages), newest first. */
  async getChanges(sessionId?: string): Promise<McpChange[]> {
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/changes${qs}`, { headers: { ...authHeaders() } });
    if (!resp.ok) throw new Error("Could not load the history.");
    return ((await resp.json()) as { changes: McpChange[] }).changes;
  },

  /** Put a changed page back how it was. `force` confirms overwriting newer edits. */
  async revertChange(id: string, force = false): Promise<McpRevertResult> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/changes/${encodeURIComponent(id)}/revert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ force }),
    });
    const data = (await resp.json().catch(() => ({}))) as Partial<McpRevertResult>;
    return { ok: !!data.ok, message: data.message || (resp.ok ? "Done." : "Could not undo this change."), needsConfirm: data.needsConfirm };
  },

  async getSession(): Promise<{ session: McpSession }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to get session: ${resp.status}`);
    const data = await resp.json();
    const stored = getStoredSessionSite(data.session?.id);
    const storedMsgs = getStoredSessionMessages(data.session?.id);
    if (data.session) {
      const serverMsgs = (data.session.messages as McpChatMessage[]) || [];
      const effectiveMsgs = (serverMsgs.length > 0 || !storedMsgs) ? serverMsgs : storedMsgs;
      data.session = {
        ...data.session,
        websiteName: data.session.websiteName || stored?.websiteName || null,
        websiteUrl: data.session.websiteUrl || stored?.websiteUrl || null,
        websiteLogoUrl: data.session.websiteLogoUrl || stored?.websiteLogoUrl || null,
        additionalInstructions: data.session.additionalInstructions || stored?.additionalInstructions || null,
        mcpConnectionId: data.session.mcpConnectionId || stored?.mcpConnectionId || null,
        messages: effectiveMsgs,
      };
      if (effectiveMsgs.length > 0) {
        setStoredSessionMessages(data.session.id, effectiveMsgs);
      }
    }
    return data;
  },

  async listSessions(): Promise<{ sessions: McpSessionPreview[] }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/sessions`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to list sessions: ${resp.status}`);
    const data = (await resp.json()) as { sessions: McpSessionPreview[] };
    const sessions = (data.sessions || []).map((s) => {
      const stored = getStoredSessionSite(s.id);
      return {
        ...s,
        websiteName: s.websiteName || stored?.websiteName || null,
        websiteUrl: s.websiteUrl || stored?.websiteUrl || null,
        websiteLogoUrl: s.websiteLogoUrl || stored?.websiteLogoUrl || null,
        additionalInstructions: s.additionalInstructions || stored?.additionalInstructions || null,
        mcpConnectionId: s.mcpConnectionId || stored?.mcpConnectionId || null,
      };
    });
    return { sessions };
  },

  async createNewSession(meta?: SessionMetadataInput): Promise<{ session: McpSession }> {
    let createdSession: McpSession | null = null;
    try {
      const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(meta || {}),
      });
      if (resp.ok) {
        const data = await resp.json();
        createdSession = data.session;
      }
    } catch {}

    if (!createdSession) {
      createdSession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: "",
        websiteName: meta?.websiteName || null,
        websiteUrl: meta?.websiteUrl || null,
        websiteLogoUrl: meta?.websiteLogoUrl || null,
        additionalInstructions: meta?.additionalInstructions || null,
        mcpConnectionId: meta?.mcpConnectionId || null,
        messages: [],
        lastReport: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (meta && createdSession) {
      setStoredSessionSite(createdSession.id, meta);
      createdSession = {
        ...createdSession,
        websiteName: meta.websiteName || createdSession.websiteName,
        websiteUrl: meta.websiteUrl || createdSession.websiteUrl,
        websiteLogoUrl: meta.websiteLogoUrl || createdSession.websiteLogoUrl,
        additionalInstructions: meta.additionalInstructions || createdSession.additionalInstructions,
        mcpConnectionId: meta.mcpConnectionId !== undefined ? meta.mcpConnectionId : createdSession.mcpConnectionId,
      };
    }

    return { session: createdSession };
  },

  async updateSession(sessionId: string, meta: SessionMetadataInput): Promise<{ session: McpSession }> {
    setStoredSessionSite(sessionId, meta);

    try {
      // 1. Try PATCH
      let resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(meta),
      });

      // 2. If PATCH fails (404/405), try POST /settings fallback
      if (!resp.ok) {
        resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session/${sessionId}/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(meta),
        });
      }

      if (resp.ok) {
        const data = await resp.json();
        return data;
      }
    } catch {
      // Server not reachable or route not deployed yet
    }

    // Always succeed without throwing 404 to user
    return {
      session: {
        id: sessionId,
        userId: "",
        websiteName: meta.websiteName || null,
        websiteUrl: meta.websiteUrl || null,
        websiteLogoUrl: meta.websiteLogoUrl || null,
        additionalInstructions: meta.additionalInstructions || null,
        mcpConnectionId: meta.mcpConnectionId || null,
        messages: [],
        lastReport: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  async getSessionById(sessionId: string): Promise<{ session: McpSession }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session/${sessionId}`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to get session: ${resp.status}`);
    const data = await resp.json();
    const stored = getStoredSessionSite(sessionId);
    const storedMsgs = getStoredSessionMessages(sessionId);
    if (data.session) {
      const serverMsgs = (data.session.messages as McpChatMessage[]) || [];
      const effectiveMsgs = (serverMsgs.length > 0 || !storedMsgs) ? serverMsgs : storedMsgs;
      data.session = {
        ...data.session,
        websiteName: data.session.websiteName || stored?.websiteName || null,
        websiteUrl: data.session.websiteUrl || stored?.websiteUrl || null,
        websiteLogoUrl: data.session.websiteLogoUrl || stored?.websiteLogoUrl || null,
        additionalInstructions: data.session.additionalInstructions || stored?.additionalInstructions || null,
        mcpConnectionId: data.session.mcpConnectionId || stored?.mcpConnectionId || null,
        messages: effectiveMsgs,
      };
      if (effectiveMsgs.length > 0) {
        setStoredSessionMessages(sessionId, effectiveMsgs);
      }
    }
    return data;
  },

  async getPendingPostBrief(briefId: string): Promise<{ brief: PendingPostBrief }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/pending-post-briefs/${briefId}`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to get pending post brief: ${resp.status}`);
    return resp.json();
  },

  /**
   * Uploads chat files as multipart form data. `onProgress` gets 0–100.
   * Files the server rejects come back in `errors` while the rest still attach.
   */
  async uploadAttachments(
    sessionId: string,
    files: File[],
    onProgress?: (percent: number) => void,
  ): Promise<{ attachments: McpChatAttachment[]; errors: string[] }> {
    try {
      return await this.uploadMultipart(sessionId, files, onProgress);
    } catch (err) {
      // A backend that hasn't been updated yet only understands base64 JSON.
      // (it answers multipart with 500 or "filename and data are required").
      const status = (err as { status?: number }).status;
      const legacyBackend = status === 500 || (err instanceof Error && err.message.includes("filename and data are required"));
      if (!legacyBackend) throw err;
      const attachments: McpChatAttachment[] = [];
      const errors: string[] = [];
      for (const file of files) {
        try {
          attachments.push((await this.uploadAttachmentLegacy(sessionId, file)).attachment);
        } catch (legacyErr) {
          errors.push(legacyErr instanceof Error ? `${file.name}: ${legacyErr.message}` : `${file.name}: upload failed`);
        }
      }
      if (!attachments.length) throw new Error(errors.join(" ") || "Upload failed");
      return { attachments, errors };
    }
  },

  async uploadAttachmentLegacy(sessionId: string, file: File): Promise<{ attachment: McpChatAttachment }> {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] || result);
      };
      reader.onerror = () => reject(new Error("Could not read the file"));
      reader.readAsDataURL(file);
    });
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session/${sessionId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ filename: file.name, mimeType: file.type, data }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || (resp.status === 413 ? "File is too large for the server" : "Upload failed"));
    }
    const body = await resp.json() as { attachment: Omit<McpChatAttachment, "source"> };
    return { attachment: { ...body.attachment, source: "upload" } };
  },

  uploadMultipart(
    sessionId: string,
    files: File[],
    onProgress?: (percent: number) => void,
  ): Promise<{ attachments: McpChatAttachment[]; errors: string[] }> {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      for (const file of files) form.append("files", file, file.name);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BACKEND_URL}/api/keyword-mcp/session/${sessionId}/attachments`);
      const headers = authHeaders();
      for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again."));
      xhr.onload = () => {
        let body: { message?: string; attachment?: McpChatAttachment; attachments?: McpChatAttachment[]; errors?: string[] } = {};
        try { body = JSON.parse(xhr.responseText || "{}"); } catch {}
        if (xhr.status === 413) {
          reject(new Error(body.message || "That file is too large for the server to accept."));
          return;
        }
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(Object.assign(new Error(body.message || `Upload failed (${xhr.status})`), { status: xhr.status }));
          return;
        }
        const list = body.attachments || (body.attachment ? [body.attachment] : []);
        resolve({
          attachments: list.map((attachment) => ({ ...attachment, source: "upload" as const })),
          errors: body.errors || [],
        });
      };
      xhr.send(form);
    });
  },

  async listWebsiteMedia(sessionId: string): Promise<{ siteName: string | null; media: Array<{ id: number; title: string; url: string; alt: string }> }> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/session/${sessionId}/website-media`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || "Could not load website images");
    }
    return resp.json();
  },

  async sendMessage(
    sessionId: string,
    message: string,
    model?: string,
    mode?: string,
    siteMeta?: SessionMetadataInput,
    attachments?: McpChatAttachment[],
  ): Promise<McpChatResponse> {
    const stored = getStoredSessionSite(sessionId);
    const effectiveMeta = { ...stored, ...siteMeta };

    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        sessionId,
        message,
        model,
        mode,
        websiteName: effectiveMeta.websiteName,
        websiteUrl: effectiveMeta.websiteUrl,
        websiteLogoUrl: effectiveMeta.websiteLogoUrl,
        additionalInstructions: effectiveMeta.additionalInstructions,
        mcpConnectionId: effectiveMeta.mcpConnectionId,
        attachments: (attachments || []).map((attachment) => (
          attachment.source === "website" || attachment.mediaId
            ? { source: "website" as const, mediaId: attachment.mediaId, url: attachment.url, title: attachment.fileName, alt: attachment.alt || attachment.fileName }
            : { source: "upload" as const, id: attachment.id }
        )),
      }),
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
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`quasar_session_site_${sessionId}`);
      } catch {}
    }
    await fetch(`${BACKEND_URL}/api/keyword-mcp/session/${sessionId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
  },

  downloadFileUrl(fileId: string): string {
    return `${BACKEND_URL}/api/keyword-mcp/files/${fileId}`;
  },

  async downloadFile(fileId: string, filename: string): Promise<void> {
    const resp = await fetch(`${BACKEND_URL}/api/keyword-mcp/files/${fileId}`, {
      headers: { ...authHeaders() },
    });
    if (!resp.ok) throw new Error(`Failed to download file: ${resp.status}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
