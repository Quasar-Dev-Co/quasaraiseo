import { authApi } from "@/lib/auth-api";

async function request(path: string, options?: RequestInit) {
  const token = authApi.getToken();
  if (!token) throw new Error("Not authenticated.");

  const response = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data ? String(data.message) : "Request failed.";
    throw new Error(message);
  }
  return data as { url: string | null };
}

export const profileAvatarApi = {
  get: () => request("/api/profile/avatar"),
  upload(file: File) {
    const body = new FormData();
    body.append("avatar", file);
    return request("/api/profile/avatar", { method: "POST", body });
  },
  remove: () => request("/api/profile/avatar", { method: "DELETE" }),
};
