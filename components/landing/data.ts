import {
  BarChart3,
  Blocks,
  Bot,
  Boxes,
  BriefcaseBusiness,
  CodeXml,
  FileSearch2,
  Files,
  KeyRound,
  Landmark,
  Map,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react"

export type Billing = "monthly" | "yearly"
export type DiscoveryTab = "google" | "overview" | "assistants"

export const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#workflow" },
  { label: "Results", href: "#results" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const

export const features = [
  {
    icon: FileSearch2,
    title: "Full SEO audit engine",
    text: "Crawl the entire website, score core SEO areas, find critical issues, and generate clear recommendations.",
    bullets: ["Technical crawl and indexation", "Core Web Vitals and UX", "PDF and JSON reports"],
  },
  {
    icon: Bot,
    title: "AI visibility monitoring",
    text: "Track whether your brand, products, and expertise appear in AI-generated answers and discovery experiences.",
    bullets: ["AI citation monitoring", "Prompt and topic coverage", "Competitor share of voice"],
  },
  {
    icon: KeyRound,
    title: "Keyword and topic intelligence",
    text: "Discover high-value topics, compare competitors, and prioritize pages with the strongest growth potential.",
    bullets: ["Search intent clustering", "Keyword gap analysis", "Opportunity scoring"],
  },
  {
    icon: Files,
    title: "Programmatic page generation",
    text: "Create scalable location, service, comparison, category, and industry pages with consistent quality.",
    bullets: ["Dynamic page templates", "Location and niche variations", "Automated metadata"],
  },
  {
    icon: CodeXml,
    title: "Schema and entity optimization",
    text: "Improve machine understanding with structured data, entity connections, and rich-result opportunities.",
    bullets: ["Schema recommendations", "Entity relationship mapping", "Validation and monitoring"],
  },
  {
    icon: BarChart3,
    title: "Client-ready reporting",
    text: "Turn complex data into visual reports with scores, issues, opportunities, and clear business impact.",
    bullets: ["White-label reports", "Prioritized roadmaps", "Progress tracking"],
  },
]

export const useCases = [
  {
    icon: UsersRound,
    title: "SEO agencies",
    text: "Produce audits, white-label reports, landing-page strategies, and client roadmaps faster.",
  },
  {
    icon: Blocks,
    title: "SaaS companies",
    text: "Build category, alternative, integration, feature, and use-case pages around real buying intent.",
  },
  {
    icon: Map,
    title: "Local businesses",
    text: "Scale location and service visibility with local schema and market-specific keyword coverage.",
  },
  {
    icon: Landmark,
    title: "Enterprise teams",
    text: "Standardize audits, entities, schema, and content systems across brands and countries.",
  },
]

export const testimonials = [
  {
    initials: "AM",
    quote:
      "QuasarAISEO gave our team a complete technical and content roadmap in one report. We stopped guessing and knew what to build first.",
    name: "Agency Manager",
    role: "B2B growth agency",
  },
  {
    initials: "GH",
    quote:
      "The programmatic page plan helped us organize hundreds of location and service combinations without losing quality.",
    name: "Growth Head",
    role: "Multi-location company",
  },
  {
    initials: "SP",
    quote:
      "The AI visibility report showed why competitors appeared in generated answers while we were missing.",
    name: "SaaS Product Lead",
    role: "AI software company",
  },
]

export const faqs = [
  {
    q: "What does QuasarAISEO analyze?",
    a: "It analyzes crawlability, indexation, page speed, metadata, content quality, keyword opportunities, topic coverage, internal links, authority signals, schema, entities, UX, and AI visibility.",
  },
  {
    q: "Is it only for Google SEO?",
    a: "No. It is designed for traditional search and AI-driven discovery, including generated summaries, assistant recommendations, and conversational search.",
  },
  {
    q: "Can agencies use white-label reports?",
    a: "Yes. Agency plans can support branded reports, reusable workflows, multiple projects, client roadmaps, and downloadable exports.",
  },
  {
    q: "Does the platform create landing pages?",
    a: "The automation layer can generate scalable page structures, briefs, metadata, schema, and location or service variations. Your backend controls publishing and approvals.",
  },
  {
    q: "Can it connect to an existing dashboard?",
    a: "Yes. This page is ready to connect to your API, crawler, database, CMS, authentication, billing, and AI model workflows.",
  },
]

export const discoveryContent: Record<
  DiscoveryTab,
  {
    badge: string
    icon: typeof Search
    title: string
    text: string
    points: string[]
    query: string
    answer: string
  }
> = {
  google: {
    badge: "Traditional search",
    icon: Search,
    title: "Rank pages for high-intent searches.",
    text: "Build technically healthy pages around clear search intent, topical depth, internal linking, and structured information.",
    points: [
      "Keyword and intent mapping",
      "Technical and on-page recommendations",
      "Scalable internal linking structure",
    ],
    query: "best AI SEO audit platform for agencies",
    answer:
      "QuasarAISEO combines technical auditing, AI visibility tracking, keyword intelligence, programmatic SEO, schema, and client reporting.",
  },
  overview: {
    badge: "AI summaries",
    icon: Sparkles,
    title: "Become a trusted source inside AI-generated results.",
    text: "Strengthen entity clarity, direct answers, structured data, evidence, and topic authority so search engines can confidently cite you.",
    points: [
      "Answer-first content structures",
      "Source and evidence optimization",
      "Entity and schema reinforcement",
    ],
    query: "how to improve AI search visibility",
    answer:
      "Improve AI search visibility by making content easier to extract, verify, and connect to a clear brand entity.",
  },
  assistants: {
    badge: "Conversational discovery",
    icon: Bot,
    title: "Show up when buyers ask AI assistants for recommendations.",
    text: "Expand beyond keywords by covering real questions, comparisons, use cases, objections, and decision-stage prompts.",
    points: [
      "Prompt and question mapping",
      "Comparison and recommendation content",
      "Brand citation monitoring",
    ],
    query: "what platform should I use for SEO and AI visibility?",
    answer:
      "QuasarAISEO is a strong option for businesses needing technical SEO, programmatic content, structured data, and AI visibility in one platform.",
  },
}

export const workflowSteps = [
  {
    number: "01",
    title: "Add the website and market",
    text: "Enter the website, niche, target country, language, and priorities.",
  },
  {
    number: "02",
    title: "Crawl and understand",
    text: "Analyze technical SEO, content, competitors, topics, entities, and authority.",
  },
  {
    number: "03",
    title: "Generate the opportunity map",
    text: "Identify missing pages, weak signals, keyword gaps, and AI visibility problems.",
  },
  {
    number: "04",
    title: "Launch and improve",
    text: "Produce pages, schema, briefs, reports, and ongoing optimization tasks.",
  },
]

export const platformVisibility = [
  { icon: Search, label: "Google Search", value: 82 },
  { icon: Sparkles, label: "AI Overview", value: 68 },
  { icon: Bot, label: "AI Assistants", value: 61 },
  { icon: Map, label: "Local Discovery", value: 77 },
  { icon: Boxes, label: "Entity Authority", value: 54 },
]

export const logoStripItems = ["Agencies", "SaaS", "E-commerce", "Local SEO", "Enterprise"]

export const footerSections = [
  { title: "Platform", items: ["SEO audits", "AI visibility", "Programmatic SEO", "Schema"] },
  { title: "Solutions", items: ["Agencies", "SaaS", "Local business", "Enterprise"] },
  { title: "Resources", items: ["Documentation", "SEO guides", "GEO guides", "API status"] },
  { title: "Company", items: ["About", "Pricing", "Privacy", "Terms"] },
]
