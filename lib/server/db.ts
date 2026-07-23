import { createHash, createHmac, randomBytes } from "crypto";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  company: string | null;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAudit {
  id: string;
  userId: string;
  url: string;
  market: string;
  language: string;
  niche: string | null;
  notes: string | null;
  websiteHost: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  report: {
    overallScore: number;
    technicalScore: number;
    contentScore: number;
    authorityScore: number;
    uxScore: number;
    summary: string;
    recommendations: string;
    reportJson?: Record<string, unknown>;
  } | null;
  crawledPages: Array<{
    id: string;
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
  }>;
  keywordRankings: Array<{
    id: string;
    keyword: string;
    searchVolume: number;
    competition: number | null;
    cpc: number | null;
    position: number | null;
    url: string | null;
  }>;
  serpCompetitors: Array<{
    id: string;
    domain: string;
    visibility: number | null;
    estimatedTraffic: string | null;
    keywordsCount: number | null;
    relevance: number | null;
  }>;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "quasar-dev-secret-change-in-production-2026";

// In-memory stores (reset on server restart)
const users = new Map<string, StoredUser>();
const audits = new Map<string, StoredAudit>();

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computedHash = createHash("sha256").update(salt + password).digest("hex");
  return computedHash === hash;
}

export function createToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): { sub: string; exp: number } | null {
  try {
    const [header, payload, signature] = token.split(".");
    const expectedSignature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub: string; exp: number };
    if (Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return users.get(email.toLowerCase());
}

export function findUserById(id: string): StoredUser | undefined {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

export function createUser(data: { name: string; email: string; password: string; company?: string }): StoredUser {
  const { hash, salt } = hashPassword(data.password);
  const now = new Date().toISOString();
  const user: StoredUser = {
    id: `usr_${randomBytes(12).toString("hex")}`,
    email: data.email.toLowerCase(),
    name: data.name,
    company: data.company ?? null,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now,
    updatedAt: now,
  };
  users.set(user.email, user);
  return user;
}

export function createAuditRecord(data: {
  userId: string;
  url: string;
  market: string;
  language: string;
  niche?: string;
  notes?: string;
}): StoredAudit {
  const id = `aud_${randomBytes(12).toString("hex")}`;
  const now = new Date().toISOString();
  let host = data.url;
  try { host = new URL(data.url).host; } catch { /* keep raw */ }
  const audit: StoredAudit = {
    id,
    userId: data.userId,
    url: data.url,
    market: data.market,
    language: data.language,
    niche: data.niche ?? null,
    notes: data.notes ?? null,
    websiteHost: host,
    status: "queued",
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    report: null,
    crawledPages: [],
    keywordRankings: [],
    serpCompetitors: [],
  };
  audits.set(id, audit);
  return audit;
}

export function getAuditById(id: string): StoredAudit | undefined {
  return audits.get(id);
}

export function getAuditsByUserId(userId: string): StoredAudit[] {
  const result: StoredAudit[] = [];
  for (const audit of audits.values()) {
    if (audit.userId === userId) result.push(audit);
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateAuditStatus(id: string, status: string): StoredAudit | undefined {
  const audit = audits.get(id);
  if (!audit) return undefined;
  audit.status = status;
  audit.updatedAt = new Date().toISOString();
  if (status === "completed") {
    audit.completedAt = new Date().toISOString();
  }
  audits.set(id, audit);
  return audit;
}

export function completeAudit(
  id: string,
  report: StoredAudit["report"],
  crawledPages: StoredAudit["crawledPages"],
  keywordRankings: StoredAudit["keywordRankings"],
  serpCompetitors: StoredAudit["serpCompetitors"],
): StoredAudit | undefined {
  const audit = audits.get(id);
  if (!audit) return undefined;
  audit.status = "completed";
  audit.completedAt = new Date().toISOString();
  audit.updatedAt = audit.completedAt;
  audit.report = report;
  audit.crawledPages = crawledPages;
  audit.keywordRankings = keywordRankings;
  audit.serpCompetitors = serpCompetitors;
  audits.set(id, audit);
  return audit;
}

const PIPELINE_STAGES = ["queued", "crawling", "enriching", "analyzing", "reporting", "completed"] as const;
const STAGE_DURATIONS_MS: Record<string, number> = {
  queued: 2000,
  crawling: 2500,
  enriching: 2000,
  analyzing: 1500,
  reporting: 1000,
};

export function advanceAuditPipeline(id: string): StoredAudit | undefined {
  const audit = audits.get(id);
  if (!audit) return undefined;
  if (audit.status === "completed" || audit.status === "failed") return audit;

  const now = Date.now();
  const startedAtMs = audit.startedAt ? new Date(audit.startedAt).getTime() : now;
  const elapsed = now - startedAtMs;

  let cumulative = 0;
  let targetStage = audit.status;
  for (let i = 0; i < PIPELINE_STAGES.length - 1; i++) {
    const stage = PIPELINE_STAGES[i];
    cumulative += STAGE_DURATIONS_MS[stage] ?? 2000;
    if (elapsed < cumulative) {
      targetStage = stage;
      break;
    }
    targetStage = PIPELINE_STAGES[i + 1];
  }

  if (targetStage !== audit.status) {
    if (targetStage === "completed") {
      return undefined;
    }
    audit.status = targetStage;
    audit.updatedAt = new Date().toISOString();
    audits.set(id, audit);
  }

  return audit;
}

export function shouldCompleteAudit(id: string): boolean {
  const audit = audits.get(id);
  if (!audit) return false;
  if (audit.status === "completed" || audit.status === "failed") return false;

  const now = Date.now();
  const startedAtMs = audit.startedAt ? new Date(audit.startedAt).getTime() : now;
  const elapsed = now - startedAtMs;

  let cumulative = 0;
  for (let i = 0; i < PIPELINE_STAGES.length - 1; i++) {
    const stage = PIPELINE_STAGES[i];
    cumulative += STAGE_DURATIONS_MS[stage] ?? 2000;
  }
  return elapsed >= cumulative;
}

export function getAuthFromRequest(request: Request): { userId: string } | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return { userId: decoded.sub };
}

export function deleteAudit(id: string): boolean {
  return audits.delete(id);
}
