import { jsPDF } from "jspdf";
import type { AuditJobRecord } from "@/lib/api";
import { parseRichReport, type RichReport, type Finding } from "@/lib/report-types";

const COLORS = {
  brand: [99, 102, 241] as [number, number, number],
  brandDark: [49, 46, 129] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  slate: [71, 85, 105] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
};

function getGrade(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Moderate";
  return "Needs work";
}

function getScoreColor(score: number): [number, number, number] {
  if (score >= 85) return COLORS.green;
  if (score >= 70) return COLORS.amber;
  return COLORS.red;
}

function formatTraffic(value: string | null): string {
  if (!value) return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString();
}

function truncate(text: string, limit: number): string {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function normalizeText(input: string): string {
  if (!input) return "";
  let cleaned = input
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ")
    .replace(/\r/g, "")
    .replace(/\s*\n\s*/g, " ");

  // Fix missing spaces after punctuation where appropriate (avoid domains & numbers)
  cleaned = cleaned
    .replace(/([a-zA-Z0-9\)])([;!\?])([a-zA-Z0-9])/g, "$1$2 $3")
    .replace(/([a-zA-Z0-9\)])(:)([a-zA-Z0-9])/g, "$1: $3")
    .replace(/,([a-zA-Z0-9])/g, ", $1")
    .replace(/([a-zA-Z0-9])(\()([a-zA-Z0-9])/g, "$1 $2$3")
    .replace(/(\))([a-zA-Z0-9])/g, "$1 $2");

  // Fix domain names & decimal numbers if any space was accidentally added around dots:
  cleaned = cleaned
    .replace(/([a-zA-Z0-9-]+)\s*\.\s*(com|org|net|io|co|dev|app|ai|me|gov|edu|uk|us|ca|au|de|nl|bd)\b/gi, "$1.$2")
    .replace(/(\d+)\s*\.\s*(\d+)/g, "$1.$2")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  return cleaned;
}

function toParagraphs(input: string): string[] {
  if (!input) return [];
  const normalized = input.replace(/\r/g, "");
  return normalized
    .split(/\n\s*\n+/)
    .map((p) => normalizeText(p))
    .filter(Boolean);
}

async function loadImageData(src: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const severityColorMap: Record<string, [number, number, number]> = {
  critical: COLORS.red,
  high: [234, 88, 12] as [number, number, number],
  medium: COLORS.amber,
  pass: COLORS.green,
};

const statusColorMap: Record<string, [number, number, number]> = {
  good: COLORS.green,
  warning: COLORS.amber,
  critical: COLORS.red,
};

export async function generateAuditPDF(audit: AuditJobRecord): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 48;
  const generatedDate = new Date(audit.completedAt ?? Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const logoData = (await loadImageData("/mainlogos/pdfimage.png")) ?? (await loadImageData("/mainlogos/mainlogo.png"));
  let y = 66;

  const ensureSpace = (needed: number) => {
    if (y + needed <= bottomLimit) return;
    doc.addPage();
    y = 56;
  };

  const addSectionHeader = (title: string, subtitle?: string) => {
    const headerHeight = subtitle ? 62 : 48;
    const topGap = 16;
    const lineTitleGap = 16;
    const titleSubtitleGap = 8;
    const bottomGap = 12;
    ensureSpace(headerHeight + topGap);

    y += topGap;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);

    y += lineTitleGap;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.dark);
    doc.text(title, margin, y);

    if (subtitle) {
      y += titleSubtitleGap + 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text(subtitle, margin, y);
      y += bottomGap + 2;
    } else {
      y += bottomGap;
    }
  };

  const drawMetricCard = (x: number, title: string, value: string, hint: string, color: [number, number, number]) => {
    doc.setFillColor(...COLORS.white);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(x, y, 98, 84, 10, 10, "FD");

    doc.setFillColor(...color);
    doc.roundedRect(x + 10, y + 10, 78, 5, 3, 3, "F");

    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, x + 10, y + 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...color);
    doc.text(value, x + 10, y + 56);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(hint, x + 10, y + 72);
  };

  const drawTable = (headers: string[], widths: number[], rows: string[][]) => {
    const rowHeight = 22;
    const headerHeight = 24;

    ensureSpace(headerHeight + 12);
    doc.setFillColor(...COLORS.dark);
    doc.roundedRect(margin, y, contentWidth, headerHeight, 5, 5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.white);
    let x = margin + 8;
    headers.forEach((h, idx) => {
      doc.text(h, x, y + 15);
      x += widths[idx];
    });
    y += headerHeight;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    rows.forEach((row, index) => {
      ensureSpace(rowHeight + 6);
      if (index % 2 === 0) {
        doc.setFillColor(...COLORS.light);
        doc.rect(margin, y, contentWidth, rowHeight, "F");
      }

      x = margin + 8;
      row.forEach((cell, i) => {
        doc.setTextColor(i === row.length - 1 ? COLORS.slate[0] : COLORS.dark[0], i === row.length - 1 ? COLORS.slate[1] : COLORS.dark[1], i === row.length - 1 ? COLORS.slate[2] : COLORS.dark[2]);
        doc.text(truncate(normalizeText(cell), 36), x, y + 14);
        x += widths[i];
      });
      y += rowHeight;
    });

    y += 12;
  };

  const drawFindings = (findings: Finding[]) => {
    if (!findings || findings.length === 0) return;
    findings.forEach((f) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const titleLines = doc.splitTextToSize(normalizeText(f.title), contentWidth - 52) as string[];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const detailLines = doc.splitTextToSize(normalizeText(f.detail), contentWidth - 48) as string[];
      const actionLines = doc.splitTextToSize(normalizeText(f.action), contentWidth - 48) as string[];
      const rowHeight =
        20 +
        titleLines.length * 11.5 +
        8 +
        detailLines.length * 12 +
        10 +
        10 +
        actionLines.length * 12 +
        12;
      ensureSpace(rowHeight + 8);

      const sevColor = severityColorMap[f.severity] ?? COLORS.amber;
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(margin, y, contentWidth, rowHeight, 8, 8, "FD");

      doc.setFillColor(...sevColor);
      doc.circle(margin + 14, y + 14, 5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.dark);
      let ty = y + 17;
      titleLines.forEach((line) => {
        doc.text(line, margin + 26, ty);
        ty += 11.5;
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...sevColor);
      doc.text(f.severity.toUpperCase(), margin + 26, ty + 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.slate);
      let ly = ty + 13;
      detailLines.forEach((line) => {
        doc.text(line, margin + 22, ly);
        ly += 12;
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.muted);
      doc.text("ACTION", margin + 22, ly + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.green);
      let ay = ly + 20;
      actionLines.forEach((line) => {
        doc.text(line, margin + 22, ay);
        ay += 12;
      });

      y += rowHeight + 6;
    });
  };

  const drawMetricsRow = (metrics: { label: string; value: string; status: string }[]) => {
    if (!metrics || metrics.length === 0) return;
    const columns = Math.min(3, metrics.length);
    const rows = Math.ceil(metrics.length / columns);
    const gap = 8;
    const cardHeight = 64;
    const cardWidth = (contentWidth - (columns - 1) * gap) / columns;
    ensureSpace(rows * (cardHeight + gap) + 8);

    metrics.forEach((m, idx) => {
      const row = Math.floor(idx / columns);
      const col = idx % columns;
      const x = margin + col * (cardWidth + gap);
      const cardY = y + row * (cardHeight + gap);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const valueLines = (doc.splitTextToSize(m.value, cardWidth - 16) as string[]).slice(0, 2);
      const stColor = statusColorMap[m.status] ?? COLORS.amber;
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 8, 8, "FD");

      doc.setFillColor(...stColor);
      doc.roundedRect(x + 8, cardY + 8, cardWidth - 16, 3, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.muted);
      doc.text(m.label.toUpperCase(), x + 8, cardY + 22);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.dark);
      let valueY = cardY + 36;
      valueLines.forEach((line) => {
        doc.text(line, x + 8, valueY);
        valueY += 10;
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...stColor);
      doc.text(m.status.toUpperCase(), x + 8, cardY + cardHeight - 8);
    });
    y += rows * (cardHeight + gap) + 2;
  };

  // Parse rich report data
  const rich: RichReport | null = audit.report ? parseRichReport(audit.report.reportJson) : null;

  doc.setFillColor(...COLORS.brandDark);
  doc.rect(0, 0, pageWidth, 182, "F");

  if (logoData) {
    doc.setFillColor(...COLORS.white);
    doc.roundedRect(margin, 22, 34, 34, 8, 8, "F");
    doc.addImage(logoData, "PNG", margin + 5, 27, 24, 24);
  }

  const heroX = logoData ? margin + 46 : margin;
  doc.setFillColor(...COLORS.brand);
  doc.roundedRect(heroX, 26, 138, 22, 11, 11, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.white);
  doc.text("QUASARAISEO AUDIT", heroX + 12, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("SEO Performance", heroX, 84);
  doc.text("Report", heroX, 118);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(199, 210, 254);
  doc.text(truncate(audit.websiteHost, 52), heroX, 140);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  doc.text(`Generated on ${generatedDate}`, pageWidth - margin, 38, { align: "right" });
  doc.text(`Market: ${audit.market}  •  Language: ${audit.language}`, pageWidth - margin, 56, { align: "right" });
  doc.text(`Status: ${audit.status.toUpperCase()}`, pageWidth - margin, 74, { align: "right" });

  doc.setFillColor(...COLORS.white);
  doc.roundedRect(margin, 154, contentWidth, 64, 12, 12, "F");
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, 154, contentWidth, 64, 12, 12, "S");

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TARGET WEBSITE", margin + 16, 178);

  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(truncate(audit.websiteUrl, 76), margin + 16, 198);

  y = 238;

  if (audit.report) {
    addSectionHeader("Score Snapshot", "Overall and category performance");
    const report = audit.report;
    const scores: [string, number][] = [
      ["Overall", report.overallScore],
      ["Technical", report.technicalScore],
      ["Content", report.contentScore],
      ["Authority", report.authorityScore],
      ["UX", report.uxScore],
    ];

    const cardGap = 8;
    const full = 5 * 98 + 4 * cardGap;
    const startX = margin + (contentWidth - full) / 2;

    scores.forEach(([name, score], idx) => {
      drawMetricCard(startX + idx * (98 + cardGap), name, String(score), `${getGrade(score)} · /100`, getScoreColor(score));
    });

    y += 98;
  }

  if (audit.report?.summary) {
    addSectionHeader("Executive Summary");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.slate);

    const summaryText = rich?.executiveSummary ?? audit.report.summary;
    const paragraphs = toParagraphs(summaryText);
    const textWidth = contentWidth - 16;
    const lineSpacing = 14;
    const paragraphGap = 10;
    const startX = margin;

    paragraphs.forEach((paragraph, pIdx) => {
      const lines = doc.splitTextToSize(paragraph, textWidth) as string[];
      const isLastParagraph = pIdx === paragraphs.length - 1;
      const pHeight = lines.length * lineSpacing + (isLastParagraph ? 0 : paragraphGap);
      ensureSpace(pHeight + 8);

      lines.forEach((line) => {
        doc.text(line, startX, y, { align: "left" });
        y += lineSpacing;
      });

      if (!isLastParagraph) {
        y += paragraphGap;
      }
    });

    y += 18;
  }

  // === Technical SEO ===
  if (rich?.technicalSeo) {
    addSectionHeader("Technical SEO", "Core technical health metrics and findings");
    drawMetricsRow(rich.technicalSeo.metrics);
    drawFindings(rich.technicalSeo.findings);
  }

  // === Content & E-E-A-T ===
  if (rich?.contentEeat) {
    addSectionHeader("Content & E-E-A-T", "Experience, Expertise, Authoritativeness, Trustworthiness");
    if (rich.contentEeat.eeatMatrix && rich.contentEeat.eeatMatrix.length > 0) {
      drawTable(
        ["Factor", "Score", "Signals", "Gaps"],
        [contentWidth * 0.18, contentWidth * 0.1, contentWidth * 0.36, contentWidth * 0.36],
        rich.contentEeat.eeatMatrix.map((r) => [r.factor, `${r.score}/100`, truncate(r.signals, 50), truncate(r.gaps, 50)]),
      );
    }
    drawFindings(rich.contentEeat.findings);
  }

  // === On-Page & Keyword Strategy ===
  if (rich?.onPageKeywords) {
    addSectionHeader("On-Page & Keyword Strategy", "Current performance and target opportunities");
    drawFindings(rich.onPageKeywords.findings);
    if (rich.onPageKeywords.targetKeywords && rich.onPageKeywords.targetKeywords.length > 0) {
      drawTable(
        ["Target Keyword", "Volume", "Difficulty", "Priority"],
        [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.2, contentWidth * 0.2],
        rich.onPageKeywords.targetKeywords.map((k) => [k.keyword, k.searchVolume.toLocaleString(), k.difficulty, k.priority]),
      );
    }
  }

  // === Backlink Profile ===
  if (rich?.backlinkProfile) {
    addSectionHeader("Backlink Profile", "Link authority, quality, and building strategy");
    drawMetricsRow(rich.backlinkProfile.metrics);
    if (rich.backlinkProfile.topReferringDomains && rich.backlinkProfile.topReferringDomains.length > 0) {
      drawTable(
        ["Domain", "Links", "Spam Score", "Assessment"],
        [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.2, contentWidth * 0.2],
        rich.backlinkProfile.topReferringDomains.map((d) => [d.domain, String(d.links), `${d.spamScore}%`, d.assessment]),
      );
    }
    drawFindings(rich.backlinkProfile.findings);
    if (rich.backlinkProfile.strategy) {
      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text("STRATEGY", margin, y);
      y += 14;
      const stratLines = doc.splitTextToSize(rich.backlinkProfile.strategy, contentWidth - 20) as string[];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.slate);
      stratLines.forEach((line) => {
        ensureSpace(14);
        doc.text(line, margin, y);
        y += 13;
      });
      y += 10;
    }
  }

  // === AI Visibility ===
  if (rich?.aiVisibility) {
    addSectionHeader("AI Visibility & GEO", "Generative engine optimization and AI crawler access");
    if (rich.aiVisibility.aiCrawlerAccess && rich.aiVisibility.aiCrawlerAccess.length > 0) {
      drawTable(
        ["Crawler", "Owner", "Purpose", "Status"],
        [contentWidth * 0.25, contentWidth * 0.2, contentWidth * 0.3, contentWidth * 0.25],
        rich.aiVisibility.aiCrawlerAccess.map((c) => [c.crawler, c.owner, c.purpose, c.status]),
      );
    }
    drawFindings(rich.aiVisibility.findings);
  }

  // === Schema & Structured Data ===
  if (rich?.schemaStructuredData) {
    addSectionHeader("Schema & Structured Data", "Structured data implementation and recommendations");
    drawFindings(rich.schemaStructuredData.findings);
    if (rich.schemaStructuredData.recommendedSchemas && rich.schemaStructuredData.recommendedSchemas.length > 0) {
      drawTable(
        ["Schema Type", "Page", "Priority", "Impact"],
        [contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.15, contentWidth * 0.35],
        rich.schemaStructuredData.recommendedSchemas.map((s) => [s.type, s.page, s.priority, truncate(s.impact, 48)]),
      );
    }
  }

  // === Score Breakdown ===
  if (rich?.scoreBreakdown && rich.scoreBreakdown.length > 0) {
    addSectionHeader("Score Breakdown", "Weighted contribution of each category");
    drawTable(
      ["Category", "Weight", "Score", "Status"],
      [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.2, contentWidth * 0.2],
      rich.scoreBreakdown.map((r) => [r.category, r.weight, `${r.score}/100`, r.status]),
    );
  }

  if (audit.keywordRankings && audit.keywordRankings.length > 0) {
    addSectionHeader("Keyword Opportunities", `${audit.keywordRankings.length} ranking keywords found`);
    const keywordRows = audit.keywordRankings.slice(0, 35).map((k) => [
      k.keyword,
      k.searchVolume.toLocaleString(),
      k.cpc != null ? `$${k.cpc.toFixed(2)}` : "-",
      k.position != null ? `#${k.position}` : "-",
      (k.url ?? "-").replace(/^https?:\/\//, ""),
    ]);
    drawTable(
      ["Keyword", "Volume", "CPC", "Position", "URL"],
      [contentWidth * 0.33, contentWidth * 0.14, contentWidth * 0.12, contentWidth * 0.12, contentWidth * 0.29],
      keywordRows,
    );
  }

  if (audit.serpCompetitors && audit.serpCompetitors.length > 0) {
    addSectionHeader("SERP Competitors", `${audit.serpCompetitors.length} competing domains`);
    const competitorRows = audit.serpCompetitors.slice(0, 25).map((c) => [
      c.domain,
      c.visibility != null ? `${c.visibility.toFixed(0)}` : "-",
      formatTraffic(c.estimatedTraffic),
      c.keywordsCount != null ? c.keywordsCount.toLocaleString() : "-",
      c.relevance != null ? `${c.relevance.toFixed(0)}%` : "-",
    ]);
    drawTable(
      ["Domain", "Visibility", "Traffic", "Keywords", "Relevance"],
      [contentWidth * 0.32, contentWidth * 0.16, contentWidth * 0.18, contentWidth * 0.16, contentWidth * 0.18],
      competitorRows,
    );
  }

  // === Phased Action Plan ===
  if (rich?.actionPlan) {
    addSectionHeader("Prioritized Action Plan", "Multi-phase implementation roadmap");
    const phases = ["phase1", "phase2", "phase3", "phase4"] as const;
    const phaseColors: [number, number, number][] = [COLORS.red, [234, 88, 12] as [number, number, number], COLORS.amber, COLORS.green];
    phases.forEach((pk, pIdx) => {
      const phase = rich.actionPlan![pk];
      if (!phase) return;
      ensureSpace(30);
      doc.setFillColor(...phaseColors[pIdx]);
      doc.roundedRect(margin, y, 24, 20, 5, 5, "F");
      doc.setTextColor(...COLORS.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(String(pIdx + 1), margin + 12, y + 14, { align: "center" });

      doc.setTextColor(...COLORS.dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(phase.title, margin + 32, y + 14);
      y += 26;

      if (phase.items) {
        phase.items.forEach((item) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const actionLines = doc.splitTextToSize(normalizeText(item.action), contentWidth - 44) as string[];
          const impactLines = doc.splitTextToSize(`Impact: ${normalizeText(item.impact)}`, contentWidth - 44) as string[];
          const rowHeight = Math.max(40, actionLines.length * 12 + impactLines.length * 11 + 22);
          ensureSpace(rowHeight + 4);

          doc.setFillColor(...COLORS.light);
          doc.roundedRect(margin, y, contentWidth, rowHeight, 6, 6, "F");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.slate);
          let ly = y + 16;
          actionLines.forEach((line) => {
            doc.text(line, margin + 22, ly);
            ly += 12;
          });

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.green);
          impactLines.forEach((line) => {
            doc.text(line, margin + 22, ly + 3);
            ly += 11;
          });

          y += rowHeight + 4;
        });
      }
      y += 6;
    });
  } else if (audit.report?.recommendations) {
    addSectionHeader("Prioritized Recommendations");
    const recommendations = audit.report.recommendations
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 18);

    recommendations.forEach((item, idx) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const rowLines = doc.splitTextToSize(item.replace(/^[-•]\s*/, ""), contentWidth - 58) as string[];
      const rowHeight = Math.max(30, rowLines.length * 11 + 12);
      ensureSpace(rowHeight + 8);

      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(margin, y, contentWidth, rowHeight, 8, 8, "FD");

      doc.setFillColor(...COLORS.brand);
      doc.circle(margin + 16, y + 16, 9, "F");
      doc.setTextColor(...COLORS.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(String(idx + 1), margin + 16, y + 19, { align: "center" });

      doc.setTextColor(...COLORS.slate);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      let lineY = y + 15;
      rowLines.forEach((line) => {
        doc.text(line, margin + 34, lineY);
        lineY += 11;
      });

      y += rowHeight + 8;
    });
  }

  // === Quick Wins ===
  if (rich?.quickWins && rich.quickWins.length > 0) {
    addSectionHeader("Quick Wins", "Fast, high-impact fixes you can implement today");
    rich.quickWins.forEach((qw) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const actionLines = doc.splitTextToSize(normalizeText(qw.action), contentWidth - 54) as string[];
      const impactLine = `Impact: ${truncate(normalizeText(qw.impact), 52)}`;
      const rowHeight = Math.max(42, actionLines.length * 12 + 28);
      ensureSpace(rowHeight + 6);

      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(251, 191, 36);
      doc.roundedRect(margin, y, contentWidth, rowHeight, 6, 6, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.amber);
      doc.text("QW", margin + 14, y + 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.slate);
      let ly = y + 17;
      actionLines.forEach((line) => {
        doc.text(line, margin + 46, ly);
        ly += 12;
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.amber);
      doc.text(`Time: ${normalizeText(qw.timeEstimate)}`, margin + 46, y + rowHeight - 10);

      doc.setTextColor(...COLORS.green);
      doc.text(impactLine, pageWidth - margin - 12, y + rowHeight - 10, { align: "right" });

      y += rowHeight + 6;
    });
  }

  // === Projected Outcomes ===
  if (rich?.projectedOutcomes) {
    addSectionHeader("Projected Outcomes", "Expected results if recommendations are implemented");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const paragraphs = toParagraphs(rich.projectedOutcomes);
    const outcomeLines = paragraphs.flatMap((p, idx) => {
      const chunk = doc.splitTextToSize(p, contentWidth - 44) as string[];
      return idx < paragraphs.length - 1 ? [...chunk, ""] : chunk;
    });
    const boxHeight = Math.max(58, outcomeLines.length * 13 + 24);
    ensureSpace(boxHeight + 10);
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 10, 10, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.2);
    doc.setTextColor(...COLORS.slate);
    let oy = y + 20;
    outcomeLines.forEach((line) => {
      if (line === "") {
        oy += 6;
        return;
      }
      doc.text(line, margin + 22, oy);
      oy += 13;
    });
    y += boxHeight + 16;
  }

  if (audit.crawledPages && audit.crawledPages.length > 0) {
    addSectionHeader("Crawled Page Summary", `${audit.crawledPages.length} pages analyzed`);
    const pageRows = audit.crawledPages.slice(0, 30).map((p) => [
      p.url.replace(/^https?:\/\//, ""),
      String(p.statusCode ?? "-"),
      p.title ?? "-",
      String(p.wordCount ?? "-"),
    ]);
    drawTable(
      ["URL", "Status", "Title", "Words"],
      [contentWidth * 0.42, contentWidth * 0.1, contentWidth * 0.33, contentWidth * 0.15],
      pageRows,
    );
  }

  // ─── Footer on every page ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`QuasarAISEO Audit • ${audit.websiteHost}`, margin, pageHeight - 18);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 18, { align: "right" });
  }

  // ─── Save ───
  const filename = `quasar-audit-${audit.websiteHost}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
