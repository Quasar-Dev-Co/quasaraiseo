import { authApi } from "@/lib/auth-api";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface AccountOption {
  id: string;
  name: string;
  email: string;
  role: "user" | "super";
}

export const accountApi = {
  async listAccounts(): Promise<AccountOption[]> {
    const token = authApi.getToken();
    const res = await fetch(`${BACKEND_URL}/api/auth/accounts`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to load accounts");
    }
    const data = (await res.json()) as { accounts: AccountOption[] };
    return data.accounts;
  },
};
