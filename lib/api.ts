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

export type AuditStatus =
  | "queued"
  | "crawling"
  | "enriching"
  | "analyzing"
  | "reporting"
  | "completed"
  | "failed";

export interface CrawledPageRecord {
  id: string;
  auditJobId: string;
  url: string;
  statusCode: number | null;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  canonicalUrl: string | null;
  htmlLang: string | null;
  wordCount: number | null;
  internalLinksCount: number;
  externalLinksCount: number;
  indexable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KeywordRankingRecord {
  id: string;
  auditJobId: string;
  keyword: string;
  searchVolume: number;
  competition: number | null;
  cpc: number | null;
  position: number | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SerpCompetitorRecord {
  id: string;
  auditJobId: string;
  domain: string;
  visibility: number | null;
  estimatedTraffic: string | null;
  keywordsCount: number | null;
  relevance: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditReportRecord {
  id: string;
  auditJobId: string;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  authorityScore: number;
  uxScore: number;
  summary: string;
  recommendations: string;
  reportJson: Record<string, unknown>;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditJobRecord {
  id: string;
  url: string;
  market: string;
  language: string;
  niche?: string;
  notes?: string;
  websiteId: string;
  websiteUrl: string;
  websiteHost: string;
  projectId: string;
  projectName: string;
  status: AuditStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  crawledPages?: CrawledPageRecord[];
  keywordRankings?: KeywordRankingRecord[];
  serpCompetitors?: SerpCompetitorRecord[];
  report?: AuditReportRecord | null;
}

export interface CreateAuditPayload {
  url: string;
  market: string;
  language: string;
  niche?: string;
  notes?: string;
}

export interface CreateAuditResponse {
  audit: AuditJobRecord;
  pipeline: { stage: string; description: string }[];
}

export interface ListAuditsResponse {
  items: AuditJobRecord[];
}

export interface GetAuditResponse {
  audit: AuditJobRecord;
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
  createAudit(payload: CreateAuditPayload) {
    return request<CreateAuditResponse>("/api/audits", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: authHeaders(),
    });
  },

  getAudit(id: string) {
    return request<GetAuditResponse>(`/api/audits/${id}`, {
      headers: authHeaders(),
    });
  },

  listAudits() {
    return request<ListAuditsResponse>("/api/audits", {
      headers: authHeaders(),
    });
  },

  deleteAudit(id: string) {
    return request<{ success: boolean }>(`/api/audits/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },

  isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  },
};
