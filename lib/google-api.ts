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

export interface SearchConsoleDimensionRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface ScDimensionFilter {
  dimension: string;
  operator: string;
  expression: string;
}

export interface SitemapInfo {
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean;
  isSitemapsIndex: boolean;
  type: string;
  errors: string;
  warnings: string;
  contents: Array<{ type: string; submitted: string; indexed: string }>;
}

export interface UrlInspectionResult {
  inspectionResultLink?: string;
  indexStatusResult?: {
    verdict?: string;
    coverageState?: string;
    robotsTxtState?: string;
    indexingState?: string;
    lastCrawlTime?: string;
    pageFetchState?: string;
    googleCanonical?: string;
    userCanonical?: string;
    sitemap?: string[];
    referringUrls?: string[];
    crawledAs?: string;
  };
  mobileUsabilityResult?: {
    verdict?: string;
    issues?: Array<{ issueType: string; severity: string; message: string }>;
  };
  richResultsResult?: {
    verdict?: string;
    detectedItems?: Array<{ items: Array<{ name: string; issues?: Array<unknown> }> }>;
  };
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

export interface AnalyticsReportRow {
  dimensionValues: string[];
  metricValues: number[];
}

export interface AnalyticsReport {
  rows: AnalyticsReportRow[];
  totals: Array<{ metric: string; value: number }>;
  metrics: string[];
  dimensions: string[];
}

export interface RealtimeReport {
  totalActiveUsers: number;
  totalPageViews: number;
  byCountry: Array<{ country: string; activeUsers: number; pageViews: number }>;
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

  async getSearchConsoleByDimension(
    siteUrl: string,
    startDate: string,
    endDate: string,
    options: {
      dimensions: string[];
      searchType?: string;
      filters?: ScDimensionFilter[];
      rowLimit?: number;
    },
  ): Promise<SearchConsoleDimensionRow[]> {
    const params = new URLSearchParams({
      siteUrl,
      startDate,
      endDate,
      dimensions: options.dimensions.join(","),
    });
    if (options.searchType) params.set("searchType", options.searchType);
    if (options.rowLimit) params.set("rowLimit", String(options.rowLimit));
    if (options.filters && options.filters.length > 0) {
      params.set("filters", JSON.stringify(options.filters));
    }
    const res = await fetch(
      `${BACKEND_URL}/api/google/search-console/dimension?${params}`,
      { method: "GET", headers: { ...authHeaders() } },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch Search Console dimension data");
    }
    const data = (await res.json()) as { rows: SearchConsoleDimensionRow[] };
    return data.rows;
  },

  async inspectUrl(
    siteUrl: string,
    inspectionUrl: string,
  ): Promise<UrlInspectionResult | null> {
    const params = new URLSearchParams({ siteUrl, inspectionUrl });
    const res = await fetch(
      `${BACKEND_URL}/api/google/search-console/inspect-url?${params}`,
      { method: "GET", headers: { ...authHeaders() } },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to inspect URL");
    }
    const data = (await res.json()) as { inspectionResult: UrlInspectionResult | null };
    return data.inspectionResult;
  },

  async getSitemaps(siteUrl: string): Promise<SitemapInfo[]> {
    const params = new URLSearchParams({ siteUrl });
    const res = await fetch(
      `${BACKEND_URL}/api/google/search-console/sitemaps?${params}`,
      { method: "GET", headers: { ...authHeaders() } },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch sitemaps");
    }
    const data = (await res.json()) as { sitemaps: SitemapInfo[] };
    return data.sitemaps;
  },

  async submitSitemap(siteUrl: string, feedpath: string): Promise<void> {
    const res = await fetch(
      `${BACKEND_URL}/api/google/search-console/sitemaps/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ siteUrl, feedpath }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to submit sitemap");
    }
  },

  async deleteSitemap(siteUrl: string, feedpath: string): Promise<void> {
    const res = await fetch(
      `${BACKEND_URL}/api/google/search-console/sitemaps/delete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ siteUrl, feedpath }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to delete sitemap");
    }
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

  async getAnalyticsReport(
    propertyId: string,
    options: {
      startDate: string;
      endDate: string;
      prevStartDate?: string;
      prevEndDate?: string;
      dimensions: string[];
      metrics: string[];
      filterField?: string;
      filterValue?: string;
      orderBy?: string;
      orderDesc?: boolean;
      limit?: number;
    },
  ): Promise<AnalyticsReport> {
    const params = new URLSearchParams({
      propertyId,
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions.join(","),
      metrics: options.metrics.join(","),
    });
    if (options.prevStartDate) params.set("prevStartDate", options.prevStartDate);
    if (options.prevEndDate) params.set("prevEndDate", options.prevEndDate);
    if (options.filterField) params.set("filterField", options.filterField);
    if (options.filterValue) params.set("filterValue", options.filterValue);
    if (options.orderBy) params.set("orderBy", options.orderBy);
    if (options.orderDesc !== undefined) params.set("orderDesc", String(options.orderDesc));
    if (options.limit) params.set("limit", String(options.limit));
    const res = await fetch(
      `${BACKEND_URL}/api/google/analytics/report?${params}`,
      { method: "GET", headers: { ...authHeaders() } },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch Analytics report");
    }
    return res.json() as Promise<AnalyticsReport>;
  },

  async getRealtimeReport(propertyId: string): Promise<RealtimeReport> {
    const params = new URLSearchParams({ propertyId });
    const res = await fetch(
      `${BACKEND_URL}/api/google/analytics/realtime?${params}`,
      { method: "GET", headers: { ...authHeaders() } },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch realtime report");
    }
    return res.json() as Promise<RealtimeReport>;
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
