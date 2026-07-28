const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quasar_auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
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

export interface WordPressSite {
  id: string;
  siteUrl: string;
  siteName: string;
  connected: boolean;
  lastSyncAt: string | null;
  postCount: number;
  recentPosts: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    permalink: string | null;
  }>;
}

export interface WordPressPost {
  id: string;
  siteId: string;
  wpPostId: number | null;
  title: string;
  content: string;
  excerpt: string;
  status: "draft" | "publish" | "future" | "pending" | "private";
  categories: string[];
  tags: string[];
  featuredImage: string | null;
  scheduledDate: string | null;
  permalink: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedContent {
  title: string;
  metaDescription: string;
  body: string;
  wordCount: number;
  readingTime: number;
  slug: string;
  headings: string[];
}

export interface PostSkillRecord {
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

export interface WordPressSiteData {
  siteUrl: string;
  siteName: string;
  siteDesc: string;
  wpVersion: string;
  language: string;
  timezone: string;
  adminEmail: string;
  categories: Array<{ id: number; name: string; slug: string; count: number }>;
  tags: Array<{ id: number; name: string; slug: string; count: number }>;
  recentPosts: Array<{ id: number; title: string; status: string; date: string; excerpt: string }>;
  totalPages: number;
  totalPosts: number;
  totalDrafts: number;
}

export interface ModelRecord {
  id: string;
  label?: string;
}

export type GenerationStatus = "idle" | "generating" | "completed" | "failed";

export interface GenerationJob {
  id: string;
  prompt: string;
  status: GenerationStatus;
  result: GeneratedContent | null;
  errorMessage: string | null;
  skillId: string | null;
  skill?: PostSkillRecord | null;
  siteId: string | null;
  model: string;
  createdAt: string;
  completedAt: string | null;
}

export const wordpressApi = {
  // ─── Skills ───
  async listPostSkills(): Promise<{ skills: PostSkillRecord[] }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/skills`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch skills");
    return res.json();
  },

  async uploadPostSkill(file: File): Promise<{ skill: PostSkillRecord }> {
    const base64Data = await fileToBase64(file);
    const res = await fetch(`${BACKEND_URL}/api/wordpress/skills/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ filename: file.name, data: base64Data }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Upload failed");
    }
    return res.json();
  },

  async deletePostSkill(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/skills/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error("Delete failed");
    return res.json();
  },

  // ─── AI Models ───
  async listModels(): Promise<{ models: ModelRecord[] }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/models`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) return { models: [] };
    return res.json();
  },

  // ─── WordPress Data Sync ───
  async syncSiteData(siteId: string): Promise<{ success: boolean; data: WordPressSiteData }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/sites/${siteId}/sync-data`, {
      method: "POST",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to sync site data");
    }
    return res.json();
  },

  async getSiteData(siteId: string): Promise<{ data: WordPressSiteData | null }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/sites/${siteId}/data`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) return { data: null };
    return res.json();
  },

  // ─── AI Content Generation (Windsurf API) ───
  async generateWithWindsurf(params: {
    prompt: string;
    skillId?: string;
    model?: string;
    siteId?: string;
  }): Promise<{ job: GenerationJob }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/generate-windsurf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to start generation");
    }
    return res.json();
  },

  async getGenerationJob(jobId: string): Promise<{ job: GenerationJob }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/generation-jobs/${jobId}`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch job status");
    return res.json();
  },

  async listGenerationJobs(): Promise<{ jobs: GenerationJob[] }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/generation-jobs`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) return { jobs: [] };
    return res.json();
  },

  // ─── Legacy OpenAI generation ───
  async generateContent(params: {
    prompt: string;
    contentType?: string;
    tone?: string;
    wordCount?: number;
    language?: string;
    audience?: string;
    callToAction?: string;
    secondaryKeywords?: string;
    outline?: string;
  }): Promise<{ success: boolean; content: GeneratedContent }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to generate content");
    }
    return res.json();
  },

  async connectSite(siteUrl: string, token: string): Promise<{ success: boolean; site: WordPressSite & { appPassword?: string } }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ siteUrl, token }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to connect WordPress site");
    }
    return res.json();
  },

  async disconnectSite(siteUrl: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ siteUrl }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to disconnect");
    }
    return res.json();
  },

  async getSites(): Promise<WordPressSite[]> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/sites`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch WordPress sites");
    }
    const data = await res.json();
    return data.sites;
  },

  async getSite(siteId: string): Promise<{ site: WordPressSite & { posts: WordPressPost[] } }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/sites/${siteId}`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch site");
    }
    return res.json();
  },

  async publishPost(
    siteId: string,
    postData: {
      title: string;
      content: string;
      excerpt?: string;
      status?: "draft" | "publish" | "future";
      categories?: string[];
      tags?: string[];
      featuredImage?: string;
      scheduledDate?: string;
    },
  ): Promise<{ success: boolean; post: WordPressPost }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/sites/${siteId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(postData),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to publish post");
    }
    return res.json();
  },

  async getPosts(siteId: string): Promise<WordPressPost[]> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/sites/${siteId}/posts`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch posts");
    }
    const data = await res.json();
    return data.posts;
  },

  async syncPosts(siteId: string): Promise<{ success: boolean; posts: Array<Record<string, unknown>> }> {
    const res = await fetch(`${BACKEND_URL}/api/wordpress/sites/${siteId}/sync`, {
      method: "POST",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to sync posts");
    }
    return res.json();
  },
};
