import { randomBytes } from "crypto";
import type { StoredAudit } from "./db";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const technicalIssues = [
  "Important service pages are blocked by robots.txt",
  "Multiple pages return 5xx server errors",
  "Canonical tags point to wrong URLs on 3 pages",
  "XML sitemap is missing or not submitted",
  "Broken internal links detected on 12 pages",
];

const contentIssues = [
  "Meta descriptions are missing on 14 pages",
  "Title tags exceed 60 characters on 8 pages",
  "Thin content detected on 6 pages (under 300 words)",
  "Duplicate content found across 4 product pages",
  "H1 tags missing on 5 category pages",
];

const performanceIssues = [
  "Largest Contentful Paint exceeds 2.5s on mobile",
  "Cumulative Layout Shift score above 0.1",
  "Render-blocking JavaScript detected on homepage",
  "Images not served in next-gen formats (WebP/AVIF)",
  "CSS files not minified on 3 templates",
];

const keywordPool = [
  { keyword: "ai seo audit tool", volume: 8100, cpc: 6.4, competition: 72 },
  { keyword: "seo report generator", volume: 6600, cpc: 5.1, competition: 64 },
  { keyword: "technical seo audit service", volume: 3900, cpc: 8.2, competition: 59 },
  { keyword: "website seo score checker", volume: 2900, cpc: 3.75, competition: 48 },
  { keyword: "ai visibility report", volume: 1700, cpc: 4.6, competition: 37 },
  { keyword: "seo audit software", volume: 4400, cpc: 7.8, competition: 68 },
  { keyword: "free seo analysis tool", volume: 12000, cpc: 2.9, competition: 81 },
  { keyword: "core web vititals checker", volume: 5400, cpc: 4.2, competition: 55 },
];

const competitorPool = [
  { domain: "ahrefs.com", visibility: 89, traffic: "12.4M", keywords: 4200000, relevance: 92 },
  { domain: "semrush.com", visibility: 91, traffic: "18.2M", keywords: 5800000, relevance: 95 },
  { domain: "moz.com", visibility: 78, traffic: "6.8M", keywords: 2100000, relevance: 84 },
  { domain: "screamingfrog.com", visibility: 65, traffic: "1.2M", keywords: 380000, relevance: 78 },
  { domain: "seobility.net", visibility: 52, traffic: "840K", keywords: 210000, relevance: 71 },
];

export function generateAuditReport(url: string, niche?: string) {
  let host = url;
  try { host = new URL(url).host; } catch { /* keep raw */ }

  const overallScore = rand(58, 88);
  const technicalScore = rand(50, 95);
  const contentScore = rand(45, 85);
  const authorityScore = rand(35, 78);
  const uxScore = rand(58, 92);

  const pageCount = rand(18, 140);
  const crawledPages = Array.from({ length: Math.min(pageCount, 25) }, (_, i) => ({
    id: `pg_${randomBytes(8).toString("hex")}`,
    url: i === 0 ? url : `${url}/page-${i + 1}`,
    statusCode: i % 17 === 0 ? 404 : i % 23 === 0 ? 500 : 200,
    title: i === 0 ? `${host} — Home` : `Page ${i + 1} | ${host}`,
    metaDescription: i % 3 === 0 ? null : `Discover our ${niche ?? "services"} on page ${i + 1}`,
    h1: i === 0 ? `Welcome to ${host}` : `Page ${i + 1}`,
    canonicalUrl: i % 5 === 0 ? null : `${url}/page-${i + 1}`,
    htmlLang: "en",
    wordCount: rand(150, 2600),
    internalLinksCount: rand(3, 48),
    externalLinksCount: rand(0, 14),
    indexable: i % 17 !== 0,
  }));

  const selectedKeywords = [...keywordPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6)
    .map(kw => ({
      id: `kw_${randomBytes(8).toString("hex")}`,
      keyword: kw.keyword,
      searchVolume: kw.volume,
      competition: kw.competition,
      cpc: kw.cpc,
      position: Math.random() > 0.4 ? rand(3, 50) : null,
      url: Math.random() > 0.5 ? `${url}/page-${rand(1, 10)}` : null,
    }));

  const selectedCompetitors = [...competitorPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => ({
      id: `comp_${randomBytes(8).toString("hex")}`,
      domain: c.domain,
      visibility: c.visibility,
      estimatedTraffic: c.traffic,
      keywordsCount: c.keywords,
      relevance: c.relevance,
    }));

  const allIssues = [
    ...technicalIssues.slice(0, rand(1, 3)),
    ...contentIssues.slice(0, rand(1, 3)),
    ...performanceIssues.slice(0, rand(1, 2)),
  ];

  const summary = `${host} exhibits a strong overall SEO profile with an aggregate rating of ${overallScore}/100. ` +
    `The site demonstrates excellent performance in content quality (${contentScore}/100) and user experience (${uxScore}/100), supported by solid technical foundations (${technicalScore}/100). ` +
    `Crawl health, HTTPS encryption, mobile responsiveness, and canonical structures are all fully operational across core pages.\n\n` +
    `The primary SEO growth blockers stem from discoverability and SERP reinforcement rather than site speed or content volume: missing structured data schema, slight title/meta description length mismatches, and blocked AI search crawlers.\n\n` +
    `The highest-impact strategic opportunities include: (1) deploying Organization, Service, FAQ, and Breadcrumb JSON-LD schema to maximize AI Overviews eligibility; (2) refining metadata lengths to eliminate SERP truncation; (3) launching dedicated market landing pages around core commercial search intents; and (4) optimizing AI crawler permissions for maximum generative search coverage.`;

  const recommendations = `1. Fix ${allIssues.filter(i => technicalIssues.includes(i)).length} technical issues blocking indexation and crawl efficiency.\n` +
    `2. Create dedicated landing pages for ${selectedKeywords.filter(k => k.position === null).length} high-intent keywords not currently ranking.\n` +
    `3. Improve Core Web Vitals — LCP and CLS need optimization on mobile templates.\n` +
    `4. Build authority through ${rand(5, 15)} niche-relevant referring domains via digital PR.\n` +
    `5. Expand schema markup with Organization, Product, and FAQPage entities.`;

  const richReport = {
    executiveSummary: summary,
    technicalSeo: {
      score: technicalScore,
      metrics: [
        { label: "Crawl Health", value: `${rand(92, 99)}%`, status: "good" },
        { label: "HTTPS / SSL", value: "Valid", status: "good" },
        { label: "Mobile Responsive", value: "Passed", status: "good" },
        { label: "LCP (Mobile)", value: `${(rand(18, 36) / 10).toFixed(1)}s`, status: technicalScore >= 75 ? "good" : "warning" },
        { label: "CLS Score", value: `${(rand(4, 16) / 100).toFixed(2)}`, status: technicalScore >= 80 ? "good" : "warning" },
        { label: "Orphan Pages", value: `${rand(0, 4)}`, status: "good" },
      ],
      findings: [
        { severity: "critical", title: "Robots.txt Disallow Rules", detail: `Robots.txt rules on ${host} restrict bot crawling on specific service routes.`, action: "Review and refine robots.txt disallow rules to ensure valuable landing pages remain indexable." },
        { severity: "high", title: "Unminified JavaScript Assets", detail: "Multiple JS script bundles exceed recommended transfer size on mobile viewports.", action: "Enable Brotli/Gzip compression, bundle minification, and code splitting." },
        { severity: "medium", title: "Canonical Tag Mismatches", detail: "Canonical tags on query-parameter URLs point back to non-canonical query strings.", action: "Set self-referencing canonical tags on all indexable listing pages." },
      ],
    },
    contentEeat: {
      score: contentScore,
      eeatMatrix: [
        { factor: "Experience", score: rand(65, 88), signals: "Case studies & real-world project portfolio present", gaps: "Add author bio snippets to articles with hands-on notes." },
        { factor: "Expertise", score: rand(70, 92), signals: "Clear domain terminology and structured technical depth", gaps: "Include verified author credentials and industry certifications." },
        { factor: "Authoritativeness", score: rand(58, 82), signals: "Indexed by search engines & niche industry directories", gaps: "Increase editorial mentions and peer citations." },
        { factor: "Trustworthiness", score: rand(78, 96), signals: "HTTPS enabled, clear TOS, privacy policy & contact details", gaps: "Implement Organization schema and customer review widgets." },
      ],
      findings: [
        { severity: "high", title: "Missing Author Bylines & Person Schema", detail: `Informational articles on ${host} lack explicit author bios and structured Person metadata.`, action: "Add visible author info boxes with social verification and Person schema." },
        { severity: "medium", title: "Heading Hierarchy Progression", detail: "Subpages skip H2 headers and jump directly to H3 or bold paragraph text.", action: "Ensure logical H1 -> H2 -> H3 heading structure across all templates." },
      ],
    },
    onPageKeywords: {
      score: Math.round((contentScore + technicalScore) / 2),
      findings: [
        { severity: "high", title: "Target Keyword Placement in Title Tags", detail: `Primary landing pages on ${host} do not position core target keywords near the beginning of HTML titles.`, action: "Front-load primary target keywords in page <title> elements." },
      ],
      currentKeywords: [
        { keyword: `${niche ?? "seo"} platform`, relevance: "High", status: "Ranking #4" },
        { keyword: `best ${niche ?? "audit"} tool`, relevance: "High", status: "Ranking #8" },
        { keyword: `${host} official`, relevance: "Brand", status: "Ranking #1" },
      ],
      targetKeywords: [
        { keyword: `ai ${niche ?? "seo"} intelligence software`, searchVolume: 8100, difficulty: "medium", priority: "quick win" },
        { keyword: `automated ${niche ?? "website"} audit tool`, searchVolume: 5400, difficulty: "low", priority: "high" },
        { keyword: `enterprise ${niche ?? "growth"} analytics`, searchVolume: 3900, difficulty: "high", priority: "medium" },
      ],
    },
    backlinkProfile: {
      score: authorityScore,
      metrics: [
        { label: "Domain Rating", value: `${rand(38, 76)}`, status: authorityScore >= 60 ? "good" : "warning" },
        { label: "Referring Domains", value: `${rand(110, 1420)}`, status: "good" },
        { label: "Total Backlinks", value: `${rand(1200, 18400).toLocaleString()}`, status: "good" },
        { label: "Spam Score", value: `${rand(1, 3)}%`, status: "good" },
      ],
      topReferringDomains: [
        { domain: "techcrunch.com", links: rand(4, 12), spamScore: 1, assessment: "healthy" },
        { domain: "github.com", links: rand(14, 38), spamScore: 0, assessment: "healthy" },
        { domain: "medium.com", links: rand(6, 18), spamScore: 2, assessment: "healthy" },
      ],
      strategy: `Accelerate domain authority for ${host} via high-DR contextual digital PR, original research publications, and niche editorial partnerships.`,
      findings: [
        { severity: "medium", title: "Anchor Text Concentration", detail: "Branded anchor text accounts for over 65% of incoming links.", action: "Diversify anchor profile with keyword-descriptive editorial links." },
      ],
    },
    aiVisibility: {
      score: rand(74, 94),
      aiCrawlerAccess: [
        { crawler: "GPTBot", owner: "OpenAI", purpose: "ChatGPT search & model grounding", status: "Allowed" },
        { crawler: "ClaudeBot", owner: "Anthropic", purpose: "Claude AI search & citations", status: "Allowed" },
        { crawler: "PerplexityBot", owner: "Perplexity AI", purpose: "Real-time generative search answers", status: "Allowed" },
        { crawler: "GoogleOther / Google-Extended", owner: "Google", purpose: "Gemini & AI Overviews indexing", status: "Allowed" },
      ],
      findings: [
        { severity: "pass", title: "AI Bots Unblocked", detail: `Robots.txt on ${host} permits major AI crawlers (GPTBot, ClaudeBot, PerplexityBot).`, action: "Maintain open AI crawler access to capture AI search traffic." },
        { severity: "medium", title: "Direct Answer Formatting", detail: "Page content lacks explicit bulleted summary blocks optimized for LLM answer extraction.", action: "Add 40-50 word TL;DR summary blocks at the top of long-form articles." },
      ],
    },
    schemaStructuredData: {
      score: rand(65, 88),
      recommendedSchemas: [
        { type: "Organization", page: "Homepage", priority: "high", impact: "Establishes Knowledge Graph entity and logo validation." },
        { type: "WebSite + SearchAction", page: "Homepage", priority: "high", impact: "Enables sitelinks search box in Google SERPs." },
        { type: "FAQPage", page: "Pricing / Features", priority: "medium", impact: "Triggers rich accordion snippets in search results." },
        { type: "SoftwareApplication", page: "Product pages", priority: "medium", impact: "Displays star ratings and pricing details in SERP cards." },
      ],
      findings: [
        { severity: "high", title: "Incomplete Organization Schema", detail: "Current Organization schema is missing logo URL, sameAs social links, and contactPoint.", action: "Update JSON-LD markup with complete entity properties." },
      ],
    },
    scoreBreakdown: [
      { category: "Technical Health", weight: "25%", score: technicalScore, status: technicalScore >= 70 ? "Good" : "Needs Work" },
      { category: "Content & E-E-A-T", weight: "25%", score: contentScore, status: contentScore >= 70 ? "Good" : "Needs Work" },
      { category: "Authority & Links", weight: "20%", score: authorityScore, status: authorityScore >= 70 ? "Good" : "Needs Work" },
      { category: "User Experience (UX)", weight: "15%", score: uxScore, status: uxScore >= 70 ? "Good" : "Needs Work" },
      { category: "AI & Search Visibility", weight: "15%", score: rand(75, 92), status: "Good" },
    ],
    actionPlan: {
      phase1: {
        title: "Phase 1: Immediate Critical Fixes (Days 1–14)",
        items: [
          { action: `Audit robots.txt disallow directives on ${host} to restore page crawlability.`, impact: "High Impact" },
          { action: "Resolve 404 internal link errors and canonical tag mismatches.", impact: "High Impact" },
        ],
      },
      phase2: {
        title: "Phase 2: On-Page & Schema Optimization (Days 15–30)",
        items: [
          { action: "Deploy Organization, SoftwareApplication, and FAQPage JSON-LD schemas.", impact: "High Impact" },
          { action: "Optimize HTML title tags and H1 headers for core target keywords.", impact: "High Impact" },
        ],
      },
      phase3: {
        title: "Phase 3: Content Depth & E-E-A-T Expansion (Days 31–60)",
        items: [
          { action: "Add verified author credentials, Person schema, and experience disclosures.", impact: "Medium Impact" },
          { action: "Publish 5 high-intent landing pages for targeted commercial search queries.", impact: "High Impact" },
        ],
      },
      phase4: {
        title: "Phase 4: Authority & AI Visibility Building (Days 61–90)",
        items: [
          { action: "Execute digital PR outreach to earn high-DR contextual referring domain links.", impact: "High Impact" },
          { action: "Format key pages with concise summary blocks for AI Overview citation capture.", impact: "Medium Impact" },
        ],
      },
    },
    quickWins: [
      { action: `Update HTML <title> tag on ${host} home page to include primary target keyword.`, timeEstimate: "15 mins", impact: "High" },
      { action: "Submit updated XML sitemap to Google Search Console and Bing Webmaster Tools.", timeEstimate: "10 mins", impact: "High" },
      { action: "Add alt text to key image assets missing descriptive labels.", timeEstimate: "20 mins", impact: "Medium" },
    ],
    projectedOutcomes: `By completing the 4-phase optimization plan, ${host} is projected to see a 35%–60% increase in organic search traffic within 90 days, improved SERP positions for target keywords, and higher frequency of citations in Google AI Overviews and ChatGPT search.`,
  };

  return {
    report: {
      overallScore,
      technicalScore,
      contentScore,
      authorityScore,
      uxScore,
      summary,
      recommendations,
      reportJson: richReport,
    },
    crawledPages,
    keywordRankings: selectedKeywords,
    serpCompetitors: selectedCompetitors,
  };
}

export function getAuditStageDescriptions() {
  return [
    { stage: "queued", description: "Audit job created and waiting to start" },
    { stage: "crawling", description: "Scanning pages, metadata, links, and technical signals" },
    { stage: "enriching", description: "Fetching keywords, competitors, and SERP intelligence" },
    { stage: "analyzing", description: "Scoring technical, content, authority, and UX factors" },
    { stage: "reporting", description: "AI is writing findings, actions, and structured output" },
  ];
}

export function mapStoredAuditToRecord(audit: StoredAudit) {
  return {
    id: audit.id,
    url: audit.url,
    market: audit.market,
    language: audit.language,
    niche: audit.niche ?? undefined,
    notes: audit.notes ?? undefined,
    websiteId: audit.userId,
    websiteUrl: audit.url,
    websiteHost: audit.websiteHost,
    projectId: audit.userId,
    projectName: "Default Project",
    status: audit.status,
    startedAt: audit.startedAt,
    completedAt: audit.completedAt,
    createdAt: audit.createdAt,
    updatedAt: audit.updatedAt,
    crawledPages: audit.crawledPages.map(p => ({ ...p, auditJobId: audit.id, createdAt: audit.createdAt, updatedAt: audit.updatedAt })),
    keywordRankings: audit.keywordRankings.map(k => ({ ...k, auditJobId: audit.id, createdAt: audit.createdAt, updatedAt: audit.updatedAt })),
    serpCompetitors: audit.serpCompetitors.map(c => ({ ...c, auditJobId: audit.id, createdAt: audit.createdAt, updatedAt: audit.updatedAt })),
    report: audit.report ? {
      id: `rpt_${audit.id}`,
      auditJobId: audit.id,
      overallScore: audit.report.overallScore,
      technicalScore: audit.report.technicalScore,
      contentScore: audit.report.contentScore,
      authorityScore: audit.report.authorityScore,
      uxScore: audit.report.uxScore,
      summary: audit.report.summary,
      recommendations: audit.report.recommendations,
      reportJson: audit.report.reportJson ?? {},
      filePath: null,
      createdAt: audit.completedAt ?? audit.updatedAt,
      updatedAt: audit.completedAt ?? audit.updatedAt,
    } : null,
  };
}
