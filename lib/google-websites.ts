import type { AnalyticsProperty, SearchConsoleDailyRow, SearchConsoleSite } from "@/lib/google-api";

/** Keep protocol and www. Only trailing slashes are ignored, so both variants stay listed. */
export function canonicalGoogleSite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase().startsWith("sc-domain:")) return trimmed.toLowerCase();
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.protocol}//${url.host}${path}`.toLowerCase();
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, "");
  }
}

export function analyticsSitesMissingFromSearchConsole(
  sites: SearchConsoleSite[],
  properties: AnalyticsProperty[],
): Array<{ key: string; label: string }> {
  const known = new Set(sites.map((site) => canonicalGoogleSite(site.siteUrl)));
  const missing: Array<{ key: string; label: string }> = [];

  for (const property of properties) {
    const urls = property.websiteUrls ?? [];
    for (const url of urls) {
      if (known.has(canonicalGoogleSite(url))) continue;
      missing.push({
        key: `ga:${property.propertyId}:${url}`,
        label: `${url} — ${property.displayName} (Analytics only)`,
      });
    }
  }

  return missing;
}

export function searchConsoleSitesMissingFromAnalytics(
  sites: SearchConsoleSite[],
  properties: AnalyticsProperty[],
): SearchConsoleSite[] {
  const known = new Set(
    properties.flatMap((property) => (property.websiteUrls ?? []).map(canonicalGoogleSite)),
  );
  return sites.filter((site) => !known.has(canonicalGoogleSite(site.siteUrl)));
}

/** Search Console headline metrics. Date rows are complete; query rows are not. */
export function aggregateSearchConsole(rows: SearchConsoleDailyRow[]) {
  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const avgPosition = totalImpressions > 0
    ? rows.reduce((sum, row) => sum + row.position * row.impressions, 0) / totalImpressions
    : 0;
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  return { totalClicks, totalImpressions, avgPosition, avgCtr };
}
