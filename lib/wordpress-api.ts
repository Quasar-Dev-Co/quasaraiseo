const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quasar_auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
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

export const wordpressApi = {
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
