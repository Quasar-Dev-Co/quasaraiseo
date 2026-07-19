"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bot,
  Braces,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleCheckBig,
  Eye,
  FileBarChart2,
  FileDown,
  FileSearch,
  Gauge,
  GaugeCircle,
  Globe2,
  Languages,
  Layers3,
  ListChecks,
  MapPinned,
  Menu,
  Orbit,
  Route,
  SearchCode,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  TriangleAlert,
  Workflow,
  X,
} from "lucide-react";

type Severity = "critical" | "warning" | "info";

const issueData: Record<
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
};

const keywordRows = [
  ["ai seo audit tool", "8,100", "$6.40", 72, "18 → 7", true],
  ["seo report generator", "6,600", "$5.10", 64, "24 → 9", true],
  ["technical seo audit service", "3,900", "$8.20", 59, "31 → 12", false],
  ["website seo score checker", "2,900", "$3.75", 48, "42 → 16", false],
  ["ai visibility report", "1,700", "$4.60", 37, "Not ranked → 20", true],
  ["generative engine optimization audit", "950", "$7.15", 31, "Not ranked → 14", false],
];

const actions = [
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
];

const countries = [
  "Bangladesh",
  "Netherlands",
  "United States",
  "United Kingdom",
  "Germany",
  "Australia",
  "Canada",
  "India",
];

const languages = ["English", "Dutch", "Bangla", "German", "Spanish", "French"];

export default function CreateAuditReportPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [severity, setSeverity] = useState<Severity>("critical");
  const [features, setFeatures] = useState([
    "full_crawl",
    "keyword_gap",
    "pdf_output",
  ]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedIssues = useMemo(() => issueData[severity], [severity]);

  const toggleFeature = (feature: string) => {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature]
    );
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const payload = {
      websiteUrl: form.get("websiteUrl"),
      businessNiche: form.get("businessNiche"),
      targetCountry: form.get("targetCountry"),
      primaryLanguage: form.get("primaryLanguage"),
      auditFocus: form.get("auditFocus"),
      modules: features,
    };

    setLoading(true);

    window.setTimeout(() => {
      setLoading(false);
      console.log("Backend-ready audit payload:", payload);
      showToast("Audit payload prepared. Open the browser console to inspect it.");
      document.getElementById("report-preview")?.scrollIntoView({ behavior: "smooth" });
    }, 1100);
  };

  const downloadJson = () => {
    const data = {
      report: {
        website: "https://example.com",
        status: "complete",
        generatedBy: "QuasarAISEO",
        generatedAt: new Date().toISOString(),
      },
      scores: { overall: 78, technical: 86, content: 72, authority: 58, ux: 91 },
      issues: issueData,
      keywords: keywordRows,
      actions,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "quasar-ai-seo-audit-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Sample JSON audit report downloaded.");
  };

  return (
    <>
      <header className="siteHeader">
        <div className="container nav">
          <Link href="/" className="brand">
            <span className="brandMark"><Orbit size={19} /></span>
            <span>Quasar<span>AISEO</span></span>
          </Link>

          <nav className={`navLinks ${menuOpen ? "open" : ""}`}>
            <Link href="/">Dashboard</Link>
            <Link href="#audit-form">Audits</Link>
            <Link href="#report-preview">Reports</Link>
            <Link href="#">Settings</Link>
            <Link href="#audit-form" className="navCta">New audit</Link>
          </nav>

          <button className="menuButton" onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <div className="container">
          <section className="hero">
            <div>
              <div className="heroBadge"><span /> QuasarAISEO Audit Studio</div>
              <h1>Create a full SEO audit report from <em>one website URL.</em></h1>
              <p>
                Crawl technical performance, uncover keyword gaps, evaluate content quality,
                and turn every finding into a clear, prioritized growth plan.
              </p>
            </div>

            <aside className="routeCard">
              <div>
                <strong>Audit workspace</strong>
                <span><i /> System ready</span>
              </div>
              <code><Route size={15} /> /create_audit_report</code>
              <p>Ready for your audit endpoint, job status updates, report storage, and downloads.</p>
            </aside>
          </section>

          <section className="stats">
            {[
              [FileSearch, "Audits generated", "1,284", "12.8% versus last month"],
              [Activity, "Pages analyzed", "48.6K", "Live crawl coverage"],
              [Gauge, "Average score lift", "+23", "After recommendations"],
            ].map(([Icon, label, value, note]) => {
              const StatIcon = Icon as typeof FileSearch;
              return (
                <article key={String(label)}>
                  <div><small>{String(label)}</small><span><StatIcon size={18} /></span></div>
                  <strong>{String(value)}</strong>
                  <p>{String(note)}</p>
                </article>
              );
            })}
          </section>

          <section className="workspace">
            <article className="auditCard" id="audit-form">
              <span className="botOrb"><Bot size={21} /></span>
              <div className="eyebrow light"><Sparkles size={15} /> Start a new audit</div>
              <h2>Build a complete, client-ready SEO intelligence report.</h2>
              <p className="auditIntro">
                Add the website and market details below. QuasarAISEO will prepare the
                technical, content, authority, UX, and keyword analysis structure.
              </p>
              <code className="routePill"><TerminalSquare size={14} /> /create_audit_report</code>

              <form onSubmit={handleSubmit}>
                <div className="formGrid">
                  <Field
                    label="Website URL"
                    name="websiteUrl"
                    placeholder="https://example.com"
                    type="url"
                    icon={Globe2}
                    help="Enter the complete website URL, including https://"
                  />
                  <Field
                    label="Business niche"
                    name="businessNiche"
                    placeholder="e.g. SaaS, LegalTech, Local services"
                    icon={BriefcaseBusiness}
                    help="Used to compare the site with niche-specific competitors."
                  />

                  <SelectField
                    label="Target country"
                    name="targetCountry"
                    icon={MapPinned}
                    options={countries}
                    placeholder="Select target market"
                    help="Determines local SERP, language, and competition context."
                  />

                  <SelectField
                    label="Primary language"
                    name="primaryLanguage"
                    icon={Languages}
                    options={languages}
                    placeholder="Select report language"
                    help="Controls report writing and keyword interpretation."
                  />

                  <label className="textAreaGroup">
                    <span>Audit focus <em>Optional</em></span>
                    <textarea
                      name="auditFocus"
                      placeholder="Describe specific goals, priority services, target keywords, competitors, or pages that need extra attention..."
                    />
                    <small>Add any business context that should shape the recommendations.</small>
                  </label>
                </div>

                <p className="moduleLabel">Audit modules</p>
                <div className="chips">
                  {[
                    ["full_crawl", "Full crawl"],
                    ["keyword_gap", "Keyword gap"],
                    ["pdf_output", "PDF output"],
                    ["competitor_scan", "Competitor scan"],
                  ].map(([value, label]) => {
                    const active = features.includes(value);
                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => toggleFeature(value)}
                        className={active ? "active" : ""}
                      >
                        {active ? <Check size={14} /> : <span>+</span>}
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="formFooter">
                  <span><ShieldCheck size={15} /> Public website data only</span>
                  <button className="submitButton" disabled={loading}>
                    {loading ? "Preparing report..." : "Create audit report"}
                    {!loading && <ArrowUpRight size={18} />}
                  </button>
                </div>
              </form>
            </article>

            <aside className="sidebar">
              <SideCard
                icon={Layers3}
                title="Audit coverage"
                subtitle="Everything included in the report"
              >
                <p className="groupLabel">Technical</p>
                {[
                  "Crawlability and indexation",
                  "Core Web Vitals and speed",
                  "Structured data and schema",
                ].map((item) => (
                  <div className="checkRow" key={item}><CheckCircle2 size={15} /> {item}</div>
                ))}
                <p className="groupLabel second">Content & strategy</p>
                {[
                  "On-page content quality",
                  "Keyword and topic gaps",
                  "Authority and backlink signals",
                ].map((item) => (
                  <div className="checkRow" key={item}><CheckCircle2 size={15} /> {item}</div>
                ))}
              </SideCard>

              <SideCard
                icon={Workflow}
                title="Workflow preview"
                subtitle="From URL to ready-to-use report"
              >
                <div className="workflowList">
                  {[
                    ["01", "Crawl website", "~30 sec", "Discover pages, metadata, links, and technical signals."],
                    ["02", "Analyze market", "~2 min", "Score content, competitors, and keyword opportunities."],
                    ["03", "Generate report", "~45 sec", "Produce findings, actions, PDF, and structured JSON."],
                  ].map(([number, title, duration, text]) => (
                    <div className="workflowItem" key={number}>
                      <span>{number}</span>
                      <div>
                        <div><strong>{title}</strong><small>{duration}</small></div>
                        <p>{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SideCard>
            </aside>
          </section>

          <section className="previewSection" id="report-preview">
            <div className="previewHeading">
              <div>
                <div className="eyebrow"><BarChart3 size={15} /> Report preview</div>
                <h2>A premium audit your clients can understand.</h2>
                <p>Show decision-makers the score, the problems, the opportunities, and what should be fixed first.</p>
              </div>
              <span><Eye size={15} /> Sample report data</span>
            </div>

            <div className="reportShell">
              <div className="reportToolbar">
                <div>
                  <span><FileBarChart2 size={19} /></span>
                  <div><strong>SEO Audit Report — example.com</strong><small>Generated by QuasarAISEO Audit Studio</small></div>
                </div>
                <span className="completePill"><CircleCheckBig size={15} /> Audit complete</span>
              </div>

              <ReportCard icon={GaugeCircle} title="Score dashboard" subtitle="Five core SEO performance categories">
                <div className="scoreGrid">
                  {[
                    ["Overall score", 78, "Good", "overall"],
                    ["Technical", 86, "Strong", ""],
                    ["Content", 72, "Moderate", "yellow"],
                    ["Authority", 58, "Needs work", "orange"],
                    ["UX", 91, "Excellent", ""],
                  ].map(([label, score, grade, style]) => (
                    <div className={`scoreCard ${String(style)}`} key={String(label)}>
                      <small>{String(label)}</small>
                      <strong>{Number(score)}<span>/100</span></strong>
                      <em>{String(grade)}</em>
                      <div><i style={{ width: `${Number(score)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </ReportCard>

              <ReportCard icon={TriangleAlert} title="Issues found" subtitle="Grouped by severity and business impact">
                <div className="issueTabs">
                  {(["critical", "warning", "info"] as Severity[]).map((item) => (
                    <button
                      key={item}
                      onClick={() => setSeverity(item)}
                      className={severity === item ? "active" : ""}
                    >
                      {item[0].toUpperCase() + item.slice(1)}
                      <span>{issueData[item].length}</span>
                    </button>
                  ))}
                </div>

                <div className="issuesList">
                  {selectedIssues.map((issue) => (
                    <div className="issueRow" key={issue.message}>
                      <div>
                        <i className={severity} />
                        <span><strong>{issue.message}</strong><small>{issue.subtext}</small></span>
                      </div>
                      <em>{issue.category}</em>
                      <b className={severity}>{severity}</b>
                    </div>
                  ))}
                </div>
              </ReportCard>

              <ReportCard icon={SearchCode} title="Keyword opportunities" subtitle="Search terms with ranking and revenue potential">
                <div className="tableWrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Keyword</th>
                        <th>Search volume</th>
                        <th>CPC</th>
                        <th>Competition</th>
                        <th>Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywordRows.map(([keyword, volume, cpc, competition, position, high]) => (
                        <tr key={String(keyword)}>
                          <td><strong>{String(keyword)}</strong>{Boolean(high) && <em>High value</em>}</td>
                          <td>{String(volume)}</td>
                          <td>{String(cpc)}</td>
                          <td>
                            <span className="competition">
                              {Number(competition)}
                              <i><b style={{ width: `${Number(competition)}%` }} /></i>
                            </span>
                          </td>
                          <td className="position">{String(position)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ReportCard>

              <ReportCard icon={ListChecks} title="Prioritized action plan" subtitle="Clear next steps ordered by expected impact">
                <div className="actionList">
                  {actions.map((item, index) => (
                    <div className="actionItem" key={item.title}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{item.title}</strong><p>{item.description}</p></div>
                      <aside><em>{item.timeline}</em><b>{item.impact}</b></aside>
                    </div>
                  ))}
                </div>
              </ReportCard>

              <div className="downloadCard">
                <div>
                  <h3>Your report is ready for export.</h3>
                  <p>Use browser print for PDF or download structured sample report data as JSON.</p>
                </div>
                <div>
                  <button onClick={() => window.print()}><FileDown size={15} /> Download PDF</button>
                  <button onClick={downloadJson}><Braces size={15} /> Download JSON</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <span>© 2026 QuasarAISEO. Audit Studio frontend.</span>
          <div><Link href="/">Landing page</Link><a href="#">Documentation</a><a href="#">Privacy</a></div>
        </div>
      </footer>

      {toast && (
        <div className="toast">
          <CheckCircle2 size={20} />
          <div><strong>Success</strong><p>{toast}</p></div>
        </div>
      )}

      <style jsx global>{`
        :root{
          --emerald-50:#ecfdf5;--emerald-100:#d1fae5;--emerald-300:#6ee7b7;--emerald-400:#34d399;--emerald-500:#10b981;--emerald-600:#059669;--emerald-700:#047857;
          --amber-50:#fffbeb;--amber-100:#fef3c7;--amber-400:#fbbf24;--amber-600:#d97706;
          --red-50:#fef2f2;--red-500:#ef4444;--red-600:#dc2626;
          --blue-50:#eff6ff;--blue-500:#3b82f6;
          --slate-50:#f8fafc;--slate-100:#f1f5f9;--slate-200:#e2e8f0;--slate-300:#cbd5e1;--slate-400:#94a3b8;--slate-500:#64748b;--slate-600:#475569;--slate-700:#334155;--slate-800:#1e293b;--slate-900:#0f172a;--slate-950:#020617;
          --max:1240px;--shadow:0 28px 80px rgba(15,23,42,.11);
        }
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{margin:0;color:var(--slate-900);background:radial-gradient(circle at 8% 9%,rgba(16,185,129,.14),transparent 27%),radial-gradient(circle at 91% 14%,rgba(245,158,11,.11),transparent 24%),linear-gradient(180deg,#fbfefd 0%,#f8fafc 45%,#fff 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
        a{text-decoration:none;color:inherit}
        button,input,select,textarea{font:inherit}
        button{cursor:pointer}
        .container{width:min(calc(100% - 32px),var(--max));margin:0 auto}
        .siteHeader{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.84);backdrop-filter:blur(18px);border-bottom:1px solid rgba(226,232,240,.82)}
        .nav{height:72px;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .brand{display:inline-flex;align-items:center;gap:11px;font-size:19px;font-weight:900;letter-spacing:-.035em}.brand>span:last-child span{color:var(--emerald-600)}
        .brandMark{width:39px;height:39px;border-radius:13px;display:grid;place-items:center;color:#fff;background:linear-gradient(145deg,var(--emerald-400),var(--emerald-700));box-shadow:0 12px 25px rgba(16,185,129,.28)}
        .navLinks{display:flex;align-items:center;gap:6px}.navLinks a{padding:9px 13px;border-radius:999px;color:var(--slate-600);font-size:14px;font-weight:650}.navLinks a:hover{background:var(--slate-100);color:var(--slate-950)}.navCta{background:var(--slate-950)!important;color:#fff!important}
        .menuButton{display:none;width:42px;height:42px;border:1px solid var(--slate-200);border-radius:13px;background:#fff;place-items:center}
        main{padding:72px 0 88px}
        .hero{display:grid;grid-template-columns:1.3fr .7fr;gap:56px;align-items:end;margin-bottom:34px}.heroBadge,.eyebrow{display:inline-flex;align-items:center;gap:8px;color:var(--emerald-700);font-size:12px;font-weight:850;letter-spacing:.19em;text-transform:uppercase}.heroBadge{padding:8px 12px;border:1px solid rgba(16,185,129,.24);border-radius:999px;background:var(--emerald-50)}.heroBadge span{width:8px;height:8px;border-radius:50%;background:var(--emerald-500)}
        .hero h1{margin:20px 0 0;max-width:800px;font-size:clamp(46px,6vw,78px);line-height:.98;letter-spacing:-.062em}.hero h1 em{font-style:normal;background:linear-gradient(100deg,var(--emerald-600),var(--emerald-500),#f59e0b);-webkit-background-clip:text;color:transparent}.hero>div>p{max-width:700px;margin:23px 0 0;color:var(--slate-600);font-size:18px;line-height:1.75}
        .routeCard{padding:24px;border:1px solid var(--slate-200);border-radius:24px;background:rgba(255,255,255,.78);box-shadow:0 14px 42px rgba(15,23,42,.07)}.routeCard>div{display:flex;align-items:center;justify-content:space-between;gap:12px}.routeCard>div>strong{font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:var(--slate-500)}.routeCard>div>span{display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;background:var(--emerald-50);color:var(--emerald-700);font-size:11px;font-weight:800}.routeCard i{width:7px;height:7px;border-radius:50%;background:var(--emerald-500)}.routeCard code{display:flex;align-items:center;gap:10px;margin-top:18px;padding:14px 15px;border:1px solid var(--slate-200);border-radius:14px;background:var(--slate-50);font-size:13px}.routeCard p{margin:15px 0 0;color:var(--slate-500);font-size:13px;line-height:1.6}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:26px}.stats article{padding:22px;border:1px solid var(--slate-200);border-radius:18px;background:rgba(255,255,255,.8);box-shadow:0 14px 42px rgba(15,23,42,.07)}.stats article>div{display:flex;justify-content:space-between;align-items:center}.stats small{color:var(--slate-500);font-size:11px;font-weight:850;letter-spacing:.18em;text-transform:uppercase}.stats article>div>span{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;color:var(--emerald-700);background:var(--emerald-50)}.stats strong{display:block;margin-top:15px;font-size:32px;letter-spacing:-.05em}.stats p{margin:12px 0 0;color:var(--slate-500);font-size:12px}
        .workspace{display:grid;grid-template-columns:1.55fr .65fr;gap:22px;align-items:start}.auditCard{position:relative;padding:42px;border-radius:30px;color:#fff;background:radial-gradient(circle at 88% 5%,rgba(16,185,129,.22),transparent 26%),linear-gradient(145deg,#0b1220,#07101e 40%,#020617);box-shadow:0 32px 100px rgba(2,6,23,.35);overflow:hidden}.botOrb{position:absolute;top:30px;right:30px;width:56px;height:56px;border-radius:19px;display:grid;place-items:center;color:var(--emerald-300);background:rgba(16,185,129,.09);border:1px solid rgba(110,231,183,.18)}.eyebrow.light{color:var(--emerald-300)}.auditCard h2{max-width:640px;margin:11px 0 0;font-size:clamp(30px,4vw,48px);line-height:1.04;letter-spacing:-.05em}.auditIntro{max-width:650px;margin:13px 0 0;color:var(--slate-400);font-size:15px;line-height:1.7}.routePill{display:inline-flex;align-items:center;gap:8px;margin-top:20px;padding:8px 11px;border:1px solid rgba(148,163,184,.16);border-radius:999px;color:var(--slate-300);background:rgba(15,23,42,.58);font-size:12px}
        form{margin-top:32px}.formGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}.fieldGroup>span,.textAreaGroup>span{display:flex;justify-content:space-between;margin-bottom:9px;color:var(--slate-200);font-size:13px;font-weight:720}.fieldGroup em,.textAreaGroup em{color:var(--emerald-300);font-size:11px;font-style:normal;text-transform:uppercase}.fieldWrap{position:relative}.fieldWrap>svg:first-child{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:var(--slate-500)}.fieldWrap>svg:last-child{position:absolute;right:15px;top:50%;transform:translateY(-50%);color:var(--slate-500)}.fieldWrap input,.fieldWrap select,.textAreaGroup textarea{width:100%;border:1px solid rgba(148,163,184,.16);outline:none;color:#fff;background:rgba(15,23,42,.72)}.fieldWrap input,.fieldWrap select{height:52px;padding:0 42px 0 44px;border-radius:14px}.fieldWrap select{appearance:none}.fieldGroup small,.textAreaGroup small{display:block;margin-top:8px;color:var(--slate-500);font-size:11px;line-height:1.5}.textAreaGroup{grid-column:1/-1}.textAreaGroup textarea{min-height:128px;padding:15px 16px;border-radius:14px;resize:vertical}.fieldWrap input:focus,.fieldWrap select:focus,.textAreaGroup textarea:focus{border-color:rgba(52,211,153,.65);box-shadow:0 0 0 4px rgba(16,185,129,.1)}
        .moduleLabel{margin:24px 0 0;color:var(--slate-400);font-size:11px;font-weight:850;letter-spacing:.16em;text-transform:uppercase}.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:11px}.chips button{min-height:38px;padding:0 13px;border:1px solid rgba(148,163,184,.18);border-radius:999px;display:flex;align-items:center;gap:8px;color:var(--slate-400);background:rgba(15,23,42,.55);font-size:12px;font-weight:700}.chips button.active{color:var(--emerald-300);border-color:rgba(52,211,153,.32);background:rgba(16,185,129,.1)}
        .formFooter{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:28px;padding-top:24px;border-top:1px solid rgba(148,163,184,.13)}.formFooter>span{display:flex;align-items:center;gap:8px;color:var(--slate-500);font-size:12px}.submitButton{min-width:210px;height:52px;border:0;border-radius:15px;display:flex;align-items:center;justify-content:center;gap:10px;color:#022c22;background:linear-gradient(135deg,var(--emerald-300),var(--emerald-500));font-size:14px;font-weight:850}
        .sidebar{display:grid;gap:18px}.sideCard{padding:24px;border:1px solid var(--slate-200);border-radius:24px;background:rgba(255,255,255,.88);box-shadow:0 14px 42px rgba(15,23,42,.07)}.sideHeader{display:flex;gap:13px;margin-bottom:20px}.sideHeader>span{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;color:var(--emerald-700);background:var(--emerald-50)}.sideHeader h3{margin:0;font-size:17px}.sideHeader p{margin:2px 0 0;color:var(--slate-500);font-size:12px}.groupLabel{margin:0 0 8px;color:var(--slate-400);font-size:10px;font-weight:850;letter-spacing:.18em;text-transform:uppercase}.groupLabel.second{margin-top:20px}.checkRow{display:flex;align-items:center;gap:10px;padding:11px 10px;margin:0 -10px;border-radius:12px;color:var(--slate-700);font-size:13px;font-weight:650}.checkRow svg{color:var(--emerald-500)}
        .workflowList{display:grid;gap:20px}.workflowItem{display:grid;grid-template-columns:42px 1fr;gap:13px}.workflowItem>span{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:var(--emerald-700);background:#fff;border:1px solid var(--emerald-100);font-size:12px;font-weight:850}.workflowItem>div>div{display:flex;justify-content:space-between;gap:10px}.workflowItem strong{font-size:14px}.workflowItem small{padding:4px 7px;border-radius:999px;background:var(--slate-100);color:var(--slate-500);font-size:10px}.workflowItem p{margin:5px 0 0;color:var(--slate-500);font-size:12px;line-height:1.55}
        .previewSection{margin-top:72px}.previewHeading{display:flex;align-items:end;justify-content:space-between;gap:28px;margin-bottom:24px}.previewHeading h2{max-width:760px;margin:14px 0 0;font-size:clamp(34px,4.5vw,60px);line-height:1.02;letter-spacing:-.052em}.previewHeading p{max-width:700px;margin:13px 0 0;color:var(--slate-500);font-size:15px;line-height:1.7}.previewHeading>span{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--slate-200);border-radius:999px;background:#fff;color:var(--slate-600);font-size:12px;font-weight:750}
        .reportShell{padding:20px;border:1px solid var(--slate-200);border-radius:30px;background:rgba(255,255,255,.8);box-shadow:var(--shadow)}.reportToolbar{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:9px 5px 21px}.reportToolbar>div{display:flex;align-items:center;gap:12px}.reportToolbar>div>span{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;color:#fff;background:linear-gradient(145deg,var(--slate-950),var(--slate-700))}.reportToolbar strong,.reportToolbar small{display:block}.reportToolbar small{color:var(--slate-500)}.completePill{display:flex;align-items:center;gap:7px;padding:8px 10px;border-radius:999px;color:var(--emerald-700);background:var(--emerald-50);font-size:11px;font-weight:800}
        .reportCard{margin-top:18px;border:1px solid var(--slate-200);border-radius:24px;background:#fff;overflow:hidden}.reportHeader{display:flex;justify-content:space-between;gap:16px;padding:22px 24px;border-bottom:1px solid var(--slate-100)}.reportHeader>div{display:flex;gap:11px}.reportHeader>div>span{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;color:var(--emerald-700);background:var(--emerald-50)}.reportHeader h3{margin:0;font-size:16px}.reportHeader p{margin:2px 0 0;color:var(--slate-500);font-size:11px}
        .scoreGrid{display:grid;grid-template-columns:1.1fr repeat(4,1fr);gap:14px;padding:22px}.scoreCard{padding:18px;border:1px solid var(--slate-100);border-radius:18px;background:linear-gradient(180deg,#fff,#fbfdff)}.scoreCard.overall{color:#fff;background:linear-gradient(145deg,#0f172a,#020617)}.scoreCard small{color:var(--slate-500);font-size:10px;font-weight:850;text-transform:uppercase}.scoreCard.overall small{color:var(--slate-400)}.scoreCard>strong{display:block;margin-top:20px;font-size:42px;letter-spacing:-.06em}.scoreCard>strong span{font-size:15px;color:var(--slate-400)}.scoreCard em{display:block;margin-top:8px;color:var(--emerald-600);font-size:12px;font-style:normal;font-weight:800}.scoreCard.yellow em{color:var(--amber-600)}.scoreCard.orange em{color:#ea580c}.scoreCard>div{height:8px;margin-top:24px;border-radius:999px;background:var(--slate-100);overflow:hidden}.scoreCard.overall>div{background:rgba(255,255,255,.09)}.scoreCard>div i{display:block;height:100%;background:var(--emerald-500)}.scoreCard.yellow>div i{background:var(--amber-400)}.scoreCard.orange>div i{background:#f97316}
        .issueTabs{display:flex;gap:8px;padding:16px 20px 0}.issueTabs button{display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid transparent;border-radius:11px;background:transparent;color:var(--slate-500);font-size:12px;font-weight:800}.issueTabs button.active{background:#fff;border-color:var(--slate-200);color:var(--slate-900);box-shadow:0 7px 16px rgba(15,23,42,.06)}.issueTabs span{min-width:22px;height:22px;padding:0 6px;border-radius:999px;display:grid;place-items:center;background:var(--slate-100);font-size:10px}.issuesList{padding:14px 20px 20px}.issueRow{display:grid;grid-template-columns:1.4fr 120px 100px;gap:16px;align-items:center;padding:14px 12px;border-bottom:1px solid var(--slate-100)}.issueRow>div{display:flex;gap:11px}.issueRow>div>i{width:9px;height:9px;margin-top:5px;border-radius:50%}.issueRow i.critical{background:var(--red-500)}.issueRow i.warning{background:var(--amber-400)}.issueRow i.info{background:var(--blue-500)}.issueRow strong,.issueRow small{display:block}.issueRow strong{font-size:13px}.issueRow small{margin-top:3px;color:var(--slate-500);font-size:11px}.issueRow>em,.issueRow>b{width:max-content;padding:6px 9px;border-radius:999px;font-size:10px;font-style:normal}.issueRow>em{background:var(--slate-100);color:var(--slate-600)}.issueRow>b{text-transform:capitalize}.issueRow>b.critical{color:var(--red-600);background:var(--red-50)}.issueRow>b.warning{color:var(--amber-600);background:var(--amber-50)}.issueRow>b.info{color:#2563eb;background:var(--blue-50)}
        .tableWrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:760px}th{padding:13px 20px;background:var(--slate-50);border-bottom:1px solid var(--slate-200);color:var(--slate-500);font-size:10px;text-align:left;text-transform:uppercase}td{padding:16px 20px;border-bottom:1px solid var(--slate-100);color:var(--slate-700);font-size:12px}td>em{margin-left:7px;padding:6px 9px;border-radius:999px;color:var(--emerald-700);background:var(--emerald-50);font-size:10px;font-style:normal}.competition{display:flex;align-items:center;gap:7px}.competition>i{width:48px;height:5px;border-radius:999px;background:var(--slate-100);overflow:hidden}.competition b{display:block;height:100%;background:var(--amber-400)}.position{color:var(--emerald-600);font-weight:800}
        .actionList{padding:8px 20px 20px}.actionItem{display:grid;grid-template-columns:48px 1fr auto;gap:15px;align-items:center;padding:15px 4px;border-bottom:1px solid var(--slate-100)}.actionItem>span{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--slate-100);font-size:13px;font-weight:900}.actionItem:first-child>span{background:var(--emerald-100)}.actionItem>div>strong{font-size:13px}.actionItem>div>p{margin:4px 0 0;color:var(--slate-500);font-size:11px}.actionItem aside{display:flex;gap:7px}.actionItem aside em,.actionItem aside b{padding:6px 9px;border-radius:999px;font-size:10px;font-style:normal}.actionItem aside em{background:var(--slate-100);color:var(--slate-600)}.actionItem aside b{background:var(--emerald-50);color:var(--emerald-700)}
        .downloadCard{margin-top:18px;padding:28px;border-radius:24px;color:#fff;background:linear-gradient(145deg,#0f172a,#020617);display:flex;align-items:center;justify-content:space-between;gap:28px}.downloadCard h3{margin:0;font-size:22px}.downloadCard p{max-width:620px;margin:7px 0 0;color:var(--slate-400);font-size:13px}.downloadCard>div:last-child{display:flex;gap:10px}.downloadCard button{height:44px;padding:0 14px;border:1px solid rgba(148,163,184,.2);border-radius:12px;display:flex;align-items:center;gap:8px;color:var(--slate-200);background:rgba(15,23,42,.72);font-size:12px;font-weight:800}.downloadCard button:first-child{color:#022c22;background:var(--emerald-400);border-color:transparent}
        .footer{padding:28px 0 42px;border-top:1px solid var(--slate-200);background:rgba(255,255,255,.64)}.footer>.container{display:flex;justify-content:space-between;gap:20px;color:var(--slate-500);font-size:12px}.footer .container>div{display:flex;gap:18px}
        .toast{position:fixed;right:24px;bottom:24px;z-index:100;width:min(380px,calc(100% - 32px));padding:15px 16px;border:1px solid var(--slate-200);border-radius:15px;display:flex;gap:12px;background:rgba(255,255,255,.96);box-shadow:0 24px 65px rgba(15,23,42,.18)}.toast>svg{color:var(--emerald-600)}.toast strong{font-size:13px}.toast p{margin:3px 0 0;color:var(--slate-500);font-size:11px}
        @media(max-width:1080px){.hero{grid-template-columns:1fr}.workspace{grid-template-columns:1fr}.sidebar{grid-template-columns:repeat(2,1fr)}.scoreGrid{grid-template-columns:repeat(3,1fr)}.scoreCard.overall{grid-column:span 2}}
        @media(max-width:820px){.navLinks{display:none}.navLinks.open{display:flex;position:absolute;top:64px;left:16px;right:16px;padding:12px;border:1px solid var(--slate-200);border-radius:18px;flex-direction:column;background:#fff;box-shadow:var(--shadow)}.menuButton{display:grid}.stats{grid-template-columns:1fr}.sidebar{grid-template-columns:1fr}.scoreGrid{grid-template-columns:repeat(2,1fr)}.scoreCard.overall{grid-column:span 2}.issueRow{grid-template-columns:1fr auto}.issueRow>em{display:none}.previewHeading,.reportToolbar,.downloadCard{align-items:flex-start;flex-direction:column}}
        @media(max-width:620px){.container{width:min(calc(100% - 22px),var(--max))}.hero h1{font-size:45px}.formGrid{grid-template-columns:1fr}.textAreaGroup{grid-column:auto}.auditCard{padding:24px}.botOrb{top:22px;right:22px;width:48px;height:48px}.formFooter{align-items:stretch;flex-direction:column-reverse}.submitButton{width:100%}.scoreGrid{grid-template-columns:1fr}.scoreCard.overall{grid-column:auto}.issueTabs{overflow-x:auto}.issueRow{grid-template-columns:1fr}.issueRow>b{margin-left:20px}.actionItem{grid-template-columns:42px 1fr}.actionItem aside{grid-column:2;flex-wrap:wrap}.downloadCard>div:last-child{width:100%;flex-direction:column}.downloadCard button{justify-content:center}.footer>.container{flex-direction:column}}
        @media print{.siteHeader,.hero,.stats,.workspace,.previewHeading,.reportToolbar,.downloadCard,.footer,.toast{display:none!important}main,.previewSection{padding:0;margin:0}.container{width:100%}.reportShell,.reportCard{border:0;box-shadow:none}.reportCard{break-inside:avoid}}
      `}</style>
    </>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  icon: Icon,
  help,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  icon: typeof Globe2;
  help: string;
}) {
  return (
    <label className="fieldGroup">
      <span>{label}<em>Required</em></span>
      <div className="fieldWrap">
        <Icon size={18} />
        <input name={name} type={type} placeholder={placeholder} required />
      </div>
      <small>{help}</small>
    </label>
  );
}

function SelectField({
  label,
  name,
  icon: Icon,
  options,
  placeholder,
  help,
}: {
  label: string;
  name: string;
  icon: typeof MapPinned;
  options: string[];
  placeholder: string;
  help: string;
}) {
  return (
    <label className="fieldGroup">
      <span>{label}<em>Required</em></span>
      <div className="fieldWrap">
        <Icon size={18} />
        <select name={name} required defaultValue="">
          <option value="" disabled>{placeholder}</option>
          {options.map((item) => <option key={item}>{item}</option>)}
        </select>
        <ChevronDown size={15} />
      </div>
      <small>{help}</small>
    </label>
  );
}

function SideCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Layers3;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="sideCard">
      <div className="sideHeader">
        <span><Icon size={19} /></span>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
      </div>
      {children}
    </article>
  );
}

function ReportCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof GaugeCircle;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="reportCard">
      <header className="reportHeader">
        <div>
          <span><Icon size={18} /></span>
          <div><h3>{title}</h3><p>{subtitle}</p></div>
        </div>
      </header>
      {children}
    </article>
  );
}