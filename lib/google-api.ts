import { authApi } from "@/lib/auth-api";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface GoogleStatus {
  connected: boolean;
  email: string | null;
  services: {
    searchConsole: boolean;
    analytics: boolean;
    sheets: boolean;
  };
  scopes: string[];
  connectedAt: string | null;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

function getToken(): string | null {
  return authApi.getToken();
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface SearchConsoleRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleDailyRow {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface AnalyticsProperty {
  propertyId: string;
  displayName: string;
  propertyType: string;
  industryCategory: string | null;
}

export interface AnalyticsDataRow {
  date: string;
  sessions: number;
  users: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
}

export interface AnalyticsData {
  rows: AnalyticsDataRow[];
  totals: Array<{ metric: string; value: number }>;
}

export interface GoogleSheet {
  id: string;
  name: string;
  modifiedTime: string;
  spreadsheetUrl?: string;
  sheetTabName?: string;
}

export interface SheetWriteResult {
  updatedCells: number;
  rowsWritten: number;
}

export interface SheetCreateResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export const googleApi = {
  async getAuthUrl(): Promise<string> {
    const res = await fetch(`${BACKEND_URL}/api/google/connect`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to get auth URL");
    }
    const data = (await res.json()) as { authUrl: string };
    return data.authUrl;
  },

  async getStatus(): Promise<GoogleStatus> {
    const res = await fetch(`${BACKEND_URL}/api/google/status`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      throw new Error("Failed to get Google connection status");
    }
    return res.json() as Promise<GoogleStatus>;
  },

  async disconnect(): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/google/disconnect`, {
      method: "POST",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to disconnect");
    }
  },

  async enable2FA(): Promise<{
    enabled: boolean;
    method: string;
    backupCodes: string[];
  }> {
    const res = await fetch(`${BACKEND_URL}/api/security/2fa`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ enable: true }),
    });
    if (!res.ok) throw new Error("Failed to enable 2FA");
    return res.json();
  },

  async disable2FA(): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/security/2fa`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ enable: false }),
    });
    if (!res.ok) throw new Error("Failed to disable 2FA");
  },

  async getDevices(): Promise<DeviceInfo[]> {
    const res = await fetch(`${BACKEND_URL}/api/security/devices`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error("Failed to get devices");
    const data = (await res.json()) as { devices: DeviceInfo[] };
    return data.devices;
  },

  async revokeDevice(sessionId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/security/devices`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) throw new Error("Failed to revoke device");
  },

  async revokeAllDevices(): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/security/devices`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ revokeAll: true }),
    });
    if (!res.ok) throw new Error("Failed to revoke all devices");
  },

  async getSearchConsoleSites(): Promise<SearchConsoleSite[]> {
    const res = await fetch(`${BACKEND_URL}/api/google/search-console/sites`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch Search Console sites");
    }
    const data = (await res.json()) as { sites: SearchConsoleSite[] };
    return data.sites;
  },

  async getSearchConsoleAnalytics(
    siteUrl: string,
    startDate: string,
    endDate: string,
  ): Promise<SearchConsoleRow[]> {
    const params = new URLSearchParams({ siteUrl, startDate, endDate });
    const res = await fetch(
      `${BACKEND_URL}/api/google/search-console/analytics?${params}`,
      { method: "GET", headers: { ...authHeaders() } },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch Search Console analytics");
    }
    const data = (await res.json()) as { rows: SearchConsoleRow[] };
    return data.rows;
  },

  async getSearchConsoleDaily(
    siteUrl: string,
    startDate: string,
    endDate: string,
  ): Promise<SearchConsoleDailyRow[]> {
    const params = new URLSearchParams({ siteUrl, startDate, endDate });
    const res = await fetch(
      `${BACKEND_URL}/api/google/search-console/daily?${params}`,
      { method: "GET", headers: { ...authHeaders() } },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch Search Console daily data");
    }
    const data = (await res.json()) as { rows: SearchConsoleDailyRow[] };
    return data.rows;
  },

  async getAnalyticsProperties(): Promise<AnalyticsProperty[]> {
    const res = await fetch(`${BACKEND_URL}/api/google/analytics/properties`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch Analytics properties");
    }
    const data = (await res.json()) as { properties: AnalyticsProperty[] };
    return data.properties;
  },

  async getAnalyticsData(
    propertyId: string,
    startDate: string,
    endDate: string,
  ): Promise<AnalyticsData> {
    const params = new URLSearchParams({ propertyId, startDate, endDate });
    const res = await fetch(
      `${BACKEND_URL}/api/google/analytics/data?${params}`,
      { method: "GET", headers: { ...authHeaders() } },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch Analytics data");
    }
    return res.json() as Promise<AnalyticsData>;
  },

  async getSheets(): Promise<GoogleSheet[]> {
    const res = await fetch(`${BACKEND_URL}/api/google/sheets`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch Google Sheets");
    }
    const data = (await res.json()) as { sheets: GoogleSheet[] };
    return data.sheets;
  },

  async readSheet(spreadsheetId: string, range?: string): Promise<string[][]> {
    const params = new URLSearchParams({ spreadsheetId });
    if (range) params.set("range", range);
    const res = await fetch(
      `${BACKEND_URL}/api/google/sheets/read?${params}`,
      { method: "GET", headers: { ...authHeaders() } },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to read sheet");
    }
    const data = (await res.json()) as { values: string[][] };
    return data.values;
  },

  async writeTasksToSheet(
    spreadsheetId: string,
    tasks: Array<Record<string, string | number>>,
  ): Promise<SheetWriteResult> {
    const res = await fetch(`${BACKEND_URL}/api/google/sheets/write-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ spreadsheetId, tasks }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to write tasks to sheet");
    }
    return res.json() as Promise<SheetWriteResult>;
  },

  async createTaskSheet(
    title: string,
    options?: { sheetTabName?: string; locale?: string; timeZone?: string },
  ): Promise<SheetCreateResult> {
    const res = await fetch(`${BACKEND_URL}/api/google/sheets/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ title, ...options }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to create sheet");
    }
    return res.json() as Promise<SheetCreateResult>;
  },

  async writeAuditTemplate(
    spreadsheetId: string,
    tasks: Array<Record<string, string | number | undefined>>,
    sheetTabName = "Tasks",
  ): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/google/sheets/write-template`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ spreadsheetId, sheetTabName, tasks }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to write audit template");
    }
  },

  async importTasksFromSheet(spreadsheetId: string, range?: string): Promise<Array<Record<string, string | number>>> {
    const res = await fetch(`${BACKEND_URL}/api/google/sheets/import-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ spreadsheetId, range }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to import tasks from sheet");
    }
    const data = (await res.json()) as { tasks: Array<Record<string, string | number>> };
    return data.tasks;
  },

  async deleteSheet(spreadsheetId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/google/sheets/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ spreadsheetId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to delete sheet");
    }
  },
};
