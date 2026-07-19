export type Severity = "critical" | "warning" | "info"

export const issueData: Record<
  Severity,
  { message: string; subtext: string; category: string }[]
> = {
  critical: [
    {
      message: "Important service pages are blocked by robots.txt",
      subtext: "7 URLs cannot be indexed by search engines.",
      category: "Indexability",
    },
    {
      message: "Multiple pages return server errors",
      subtext: "5xx responses were detected during the crawl.",
      category: "Technical",
    },
  ],
  warning: [
    {
      message: "Meta descriptions are missing on 14 pages",
      subtext: "Search snippets may have weak click-through rates.",
      category: "On-page",
    },
    {
      message: "Largest Contentful Paint exceeds 2.5 seconds",
      subtext: "Main visual content loads slowly on mobile devices.",
      category: "Performance",
    },
    {
      message: "Three high-value topics have no dedicated landing page",
      subtext: "Competitors currently own these search intents.",
      category: "Content gap",
    },
  ],
  info: [
    {
      message: "Organization schema can be expanded",
      subtext: "Add richer entity, social, and contact properties.",
      category: "Schema",
    },
    {
      message: "Internal anchor text can be more descriptive",
      subtext: "18 links use generic text such as learn more.",
      category: "Internal links",
    },
    {
      message: "Two images could use next-generation formats",
      subtext: "WebP or AVIF may reduce page transfer size.",
      category: "Images",
    },
  ],
}

export const keywordRows: [string, string, string, number, string, boolean][] = [
  ["ai seo audit tool", "8,100", "$6.40", 72, "18 → 7", true],
  ["seo report generator", "6,600", "$5.10", 64, "24 → 9", true],
  ["technical seo audit service", "3,900", "$8.20", 59, "31 → 12", false],
  ["website seo score checker", "2,900", "$3.75", 48, "42 → 16", false],
  ["ai visibility report", "1,700", "$4.60", 37, "Not ranked → 20", true],
  ["generative engine optimization audit", "950", "$7.15", 31, "Not ranked → 14", false],
]

export const actions = [
  {
    title: "Remove indexation blocks from revenue-driving service pages",
    description: "Update robots.txt rules, validate canonical tags, and resubmit affected URLs.",
    timeline: "This week",
    impact: "High impact",
  },
  {
    title: "Fix unstable server responses and crawl failures",
    description: "Review logs, hosting limits, middleware, redirects, and backend exceptions.",
    timeline: "This week",
    impact: "High impact",
  },
  {
    title: "Launch three high-intent SEO landing pages",
    description: "Build dedicated pages for audit tools, reports, and AI visibility services.",
    timeline: "2–4 weeks",
    impact: "High impact",
  },
  {
    title: "Improve Core Web Vitals on mobile templates",
    description: "Optimize hero media, loading priority, scripts, fonts, and rendering paths.",
    timeline: "30 days",
    impact: "Medium impact",
  },
  {
    title: "Build authority with niche-relevant referring domains",
    description: "Use original reports, partner content, directories, and digital PR campaigns.",
    timeline: "60–90 days",
    impact: "Medium impact",
  },
]

export const countries = [
  "Bangladesh",
  "Netherlands",
  "United States",
  "United Kingdom",
  "Germany",
  "Australia",
  "Canada",
  "India",
]

export const languages = ["English", "Dutch", "Bangla", "German", "Spanish", "French"]

export const auditModules = [
  ["full_crawl", "Full crawl"],
  ["keyword_gap", "Keyword gap"],
  ["pdf_output", "PDF output"],
  ["competitor_scan", "Competitor scan"],
] as const

export const scoreCards: [string, number, string, string][] = [
  ["Overall score", 78, "Good", "overall"],
  ["Technical", 86, "Strong", ""],
  ["Content", 72, "Moderate", "yellow"],
  ["Authority", 58, "Needs work", "orange"],
  ["UX", 91, "Excellent", ""],
]

export const coverageTechnical = [
  "Crawlability and indexation",
  "Core Web Vitals and speed",
  "Structured data and schema",
]

export const coverageContent = [
  "On-page content quality",
  "Keyword and topic gaps",
  "Authority and backlink signals",
]

export const workflowPreview: [string, string, string, string][] = [
  ["01", "Crawl website", "~30 sec", "Discover pages, metadata, links, and technical signals."],
  ["02", "Analyze market", "~2 min", "Score content, competitors, and keyword opportunities."],
  ["03", "Generate report", "~45 sec", "Produce findings, actions, PDF, and structured JSON."],
]

export const stats = [
  { label: "Audits generated", value: "1,284", note: "12.8% versus last month" },
  { label: "Pages analyzed", value: "48.6K", note: "Live crawl coverage" },
  { label: "Average score lift", value: "+23", note: "After recommendations" },
]
