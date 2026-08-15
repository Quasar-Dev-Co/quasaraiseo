import { authApi } from "@/lib/auth-api";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface Branding {
  id: string;
  userId: string;
  companyName: string;
  description: string;
  website: string;
  defaultColor: string;
  logoUrl: string | null;
  industry: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  socialLinks: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingInput {
  companyName: string;
  description?: string;
  website?: string;
  defaultColor?: string;
  logoUrl?: string;
  industry?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  address?: string;
  socialLinks?: Record<string, string>;
  isDefault?: boolean;
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

export const brandingApi = {
  async getAll(): Promise<Branding[]> {
    const data = await apiRequest<{ brandings: Branding[] }>("/api/branding");
    return data.brandings;
  },

  async create(input: BrandingInput): Promise<Branding> {
    const data = await apiRequest<{ branding: Branding }>("/api/branding", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.branding;
  },

  async update(id: string, input: Partial<BrandingInput>): Promise<Branding> {
    const data = await apiRequest<{ branding: Branding }>(`/api/branding/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return data.branding;
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/api/branding/${id}`, { method: "DELETE" });
  },

  async uploadLogo(file: File): Promise<string> {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");

    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch(`${BACKEND_URL}/api/branding/upload-logo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(data.message || `Upload failed with ${res.status}`);
    }

    const data = await res.json();
    return data.logoUrl;
  },
};
