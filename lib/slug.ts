// Mirrors the server's slug rules (quasar-ai-seo-backend/src/lib/permalink.ts) so
// the publish dialog can preview the link before anything is sent.

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function trimSlug(slug: string, max = 70): string {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max);
  const dash = cut.lastIndexOf("-");
  return (dash > 20 ? cut.slice(0, dash) : cut).replace(/-+$/, "");
}

const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is", "are", "your", "you", "how", "what", "de", "het", "een", "en", "van", "voor", "met", "op", "je", "jij", "hoe", "wat", "te", "bij"]);

function words(text: string): string[] {
  return slugify(text).split("-").filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));
}

/** Share of the slug's meaningful words that also appear in the title. */
export function slugMatchesTitle(slug: string, title: string): boolean {
  const sw = words(slug);
  if (sw.length === 0) return false;
  const tw = words(title);
  const hits = sw.filter((s) => tw.some((t) => t === s || t.startsWith(s) || s.startsWith(t))).length;
  return hits / sw.length >= 0.5;
}

/** The slug that will be published: the given one when it is clean and on-topic, else built from the title. */
export function suggestSlug(title: string, given?: string): string {
  const fromTitle = trimSlug(slugify(title));
  const cleaned = given ? trimSlug(slugify(given)) : "";
  if (!cleaned || cleaned.length < 3 || /^(untitled|new-post|post|page|draft|test)(-\d+)?$/.test(cleaned)) return fromTitle;
  return slugMatchesTitle(cleaned, title) ? cleaned : fromTitle;
}
