"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Blocks,
  Bot,
  Boxes,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  CircleUserRound,
  CodeXml,
  CreditCard,
  FileSearch2,
  Files,
  Globe2,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Linkedin,
  LockKeyhole,
  Map,
  MapPinned,
  Menu,
  MessageCircle,
  Network,
  Orbit,
  PlayCircle,
  Quote,
  Radar,
  Rocket,
  ScanSearch,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Twitter,
  UsersRound,
  Workflow,
  X,
  Youtube,
} from "lucide-react";

type Billing = "monthly" | "yearly";
type DiscoveryTab = "google" | "overview" | "assistants";

const features = [
  {
    icon: FileSearch2,
    title: "Full SEO audit engine",
    text: "Crawl the entire website, score core SEO areas, find critical issues, and generate clear recommendations.",
    bullets: ["Technical crawl and indexation", "Core Web Vitals and UX", "PDF and JSON reports"],
  },
  {
    icon: Radar,
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
];

const useCases = [
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
];

const testimonials = [
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
];

const faqs = [
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
];

const discoveryContent: Record<
  DiscoveryTab,
  {
    badge: string;
    icon: typeof Search;
    title: string;
    text: string;
    points: string[];
    query: string;
    answer: string;
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
};

export default function QuasarAISEOLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState<Billing>("monthly");
  const [discoveryTab, setDiscoveryTab] = useState<DiscoveryTab>("google");
  const [openFaq, setOpenFaq] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const discovery = discoveryContent[discoveryTab];
  const DiscoveryIcon = discovery.icon;

  const prices = useMemo(
    () => ({
      starter: billing === "monthly" ? 49 : 39,
      growth: billing === "monthly" ? 149 : 119,
    }),
    [billing]
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  return (
    <>
      <header className="siteHeader">
        <div className="container nav">
          <Link href="#top" className="brand">
            <span className="brandMark"><Orbit size={19} /></span>
            <span>Quasar<span>AISEO</span></span>
          </Link>

          <nav className={`navLinks ${menuOpen ? "open" : ""}`}>
            {[
              ["Platform", "#platform"],
              ["How it works", "#workflow"],
              ["Results", "#results"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}
            <Link className="mobileCta" href="/create_audit_report">
              Create free audit <ArrowUpRight size={15} />
            </Link>
          </nav>

          <div className="navActions">
            <Link className="button ghost" href="#pricing">Pricing</Link>
            <Link className="button dark" href="/create_audit_report">
              Create free audit <ArrowUpRight size={15} />
            </Link>
          </div>

          <button
            className="menuButton"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container heroGrid">
            <div>
              <div className="heroBadge"><span /> SEO + GEO automation platform</div>
              <h1>Win visibility across search and <em>AI answers.</em></h1>
              <p className="heroText">
                QuasarAISEO turns one website into a scalable growth system with technical
                audits, programmatic landing pages, semantic content, schema, keyword
                intelligence, and AI search visibility optimization.
              </p>
              <div className="heroActions">
                <Link className="button primary large" href="/create_audit_report">
                  Create your free audit <ArrowUpRight size={18} />
                </Link>
                <Link className="button outline large" href="#platform">
                  Explore the platform <PlayCircle size={18} />
                </Link>
              </div>
              <div className="heroNote">
                <ShieldCheck size={16} /> No credit card required. Public website data only.
              </div>
              <div className="trustRow">
                <span className="trustLabel">Built for modern discovery</span>
                <span><Search size={15} /> Google Search</span>
                <span><Sparkles size={15} /> AI Overview</span>
                <span><Bot size={15} /> AI assistants</span>
                <span><Network size={15} /> Entity visibility</span>
              </div>
            </div>

            <div className="dashboardShell">
              <div className="floatingCard topFloat">
                <small>AI visibility</small>
                <strong>84%</strong>
                <span><Activity size={13} /> +18 points this month</span>
              </div>
              <div className="floatingCard bottomFloat">
                <small>New opportunities</small>
                <strong>126</strong>
                <span><CheckCircle2 size={13} /> 31 high-value keywords</span>
              </div>

              <div className="dashboard">
                <div className="dashboardTop">
                  <div className="windowDots"><i /><i /><i /></div>
                  <div className="dashboardUrl">
                    <LockKeyhole size={13} /> app.quasaraiseo.com/dashboard
                  </div>
                  <div className="dashboardUser"><CircleUserRound size={15} /></div>
                </div>

                <div className="dashboardBody">
                  <aside className="miniSidebar">
                    <div className="miniBrand"><Orbit size={14} /> QuasarAISEO</div>
                    {[
                      [LayoutDashboard, "Overview", true],
                      [Radar, "AI visibility"],
                      [FileSearch2, "Site audits"],
                      [KeyRound, "Keywords"],
                      [Files, "Content"],
                      [CodeXml, "Schema"],
                      [Settings, "Settings"],
                    ].map(([Icon, label, active], index) => {
                      const MenuIcon = Icon as typeof LayoutDashboard;
                      return (
                        <div key={index} className={`miniMenu ${active ? "active" : ""}`}>
                          <MenuIcon size={14} /> {String(label)}
                        </div>
                      );
                    })}
                  </aside>

                  <div className="dashboardMain">
                    <div className="dashboardHeading">
                      <div>
                        <h3>Visibility overview</h3>
                        <p>Search and AI discovery performance</p>
                      </div>
                      <span className="livePill"><i /> Tracking live</span>
                    </div>

                    <div className="dashboardStats">
                      {[
                        ["Organic visibility", "74.8%", "↑ 12.4% this month"],
                        ["AI citations", "286", "↑ 42 new mentions"],
                        ["Keywords tracked", "1,842", "156 in top 10"],
                      ].map(([label, value, note]) => (
                        <div className="miniStat" key={label}>
                          <small>{label}</small>
                          <strong>{value}</strong>
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>

                    <div className="chartCard">
                      <div className="chartTop">
                        <div><strong>Search visibility growth</strong><span>Organic + AI discovery</span></div>
                        <small>Last 90 days</small>
                      </div>
                      <svg viewBox="0 0 500 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" stopOpacity=".32" />
                            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,125 C55,119 78,112 118,104 C163,95 174,91 212,80 C250,70 272,76 309,59 C347,42 376,49 409,34 C447,16 467,23 500,10 L500,150 L0,150 Z"
                          fill="url(#fill)"
                        />
                        <path
                          d="M0,125 C55,119 78,112 118,104 C163,95 174,91 212,80 C250,70 272,76 309,59 C347,42 376,49 409,34 C447,16 467,23 500,10"
                          fill="none"
                          stroke="#34d399"
                          strokeWidth="3"
                        />
                      </svg>
                    </div>

                    <div className="dashboardBottom">
                      <div className="miniPanel">
                        <strong>Top opportunities</strong>
                        {[
                          ["ai seo audit", "8.1K", "+11"],
                          ["geo optimization", "5.4K", "+8"],
                          ["seo report tool", "4.2K", "+14"],
                        ].map((row) => (
                          <div className="miniRow" key={row[0]}>
                            <b>{row[0]}</b><span>{row[1]}</span><em>{row[2]}</em>
                          </div>
                        ))}
                      </div>
                      <div className="miniPanel scorePanel">
                        <div className="scoreRing">78</div>
                        <div>
                          <strong>Site health</strong>
                          <p>Technical 86</p>
                          <p>Content 72</p>
                          <p>Authority 58</p>
                          <p>UX 91</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="logoStrip">
          <div className="container logoStripInner">
            <p>Designed for agencies, SaaS teams, local businesses, and growth-focused brands.</p>
            <div className="logoGrid">
              {["Agencies", "SaaS", "E-commerce", "Local SEO", "Enterprise"].map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container problemGrid">
            <div>
              <div className="eyebrow"><Activity size={15} /> The visibility problem</div>
              <h2 className="sectionTitle">Search is no longer just ten blue links.</h2>
              <p className="sectionText">
                Buyers now discover brands through search engines, AI answer boxes,
                assistants, comparison pages, directories, and generated recommendations.
              </p>
              <div className="problemList">
                {[
                  ["Important pages stay invisible.", "Technical issues and weak structure stop search engines from understanding value."],
                  ["AI engines do not cite the brand.", "Missing entities, schema, authority, and clear answers reduce discoverability."],
                  ["Content production does not scale.", "Teams lose time creating pages manually without a connected topic strategy."],
                ].map(([title, text]) => (
                  <div className="problemItem" key={title}>
                    <span><X size={15} /></span>
                    <p><strong>{title}</strong><br />{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="visibilityPanel">
              <div className="visibilityHeader">
                <div><h3>Multi-platform visibility</h3><p>Discoverability across modern search surfaces</p></div>
                <div className="visibilityScore"><strong>74</strong><span>Overall</span></div>
              </div>
              <div className="platformList">
                {[
                  [Search, "Google Search", 82],
                  [Sparkles, "AI Overview", 68],
                  [Bot, "AI Assistants", 61],
                  [MapPinned, "Local Discovery", 77],
                  [Network, "Entity Authority", 54],
                ].map(([Icon, label, value]) => {
                  const PlatformIcon = Icon as typeof Search;
                  const numericValue = Number(value);
                  return (
                    <div className="platformRow" key={String(label)}>
                      <div className="platformName"><span><PlatformIcon size={15} /></span>{String(label)}</div>
                      <div className="platformBar"><i style={{ width: `${numericValue}%` }} /></div>
                      <strong>{numericValue}%</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="section darkSection" id="platform">
          <div className="container">
            <div className="splitHeading">
              <div>
                <div className="eyebrow light"><Boxes size={15} /> One connected platform</div>
                <h2 className="sectionTitle lightText">Everything needed to build search and AI authority.</h2>
              </div>
              <p>
                QuasarAISEO connects research, technical optimization, content, structured
                data, reporting, and scalable landing-page production in one workflow.
              </p>
            </div>

            <div className="featureGrid">
              {features.map(({ icon: Icon, title, text, bullets }) => (
                <article className="featureCard" key={title}>
                  <span className="featureIcon"><Icon size={22} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <div className="featureBullets">
                    {bullets.map((bullet) => (
                      <span key={bullet}><Check size={14} /> {bullet}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="workflow">
          <div className="container workflowGrid">
            <div>
              <div className="eyebrow"><Workflow size={15} /> Automated workflow</div>
              <h2 className="sectionTitle">From one website URL to a complete growth system.</h2>
              <p className="sectionText">
                Replace disconnected SEO tools and manual research with one repeatable,
                intelligent process.
              </p>

              <div className="workflowSteps">
                {[
                  ["01", "Add the website and market", "Enter the website, niche, target country, language, and priorities."],
                  ["02", "Crawl and understand", "Analyze technical SEO, content, competitors, topics, entities, and authority."],
                  ["03", "Generate the opportunity map", "Identify missing pages, weak signals, keyword gaps, and AI visibility problems."],
                  ["04", "Launch and improve", "Produce pages, schema, briefs, reports, and ongoing optimization tasks."],
                ].map(([number, title, text]) => (
                  <div className="workflowStep" key={number}>
                    <span>{number}</span>
                    <div><h3>{title}</h3><p>{text}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="workflowCanvas">
              <div className="node node1">
                <span><Globe2 size={18} /></span>
                <h4>Website and market input</h4>
                <p>URL, niche, location, language, goals, and priority services.</p>
              </div>
              <div className="node node2">
                <span><ScanSearch size={18} /></span>
                <h4>SEO crawl engine</h4>
                <p>Technical health, structure, metadata, internal links, and UX.</p>
              </div>
              <div className="node node3">
                <span><BrainCircuit size={18} /></span>
                <h4>AI market intelligence</h4>
                <p>Keywords, competitors, entities, prompts, topics, and opportunities.</p>
              </div>
              <div className="node node4">
                <span><Rocket size={18} /></span>
                <h4>Growth system generated</h4>
                <p>Audit report, prioritized roadmap, pages, schema, and content opportunities.</p>
              </div>
              <svg className="flowLines" viewBox="0 0 600 520" preserveAspectRatio="none">
                <path d="M300 120 V190 M300 190 H145 M300 190 H455 M145 190 V280 M455 190 V280 M145 360 H455 M300 360 V420" />
              </svg>
            </div>
          </div>
        </section>

        <section className="section discoverySection">
          <div className="container">
            <div className="eyebrow"><Sparkles size={15} /> AI discovery optimization</div>
            <h2 className="sectionTitle">Build content that search engines and AI systems can understand.</h2>
            <p className="sectionText">
              Optimize the same brand knowledge for traditional results, AI summaries,
              assistant answers, and entity-based discovery.
            </p>

            <div className="tabShell">
              <div className="tabs">
                {[
                  ["google", "Google Search"],
                  ["overview", "AI Overview"],
                  ["assistants", "AI Assistants"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={discoveryTab === value ? "active" : ""}
                    onClick={() => setDiscoveryTab(value as DiscoveryTab)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="tabPanel">
                <div>
                  <span className="tabBadge"><DiscoveryIcon size={15} /> {discovery.badge}</span>
                  <h3>{discovery.title}</h3>
                  <p>{discovery.text}</p>
                  <div className="tabPoints">
                    {discovery.points.map((point) => (
                      <span key={point}><CheckCircle2 size={15} /> {point}</span>
                    ))}
                  </div>
                </div>
                <div className="answerPreview">
                  <div className="queryBar"><Search size={15} /> {discovery.query}</div>
                  <div className="answerBox">
                    <span><Orbit size={15} /> QuasarAISEO</span>
                    <h4>{discovery.answer}</h4>
                    <p>
                      Build technically clear, structured, authoritative content that can be
                      ranked, summarized, and cited across discovery platforms.
                    </p>
                    <div><i>Audit platform</i><i>Programmatic SEO</i><i>Entity signals</i></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="results">
          <div className="container">
            <div className="eyebrow"><BarChart3 size={15} /> Measurable growth</div>
            <h2 className="sectionTitle">See what is improving, what is missing, and where to act next.</h2>
            <p className="sectionText">
              Every report connects visibility metrics to practical actions, so teams know
              exactly what should be fixed, created, optimized, or monitored.
            </p>

            <div className="resultsGrid">
              <article className="resultCard darkResult">
                <small>Search visibility growth</small>
                <strong>+38<span>%</span></strong>
                <p>Combined organic and AI discovery score</p>
                {[
                  ["Technical health", 88],
                  ["Content coverage", 76],
                  ["AI citations", 69],
                  ["Entity authority", 63],
                ].map(([label, value]) => (
                  <div className="metricRow" key={String(label)}>
                    <span>{String(label)}</span>
                    <div><i style={{ width: `${Number(value)}%` }} /></div>
                    <b>{Number(value)}</b>
                  </div>
                ))}
              </article>

              <article className="resultCard">
                <small>New ranking opportunities</small>
                <strong>126</strong>
                <p>31 high-intent opportunities prioritized for launch</p>
                {[
                  ["Service pages", 76, 42],
                  ["Location pages", 64, 36],
                  ["Comparisons", 48, 27],
                  ["Guides", 38, 21],
                ].map(([label, width, value]) => (
                  <div className="metricRow" key={String(label)}>
                    <span>{String(label)}</span>
                    <div><i style={{ width: `${Number(width)}%` }} /></div>
                    <b>{Number(value)}</b>
                  </div>
                ))}
              </article>
            </div>
          </div>
        </section>

        <section className="section compactSection">
          <div className="container">
            <div className="eyebrow"><BriefcaseBusiness size={15} /> Built for your workflow</div>
            <h2 className="sectionTitle">One platform, multiple growth teams.</h2>
            <div className="useCaseGrid">
              {useCases.map(({ icon: Icon, title, text }) => (
                <article key={title}>
                  <span><Icon size={21} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <Link href="#pricing">Explore solution <ArrowRight size={14} /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section pricingSection" id="pricing">
          <div className="container">
            <div className="pricingHeading">
              <div>
                <div className="eyebrow"><CreditCard size={15} /> Simple pricing</div>
                <h2 className="sectionTitle">Start with an audit. Scale into a complete growth engine.</h2>
              </div>
              <div className="billingToggle">
                <button className={billing === "monthly" ? "active" : ""} onClick={() => setBilling("monthly")}>Monthly</button>
                <button className={billing === "yearly" ? "active" : ""} onClick={() => setBilling("yearly")}>Yearly -20%</button>
              </div>
            </div>

            <div className="pricingGrid">
              <article className="priceCard">
                <small>Starter</small>
                <h3>Audit</h3>
                <p>For businesses that need clear SEO and AI visibility direction.</p>
                <strong>${prices.starter}<span>/month</span></strong>
                <Link className="button outline full" href="/create_audit_report">Start auditing</Link>
                <ul>
                  <li><Check size={15} /> 5 website audits per month</li>
                  <li><Check size={15} /> SEO and AI visibility scores</li>
                  <li><Check size={15} /> Keyword opportunity reports</li>
                  <li><Check size={15} /> PDF and JSON exports</li>
                </ul>
              </article>

              <article className="priceCard featured">
                <em>Most popular</em>
                <small>Growth</small>
                <h3>Automation</h3>
                <p>For agencies and growing companies that need scalable content and visibility.</p>
                <strong>${prices.growth}<span>/month</span></strong>
                <Link className="button primary full" href="/create_audit_report">Start growing</Link>
                <ul>
                  <li><Check size={15} /> Everything in Audit</li>
                  <li><Check size={15} /> 25 projects and recurring audits</li>
                  <li><Check size={15} /> Programmatic page generation</li>
                  <li><Check size={15} /> AI citation tracking</li>
                  <li><Check size={15} /> White-label reports</li>
                </ul>
              </article>

              <article className="priceCard">
                <small>Enterprise</small>
                <h3>Scale</h3>
                <p>For multi-brand, multi-country, and high-volume operations.</p>
                <strong>Custom</strong>
                <button className="button dark full" onClick={() => showToast("Connect this button to Calendly, your CRM, or a sales form.")}>
                  Contact sales <MessageCircle size={15} />
                </button>
                <ul>
                  <li><Check size={15} /> Unlimited project architecture</li>
                  <li><Check size={15} /> Custom automation workflows</li>
                  <li><Check size={15} /> API and data integrations</li>
                  <li><Check size={15} /> Team roles and governance</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="section compactSection">
          <div className="container">
            <div className="eyebrow"><Quote size={15} /> Customer outcomes</div>
            <h2 className="sectionTitle">Clearer strategy. Faster execution. Better visibility.</h2>
            <div className="testimonialGrid">
              {testimonials.map((item) => (
                <article key={item.name}>
                  <span className="quoteIcon"><Quote size={18} /></span>
                  <p>{item.quote}</p>
                  <footer>
                    <div>{item.initials}</div>
                    <span><strong>{item.name}</strong><small>{item.role}</small></span>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="container faqGrid">
            <div>
              <div className="eyebrow"><CircleHelp size={15} /> Frequently asked</div>
              <h2 className="sectionTitle">Everything you need to know before starting.</h2>
              <p className="sectionText">
                Use QuasarAISEO as a standalone audit platform or as the SEO intelligence
                layer inside a larger marketing workflow.
              </p>
              <Link className="button dark large" href="/create_audit_report">
                Create free audit <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="faqList">
              {faqs.map((item, index) => (
                <article className={openFaq === index ? "open" : ""} key={item.q}>
                  <button onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    {item.q} <ChevronDown size={18} />
                  </button>
                  <div><p>{item.a}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ctaSection">
          <div className="container ctaBox">
            <div>
              <div className="eyebrow light"><Sparkles size={15} /> Start with one URL</div>
              <h2>See what is stopping your website from winning more visibility.</h2>
              <p>Create your first SEO and AI visibility audit and turn it into a prioritized action plan.</p>
            </div>
            <div className="ctaButtons">
              <Link className="button primary large" href="/create_audit_report">Create free audit <ArrowUpRight size={16} /></Link>
              <button className="button lightButton large" onClick={() => showToast("Connect this button to your booking page.")}>
                Book a demo
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footerGrid">
          <div>
            <Link href="#top" className="brand">
              <span className="brandMark"><Orbit size={19} /></span>
              <span>Quasar<span>AISEO</span></span>
            </Link>
            <p>A connected SEO and GEO automation platform for modern search and AI discovery.</p>
          </div>

          {[
            ["Platform", ["SEO audits", "AI visibility", "Programmatic SEO", "Schema"]],
            ["Solutions", ["Agencies", "SaaS", "Local business", "Enterprise"]],
            ["Resources", ["Documentation", "SEO guides", "GEO guides", "API status"]],
            ["Company", ["About", "Pricing", "Privacy", "Terms"]],
          ].map(([title, items]) => (
            <div key={String(title)}>
              <h4>{String(title)}</h4>
              {(items as string[]).map((item) => <Link href="#" key={item}>{item}</Link>)}
            </div>
          ))}
        </div>
        <div className="container footerBottom">
          <span>© 2026 QuasarAISEO. All rights reserved.</span>
          <div>
            <a href="#"><Linkedin size={15} /></a>
            <a href="#"><Twitter size={15} /></a>
            <a href="#"><Youtube size={15} /></a>
          </div>
        </div>
      </footer>

      {toast && (
        <div className="toast">
          <CheckCircle2 size={20} />
          <div><strong>Action ready</strong><p>{toast}</p></div>
        </div>
      )}

      <style jsx global>{`
        :root {
          --emerald-50:#ecfdf5;
          --emerald-100:#d1fae5;
          --emerald-300:#6ee7b7;
          --emerald-400:#34d399;
          --emerald-500:#10b981;
          --emerald-600:#059669;
          --emerald-700:#047857;
          --amber-50:#fffbeb;
          --amber-100:#fef3c7;
          --amber-500:#f59e0b;
          --slate-50:#f8fafc;
          --slate-100:#f1f5f9;
          --slate-200:#e2e8f0;
          --slate-300:#cbd5e1;
          --slate-400:#94a3b8;
          --slate-500:#64748b;
          --slate-600:#475569;
          --slate-700:#334155;
          --slate-800:#1e293b;
          --slate-900:#0f172a;
          --slate-950:#020617;
          --shadow:0 28px 80px rgba(15,23,42,.11);
          --max:1240px;
        }
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{
          margin:0;
          color:var(--slate-900);
          background:
            radial-gradient(circle at 7% 6%,rgba(16,185,129,.14),transparent 28%),
            radial-gradient(circle at 94% 10%,rgba(245,158,11,.11),transparent 23%),
            linear-gradient(180deg,#fbfefd 0%,#f8fafc 42%,#fff 100%);
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
          -webkit-font-smoothing:antialiased;
          overflow-x:hidden;
        }
        a{text-decoration:none;color:inherit}
        button,input,select,textarea{font:inherit}
        button{cursor:pointer}
        .container{width:min(calc(100% - 32px),var(--max));margin:0 auto}
        .siteHeader{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.84);backdrop-filter:blur(18px);border-bottom:1px solid rgba(226,232,240,.8)}
        .nav{height:72px;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .brand{display:inline-flex;align-items:center;gap:11px;font-size:19px;font-weight:900;letter-spacing:-.035em}
        .brand>span:last-child span{color:var(--emerald-600)}
        .brandMark{width:39px;height:39px;border-radius:13px;display:grid;place-items:center;color:#fff;background:linear-gradient(145deg,var(--emerald-400),var(--emerald-700));box-shadow:0 12px 25px rgba(16,185,129,.28)}
        .navLinks{display:flex;align-items:center;gap:4px}
        .navLinks>a{padding:9px 12px;border-radius:999px;color:var(--slate-600);font-size:14px;font-weight:650}
        .navLinks>a:hover{background:var(--slate-100);color:var(--slate-950)}
        .mobileCta{display:none!important}
        .navActions{display:flex;align-items:center;gap:9px}
        .button{min-height:44px;padding:0 15px;border:0;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:800;transition:.2s ease}
        .button:hover{transform:translateY(-1px)}
        .button.ghost{background:transparent;color:var(--slate-700)}
        .button.dark{background:var(--slate-950);color:#fff;box-shadow:0 10px 24px rgba(2,6,23,.18)}
        .button.primary{color:#022c22;background:linear-gradient(135deg,var(--emerald-300),var(--emerald-500));box-shadow:0 16px 35px rgba(16,185,129,.25)}
        .button.outline{background:#fff;border:1px solid var(--slate-200);color:var(--slate-700)}
        .button.large{min-height:52px;padding:0 19px;border-radius:15px;font-size:14px}
        .button.full{width:100%;margin-top:22px}
        .lightButton{background:#fff;color:var(--slate-900)}
        .menuButton{display:none;width:42px;height:42px;border:1px solid var(--slate-200);border-radius:13px;background:#fff;place-items:center}
        .hero{padding:90px 0 84px}
        .heroGrid{display:grid;grid-template-columns:minmax(0,.95fr) minmax(520px,1.05fr);gap:54px;align-items:center}
        .heroBadge,.eyebrow{display:inline-flex;align-items:center;gap:8px;color:var(--emerald-700);font-size:12px;font-weight:850;letter-spacing:.16em;text-transform:uppercase}
        .heroBadge{padding:8px 12px;border:1px solid rgba(16,185,129,.22);border-radius:999px;background:rgba(236,253,245,.86)}
        .heroBadge span{width:8px;height:8px;border-radius:50%;background:var(--emerald-500);box-shadow:0 0 0 5px rgba(16,185,129,.12)}
        .hero h1{margin:24px 0 0;max-width:760px;font-size:clamp(52px,7vw,86px);line-height:.95;letter-spacing:-.067em;font-weight:900}
        .hero h1 em{font-style:normal;background:linear-gradient(105deg,var(--emerald-600),var(--emerald-500),var(--amber-500));-webkit-background-clip:text;color:transparent}
        .heroText,.sectionText{max-width:720px;margin:24px 0 0;color:var(--slate-600);font-size:18px;line-height:1.75}
        .heroActions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
        .heroNote{display:flex;align-items:center;gap:8px;margin-top:18px;color:var(--slate-500);font-size:12px}
        .heroNote svg,.trustRow svg{color:var(--emerald-600)}
        .trustRow{display:flex;flex-wrap:wrap;align-items:center;gap:16px 22px;margin-top:30px;padding-top:26px;border-top:1px solid var(--slate-200)}
        .trustRow span{display:inline-flex;align-items:center;gap:7px;color:var(--slate-600);font-size:12px;font-weight:750}
        .trustLabel{color:var(--slate-400)!important;font-size:11px!important;letter-spacing:.15em;text-transform:uppercase}
        .dashboardShell{position:relative;padding:14px;border:1px solid rgba(226,232,240,.93);border-radius:30px;background:rgba(255,255,255,.78);box-shadow:var(--shadow)}
        .dashboard{overflow:hidden;border-radius:24px;color:#fff;background:radial-gradient(circle at 90% 0,rgba(16,185,129,.2),transparent 28%),linear-gradient(145deg,#0f172a,#020617);box-shadow:0 36px 120px rgba(2,6,23,.35)}
        .dashboardTop{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(148,163,184,.13)}
        .windowDots{display:flex;gap:6px}.windowDots i{width:8px;height:8px;border-radius:50%;background:#fb7185}.windowDots i:nth-child(2){background:#fbbf24}.windowDots i:nth-child(3){background:#34d399}
        .dashboardUrl{display:flex;align-items:center;gap:7px;padding:7px 11px;border-radius:999px;color:var(--slate-400);background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.13);font-size:10px}
        .dashboardUser{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;color:var(--emerald-300);background:rgba(16,185,129,.1)}
        .dashboardBody{display:grid;grid-template-columns:175px 1fr;min-height:530px}
        .miniSidebar{padding:20px 14px;border-right:1px solid rgba(148,163,184,.12)}
        .miniBrand{display:flex;align-items:center;gap:8px;padding:0 7px 18px;font-size:12px;font-weight:850}
        .miniMenu{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:10px;color:var(--slate-500);font-size:10px;font-weight:750}
        .miniMenu.active{color:var(--emerald-300);background:rgba(16,185,129,.1)}
        .dashboardMain{padding:22px}
        .dashboardHeading{display:flex;justify-content:space-between;gap:14px}.dashboardHeading h3{margin:0;font-size:18px}.dashboardHeading p{margin:4px 0 0;color:var(--slate-500);font-size:10px}
        .livePill{display:flex;align-items:center;gap:6px;padding:7px 9px;border-radius:999px;color:var(--emerald-300);background:rgba(16,185,129,.09);font-size:9px}.livePill i{width:6px;height:6px;border-radius:50%;background:var(--emerald-400)}
        .dashboardStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}
        .miniStat{padding:12px;border-radius:14px;background:rgba(15,23,42,.7);border:1px solid rgba(148,163,184,.12)}
        .miniStat small{display:block;color:var(--slate-500);font-size:8px;text-transform:uppercase}.miniStat strong{display:block;margin-top:10px;font-size:23px}.miniStat span{display:block;margin-top:8px;color:var(--emerald-300);font-size:8px}
        .chartCard,.miniPanel{margin-top:12px;padding:15px;border-radius:16px;background:rgba(15,23,42,.66);border:1px solid rgba(148,163,184,.12)}
        .chartTop{display:flex;justify-content:space-between}.chartTop strong,.chartTop span{display:block}.chartTop strong{font-size:11px}.chartTop span,.chartTop small{color:var(--slate-500);font-size:8px}
        .chartCard svg{width:100%;height:155px;margin-top:12px}
        .dashboardBottom{display:grid;grid-template-columns:1.1fr .9fr;gap:10px}.miniPanel{min-height:140px}
        .miniRow{display:grid;grid-template-columns:1fr 34px 34px;gap:8px;margin-top:12px;color:var(--slate-400);font-size:8px}.miniRow b{color:var(--slate-200)}.miniRow em{color:var(--emerald-300);font-style:normal}
        .scorePanel{display:grid;grid-template-columns:82px 1fr;gap:12px;align-items:center}.scoreRing{width:82px;height:82px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at center,#0f172a 58%,transparent 59%),conic-gradient(var(--emerald-400) 0 78%,rgba(148,163,184,.12) 78% 100%);font-size:20px;font-weight:850}.scorePanel p{margin:5px 0;color:var(--slate-500);font-size:8px}
        .floatingCard{position:absolute;z-index:2;width:185px;padding:14px;border:1px solid rgba(226,232,240,.9);border-radius:16px;background:rgba(255,255,255,.94);box-shadow:0 18px 50px rgba(15,23,42,.16)}
        .topFloat{top:12%;right:-7%}.bottomFloat{left:-7%;bottom:9%;width:200px}.floatingCard small{display:block;color:var(--slate-400);font-size:9px;text-transform:uppercase}.floatingCard strong{display:block;margin-top:7px;font-size:22px}.floatingCard span{display:flex;align-items:center;gap:5px;margin-top:6px;color:var(--emerald-700);font-size:9px}
        .logoStrip{padding:28px 0;border-block:1px solid var(--slate-200);background:rgba(255,255,255,.62)}
        .logoStripInner{display:grid;grid-template-columns:220px 1fr;gap:28px;align-items:center}.logoStripInner>p{color:var(--slate-500);font-size:12px;line-height:1.6}.logoGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:18px}.logoGrid div{display:grid;place-items:center;min-height:58px;border:1px solid var(--slate-200);border-radius:14px;background:#fff;color:var(--slate-500);font-size:12px;font-weight:850}
        .section{padding:104px 0}.compactSection{padding:76px 0}
        .sectionTitle{max-width:850px;margin:14px 0 0;font-size:clamp(34px,4.5vw,60px);line-height:1.02;letter-spacing:-.052em}.lightText{color:#fff}.eyebrow.light{color:var(--emerald-300)}
        .problemGrid,.workflowGrid,.faqGrid{display:grid;grid-template-columns:.88fr 1.12fr;gap:54px;align-items:center}
        .problemList{display:grid;gap:13px;margin-top:28px}.problemItem{display:flex;gap:12px}.problemItem>span{width:32px;height:32px;border-radius:11px;display:grid;place-items:center;color:#e11d48;background:#fff1f2}.problemItem p{margin:0;color:var(--slate-600);font-size:14px;line-height:1.6}
        .visibilityPanel{padding:28px;border:1px solid var(--slate-200);border-radius:28px;background:#fff;box-shadow:var(--shadow)}.visibilityHeader{display:flex;justify-content:space-between;gap:14px}.visibilityHeader h3{margin:0;font-size:18px}.visibilityHeader p{margin:4px 0 0;color:var(--slate-500);font-size:12px}.visibilityScore{min-width:88px;padding:11px;border-radius:14px;text-align:center;color:var(--emerald-700);background:var(--emerald-50)}.visibilityScore strong{display:block;font-size:24px}.visibilityScore span{font-size:9px;text-transform:uppercase}
        .platformList{display:grid;gap:12px;margin-top:24px}.platformRow{display:grid;grid-template-columns:150px 1fr 45px;gap:14px;align-items:center;padding:13px 14px;border:1px solid var(--slate-100);border-radius:14px;background:var(--slate-50)}.platformName{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:800}.platformName>span{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#fff;border:1px solid var(--slate-200)}.platformBar{height:8px;border-radius:999px;background:var(--slate-100);overflow:hidden}.platformBar i{display:block;height:100%;background:linear-gradient(90deg,var(--emerald-400),var(--emerald-600))}
        .darkSection{position:relative;color:#fff;background:radial-gradient(circle at 10% 0,rgba(16,185,129,.16),transparent 30%),linear-gradient(145deg,#0b1220,#020617)}
        .splitHeading{display:flex;align-items:end;justify-content:space-between;gap:30px}.splitHeading>p{max-width:480px;margin:0;color:var(--slate-400);font-size:15px;line-height:1.75;text-align:right}
        .featureGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:34px}.featureCard{min-height:280px;padding:24px;border:1px solid rgba(148,163,184,.13);border-radius:22px;background:rgba(15,23,42,.72)}.featureIcon{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;color:var(--emerald-300);background:rgba(16,185,129,.1)}.featureCard h3{margin:20px 0 0;font-size:18px}.featureCard p{margin:10px 0 0;color:var(--slate-400);font-size:13px;line-height:1.7}.featureBullets{display:grid;gap:9px;margin-top:18px}.featureBullets span{display:flex;align-items:center;gap:8px;color:var(--slate-300);font-size:11px}.featureBullets svg{color:var(--emerald-300)}
        .workflowSteps{display:grid;gap:12px;margin-top:30px}.workflowStep{display:grid;grid-template-columns:48px 1fr;gap:14px;padding:16px;border-radius:16px}.workflowStep>span{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;color:var(--emerald-700);background:var(--emerald-50);font-size:12px;font-weight:900}.workflowStep h3{margin:0;font-size:15px}.workflowStep p{margin:5px 0 0;color:var(--slate-500);font-size:12px;line-height:1.65}
        .workflowCanvas{position:relative;min-height:560px;padding:26px;border:1px solid var(--slate-200);border-radius:30px;background:#fff;box-shadow:var(--shadow)}.node{position:absolute;z-index:2;width:180px;padding:15px;border:1px solid var(--slate-200);border-radius:17px;background:#fff;box-shadow:0 14px 34px rgba(15,23,42,.1)}.node>span{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;color:var(--emerald-700);background:var(--emerald-50)}.node h4{margin:11px 0 0;font-size:13px}.node p{margin:5px 0 0;color:var(--slate-500);font-size:10px;line-height:1.55}.node1{top:38px;left:50%;transform:translateX(-50%)}.node2{top:206px;left:42px}.node3{top:206px;right:42px}.node4{bottom:36px;left:50%;transform:translateX(-50%);width:230px;color:#fff;background:linear-gradient(145deg,#0f172a,#020617)}.node4 p{color:var(--slate-400)}.flowLines{position:absolute;inset:0;width:100%;height:100%;z-index:1}.flowLines path{fill:none;stroke:rgba(16,185,129,.45);stroke-width:2}
        .discoverySection{background:var(--slate-50);border-block:1px solid var(--slate-200)}.tabShell{margin-top:34px;padding:14px;border:1px solid var(--slate-200);border-radius:28px;background:#fff;box-shadow:var(--shadow)}.tabs{display:flex;gap:7px;padding:6px;border-radius:16px;background:var(--slate-100)}.tabs button{flex:1;min-height:46px;border:1px solid transparent;border-radius:12px;background:transparent;color:var(--slate-500);font-size:12px;font-weight:800}.tabs button.active{background:#fff;color:var(--slate-900);border-color:var(--slate-200);box-shadow:0 8px 18px rgba(15,23,42,.08)}.tabPanel{display:grid;grid-template-columns:.9fr 1.1fr;gap:42px;align-items:center;padding:28px 22px 22px}.tabBadge{display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border-radius:999px;color:var(--emerald-700);background:var(--emerald-50);font-size:11px;font-weight:800}.tabPanel h3{margin:18px 0 0;font-size:30px;letter-spacing:-.04em}.tabPanel p{margin:14px 0 0;color:var(--slate-500);font-size:14px;line-height:1.75}.tabPoints{display:grid;gap:10px;margin-top:20px}.tabPoints span{display:flex;align-items:center;gap:9px;color:var(--slate-700);font-size:12px;font-weight:700}.tabPoints svg{color:var(--emerald-600)}
        .answerPreview{padding:20px;border:1px solid var(--slate-200);border-radius:20px;background:var(--slate-50)}.queryBar{display:flex;align-items:center;gap:9px;padding:12px 14px;border:1px solid var(--slate-200);border-radius:13px;background:#fff;color:var(--slate-500);font-size:11px}.answerBox{margin-top:14px;padding:17px;border:1px solid var(--slate-200);border-radius:16px;background:#fff}.answerBox>span{display:flex;align-items:center;gap:8px;color:var(--slate-500);font-size:10px;font-weight:800}.answerBox h4{margin:14px 0 0;font-size:13px;line-height:1.55}.answerBox p{font-size:10px}.answerBox>div{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.answerBox i{padding:6px 8px;border-radius:999px;background:var(--slate-100);color:var(--slate-600);font-size:8px;font-style:normal}
        .resultsGrid{display:grid;grid-template-columns:1.15fr .85fr;gap:22px;margin-top:34px}.resultCard{padding:28px;border:1px solid var(--slate-200);border-radius:24px;background:#fff;box-shadow:0 14px 42px rgba(15,23,42,.07)}.darkResult{color:#fff;background:linear-gradient(145deg,#0f172a,#020617);border-color:rgba(148,163,184,.13)}.resultCard>small{color:var(--slate-500);font-size:12px}.darkResult>small{color:var(--slate-400)}.resultCard>strong{display:block;margin-top:26px;font-size:54px;letter-spacing:-.06em}.resultCard>strong span{font-size:16px;color:var(--slate-400)}.resultCard>p{margin:6px 0 22px;color:var(--slate-500);font-size:12px}.darkResult>p{color:var(--slate-400)}.metricRow{display:grid;grid-template-columns:120px 1fr 40px;gap:10px;align-items:center;margin-top:12px;color:var(--slate-500);font-size:10px}.metricRow>div{height:8px;border-radius:999px;background:var(--slate-100);overflow:hidden}.darkResult .metricRow>div{background:rgba(148,163,184,.11)}.metricRow i{display:block;height:100%;background:linear-gradient(90deg,var(--emerald-400),var(--emerald-600))}.metricRow b{text-align:right;color:var(--slate-800)}.darkResult .metricRow b{color:var(--slate-200)}
        .useCaseGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:34px}.useCaseGrid article{min-height:250px;padding:23px;border:1px solid var(--slate-200);border-radius:20px;background:#fff}.useCaseGrid article>span{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;color:var(--emerald-700);background:var(--emerald-50)}.useCaseGrid h3{margin:18px 0 0}.useCaseGrid p{margin:9px 0 0;color:var(--slate-500);font-size:12px;line-height:1.7}.useCaseGrid a{display:flex;align-items:center;gap:7px;margin-top:18px;font-size:11px;font-weight:850}
        .pricingSection{background:var(--slate-50);border-block:1px solid var(--slate-200)}.pricingHeading{display:flex;justify-content:space-between;align-items:end;gap:24px}.billingToggle{display:flex;padding:5px;border:1px solid var(--slate-200);border-radius:999px;background:#fff}.billingToggle button{min-width:92px;height:36px;border:0;border-radius:999px;background:transparent;color:var(--slate-500);font-size:11px;font-weight:850}.billingToggle button.active{background:var(--slate-950);color:#fff}.pricingGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:34px}.priceCard{position:relative;padding:27px;border:1px solid var(--slate-200);border-radius:24px;background:#fff;box-shadow:0 14px 42px rgba(15,23,42,.07)}.priceCard.featured{color:#fff;background:linear-gradient(145deg,#0f172a,#020617);transform:translateY(-8px)}.priceCard>em{position:absolute;top:18px;right:18px;padding:7px 9px;border-radius:999px;background:var(--emerald-300);color:#022c22;font-size:9px;font-style:normal;font-weight:900;text-transform:uppercase}.priceCard>small{color:var(--slate-500);font-size:11px;text-transform:uppercase;letter-spacing:.15em}.featured>small{color:var(--emerald-300)}.priceCard h3{margin:9px 0 0;font-size:24px}.priceCard p{min-height:48px;margin:8px 0 0;color:var(--slate-500);font-size:12px;line-height:1.65}.featured p{color:var(--slate-400)}.priceCard>strong{display:block;margin-top:22px;font-size:48px;letter-spacing:-.06em}.priceCard>strong span{font-size:11px;color:var(--slate-500)}.priceCard ul{display:grid;gap:11px;margin:24px 0 0;padding:23px 0 0;border-top:1px solid var(--slate-200);list-style:none}.featured ul{border-color:rgba(148,163,184,.14)}.priceCard li{display:flex;gap:9px;color:var(--slate-600);font-size:11px}.featured li{color:var(--slate-300)}.priceCard li svg{color:var(--emerald-600)}
        .testimonialGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:34px}.testimonialGrid article{padding:24px;border:1px solid var(--slate-200);border-radius:21px;background:#fff;box-shadow:0 14px 42px rgba(15,23,42,.07)}.quoteIcon{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:var(--emerald-700);background:var(--emerald-50)}.testimonialGrid article>p{margin:18px 0 0;color:var(--slate-700);font-size:14px;line-height:1.75}.testimonialGrid footer{display:flex;gap:11px;align-items:center;margin-top:22px;padding-top:18px;border-top:1px solid var(--slate-100)}.testimonialGrid footer>div{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;color:#fff;background:var(--slate-900);font-size:12px;font-weight:850}.testimonialGrid footer strong,.testimonialGrid footer small{display:block}.testimonialGrid footer small{margin-top:3px;color:var(--slate-500)}
        .faqGrid{grid-template-columns:.7fr 1.3fr;align-items:start}.faqList{display:grid;gap:11px}.faqList article{border:1px solid var(--slate-200);border-radius:16px;background:#fff;overflow:hidden}.faqList button{width:100%;padding:17px 18px;border:0;display:flex;justify-content:space-between;gap:16px;background:#fff;text-align:left;font-size:13px;font-weight:800}.faqList article>div{max-height:0;overflow:hidden;transition:max-height .25s ease}.faqList article.open>div{max-height:180px}.faqList article.open button svg{transform:rotate(180deg)}.faqList p{padding:0 18px 18px;margin:0;color:var(--slate-500);font-size:12px;line-height:1.75}
        .ctaSection{padding:0 0 76px}.ctaBox{padding:42px;border-radius:30px;color:#fff;background:radial-gradient(circle at 88% 0,rgba(52,211,153,.22),transparent 28%),linear-gradient(145deg,#0f172a,#020617);box-shadow:0 36px 120px rgba(2,6,23,.35);display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center}.ctaBox h2{max-width:760px;margin:14px 0 0;font-size:clamp(36px,5vw,62px);line-height:1;letter-spacing:-.055em}.ctaBox p{max-width:650px;color:var(--slate-400);font-size:14px;line-height:1.7}.ctaButtons{display:flex;flex-direction:column;gap:10px;min-width:190px}
        .footer{padding:62px 0 32px;background:#fff}.footerGrid{display:grid;grid-template-columns:1.35fr repeat(4,.65fr);gap:34px}.footerGrid>div:first-child p{max-width:340px;color:var(--slate-500);font-size:12px;line-height:1.75}.footerGrid h4{font-size:11px;text-transform:uppercase;letter-spacing:.13em}.footerGrid>div:not(:first-child){display:flex;flex-direction:column;gap:10px}.footerGrid>div:not(:first-child) a{color:var(--slate-500);font-size:12px}.footerBottom{display:flex;justify-content:space-between;gap:20px;margin-top:48px;padding-top:24px;border-top:1px solid var(--slate-200);color:var(--slate-500);font-size:11px}.footerBottom>div{display:flex;gap:8px}.footerBottom a{width:36px;height:36px;border:1px solid var(--slate-200);border-radius:11px;display:grid;place-items:center}
        .toast{position:fixed;right:24px;bottom:24px;z-index:100;width:min(380px,calc(100% - 32px));padding:15px 16px;border:1px solid var(--slate-200);border-radius:15px;display:flex;gap:12px;background:rgba(255,255,255,.96);box-shadow:0 24px 65px rgba(15,23,42,.18)}.toast>svg{color:var(--emerald-600)}.toast strong{font-size:13px}.toast p{margin:3px 0 0;color:var(--slate-500);font-size:11px}
        @media(max-width:1120px){.heroGrid,.problemGrid,.workflowGrid,.faqGrid{grid-template-columns:1fr}.featureGrid,.pricingGrid,.testimonialGrid{grid-template-columns:repeat(2,1fr)}.featureCard:last-child,.testimonialGrid article:last-child{grid-column:span 2}.useCaseGrid{grid-template-columns:repeat(2,1fr)}.footerGrid{grid-template-columns:1.2fr repeat(2,.8fr)}}
        @media(max-width:900px){.navLinks,.navActions{display:none}.navLinks.open{display:flex;position:absolute;top:64px;left:16px;right:16px;padding:12px;border:1px solid var(--slate-200);border-radius:18px;flex-direction:column;background:#fff;box-shadow:var(--shadow)}.mobileCta{display:flex!important;align-items:center;justify-content:center;background:var(--slate-950)!important;color:#fff!important}.menuButton{display:grid}.logoStripInner{grid-template-columns:1fr}.logoGrid{grid-template-columns:repeat(3,1fr)}.splitHeading,.pricingHeading{align-items:flex-start;flex-direction:column}.splitHeading>p{text-align:left;max-width:720px}.tabPanel,.resultsGrid{grid-template-columns:1fr}.ctaBox{grid-template-columns:1fr}.ctaButtons{flex-direction:row}}
        @media(max-width:720px){.section{padding:78px 0}.hero{padding-top:62px}.hero h1{font-size:50px}.dashboardBody{grid-template-columns:1fr}.miniSidebar{display:none}.floatingCard{display:none}.dashboardBottom{grid-template-columns:1fr}.featureGrid,.pricingGrid,.testimonialGrid,.useCaseGrid{grid-template-columns:1fr}.featureCard:last-child,.testimonialGrid article:last-child{grid-column:auto}.priceCard.featured{transform:none}.platformRow{grid-template-columns:1fr}.workflowCanvas{min-height:650px}.node{left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:calc(100% - 50px)}.node1{top:28px}.node2{top:180px}.node3{top:332px}.node4{bottom:26px}.flowLines{display:none}.footerGrid{grid-template-columns:1fr 1fr}.footerGrid>div:first-child{grid-column:1/-1}.footerBottom{align-items:flex-start;flex-direction:column}}
        @media(max-width:520px){.container{width:min(calc(100% - 22px),var(--max))}.hero h1{font-size:44px}.heroActions,.ctaButtons{flex-direction:column}.heroActions .button,.ctaButtons .button{width:100%}.dashboardStats{grid-template-columns:1fr}.dashboardUrl{display:none}.logoGrid{grid-template-columns:repeat(2,1fr)}.tabs{display:grid}.tabPanel{padding:20px 8px 8px}.footerGrid{grid-template-columns:1fr}.footerGrid>div:first-child{grid-column:auto}}
      `}</style>
    </>
  );
}