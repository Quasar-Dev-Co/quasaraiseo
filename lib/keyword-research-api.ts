const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("quasar_auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface KeywordRecord {
  keyword: string;
  volume: number;
  kd: number;
  cpc: number;
  traffic_potential?: number;
  intent: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  serp_features?: string[];
  recommended_page?: string;
  category?: string;
  page_url_suggestion?: string;
  location?: string;
  landing_page_url?: string;
  content_type?: string;
  title_suggestion?: string;
}

export interface CompetitorRecord {
  name: string;
  domain?: string;
  reviews?: number;
  rating?: number;
  domain_rating?: number;
  estimated_traffic?: number;
  strengths: string;
  weaknesses: string;
  opportunity: string;
  top_keywords?: string[];
}

export interface TopicClusterRecord {
  cluster_name: string;
  pillar_keyword: string;
  pillar_volume?: number;
  supporting_keywords: string[];
  total_volume: number;
  avg_kd: number;
  page_type: string;
  content_gap?: string;
}

export interface QuickWinRecord {
  keyword: string;
  volume: number;
  kd: number;
  cpc?: number;
  current_position_est?: string;
  action: string;
  expected_impact: "Very High" | "High" | "Medium" | "Low";
  target_page?: string;
}

export interface SerpFeatureRecord {
  feature: string;
  keyword_count: number;
  example_keywords: string[];
  how_to_win: string;
  opportunity_level: "Very High" | "High" | "Medium" | "Low";
}

export interface SeasonalityRecord {
  keyword: string;
  volume: number;
  peak_months: string[];
  low_months: string[];
  trend_direction: "growing" | "stable" | "declining" | "seasonal";
  yoy_change?: string;
}

export interface ContentStrategyRecord {
  priority_phase: string;
  content_type: string;
  target_keywords: string;
  est_volume: string;
  page_url: string;
  status?: string;
}

export interface KeywordResearchMeta {
  niche: string;
  location?: string | null;
  industry_type: string;
  business_name?: string | null;
  generated_at: string;
  data_source: string;
  total_keywords: number;
  total_monthly_volume: number;
  avg_cpc: number;
  top_opportunity: { keyword: string; volume: number };
  highest_cpc: { keyword: string; cpc: number };
  competitor_count: number;
  location_count?: number;
  has_location_data: boolean;
  market_population?: number | null;
  market_description?: string | null;
}

export interface KeywordResearchResult {
  meta: KeywordResearchMeta;
  primary_keywords: KeywordRecord[];
  service_keywords: KeywordRecord[];
  location_keywords: KeywordRecord[];
  longtail_keywords: KeywordRecord[];
  competitors: CompetitorRecord[];
  content_strategy: ContentStrategyRecord[];
  topic_clusters: TopicClusterRecord[];
  quick_wins: QuickWinRecord[];
  serp_features: SerpFeatureRecord[];
  seasonality: SeasonalityRecord[];
  kpi_summary: {
    total_addressable_volume: number;
    estimated_traffic_12mo?: string;
    estimated_leads_12mo?: string;
    categories_count: number;
    quick_win_count: number;
    content_pieces_planned: number;
    estimated_investment?: string | null;
    key_findings: string[];
  };
}

export interface AgentStep {
  id: string;
  label: string;
  tool: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
  result?: string;
  timestamp: number;
}

export interface KeywordResearchJob {
  id: string;
  userId: string;
  seed: string;
  location: string | null;
  industryType: string | null;
  businessName: string | null;
  status: "running" | "completed" | "failed";
  result: KeywordResearchResult | null;
  steps: AgentStep[] | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export const keywordResearchApi = {
  async startResearch(params: {
    seed: string;
    location?: string;
    industryType?: string;
    businessName?: string;
  }): Promise<{ job: KeywordResearchJob }> {
    const res = await fetch(`${BACKEND_URL}/api/keyword-research`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to start keyword research");
    }
    return res.json();
  },

  async getJob(jobId: string): Promise<{ job: KeywordResearchJob }> {
    const res = await fetch(`${BACKEND_URL}/api/keyword-research/${jobId}`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch job status");
    return res.json();
  },

  async listJobs(): Promise<{ jobs: KeywordResearchJob[] }> {
    const res = await fetch(`${BACKEND_URL}/api/keyword-research`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) return { jobs: [] };
    return res.json();
  },

  async deleteJob(jobId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/keyword-research/${jobId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error("Failed to delete job");
    return res.json();
  },
};
