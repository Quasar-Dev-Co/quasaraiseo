const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  company: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserRecord;
  token: string;
  expiresIn: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  company?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

class AuthApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.details = details;
  }
}

async function authRequest<T>(
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
      // body is not JSON
    }
    const message =
      details && typeof details === "object" && "message" in details
        ? String((details as { message: unknown }).message)
        : `Request failed (${response.status})`;
    throw new AuthApiError(message, response.status, details);
  }

  return response.json() as Promise<T>;
}

const TOKEN_KEY = "quasar_auth_token";

export const authApi = {
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const result = await authRequest<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, result.token);
    }
    return result;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const result = await authRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, result.token);
    }
    return result;
  },

  async me(): Promise<{ user: UserRecord }> {
    const token = this.getToken();
    if (!token) throw new AuthApiError("No token found.", 401);

    return authRequest<{ user: UserRecord }>("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  isAuthApiError(error: unknown): error is AuthApiError {
    return error instanceof AuthApiError;
  },
};
