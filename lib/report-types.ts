export interface Finding {
  severity: "critical" | "high" | "medium" | "pass";
  title: string;
  detail: string;
  action: string;
}

export interface MetricItem {
  label: string;
  value: string;
  status: "good" | "warning" | "critical";
}

export interface EeatMatrixRow {
  factor: string;
  score: number;
  signals: string;
  gaps: string;
}

export interface CurrentKeyword {
  keyword: string;
  relevance: string;
  status: string;
}

export interface TargetKeyword {
  keyword: string;
  searchVolume: number;
  difficulty: string;
  priority: string;
}

export interface ReferringDomain {
  domain: string;
  links: number;
  spamScore: number;
  assessment: string;
}

export interface AiCrawler {
  crawler: string;
  owner: string;
  purpose: string;
  status: string;
}

export interface SchemaRec {
  type: string;
  page: string;
  priority: string;
  impact: string;
}

export interface ScoreBreakdownRow {
  category: string;
  weight: string;
  score: number;
  status: string;
}

export interface ActionPhase {
  title: string;
  items: { action: string; impact: string }[];
}

export interface QuickWin {
  action: string;
  timeEstimate: string;
  impact: string;
}

export interface RichReport {
  executiveSummary?: string;
  technicalSeo?: { score: number; findings: Finding[]; metrics: MetricItem[] };
  contentEeat?: { score: number; findings: Finding[]; eeatMatrix: EeatMatrixRow[] };
  onPageKeywords?: {
    score: number;
    findings: Finding[];
    currentKeywords: CurrentKeyword[];
    targetKeywords: TargetKeyword[];
  };
  backlinkProfile?: {
    score: number;
    metrics: MetricItem[];
    findings: Finding[];
    topReferringDomains: ReferringDomain[];
    strategy: string;
  };
  aiVisibility?: { score: number; findings: Finding[]; aiCrawlerAccess: AiCrawler[] };
  schemaStructuredData?: { score: number; findings: Finding[]; recommendedSchemas: SchemaRec[] };
  scoreBreakdown?: ScoreBreakdownRow[];
  actionPlan?: { phase1: ActionPhase; phase2: ActionPhase; phase3: ActionPhase; phase4: ActionPhase };
  quickWins?: QuickWin[];
  projectedOutcomes?: string;
}

export function parseRichReport(json: Record<string, unknown> | undefined): RichReport | null {
  if (!json) return null;
  return json as unknown as RichReport;
}
