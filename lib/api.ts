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

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      // response body is not JSON
    }
    throw new ApiError(
      `API error ${response.status}: ${response.statusText}`,
      response.status,
      details
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  },
};
