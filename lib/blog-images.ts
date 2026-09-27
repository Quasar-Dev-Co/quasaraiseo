// Mirrors quasar-ai-seo-backend/src/lib/insert-blog-images.ts — keep the two in sync.
// Places AI-generated images into a post body so that no two images ever end up
// next to each other. Posts have no <h1> (the title lives outside the body), so the
// old logic put "featured" and "after-section-1" right after the same first </h2>,
// and any missing section was appended to the end — both stacked images together.

export type BlogImage = { placement: string; url: string };

const NESTING_TAGS = ["blockquote", "table", "ul", "ol", "figure", "details", "div"];

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function blogImageFigure(img: BlogImage): string {
  return `<figure class="wp-block-image" data-placement="${escapeAttr(img.placement)}"><img src="${escapeAttr(img.url)}" alt="" class="wp-image-generated" /></figure>`;
}

// True when `html` opens more of a nesting tag than it closes, i.e. a position right
// after it would be inside a list, table, quote, etc.
function insideNestedBlock(html: string): boolean {
  for (const tag of NESTING_TAGS) {
    const opens = (html.match(new RegExp(`<${tag}[\\s>]`, "gi")) || []).length;
    const closes = (html.match(new RegExp(`</${tag}>`, "gi")) || []).length;
    if (opens > closes) return true;
  }
  return false;
}

// End of the first top-level paragraph in body[from, to), or -1.
function firstParagraphEnd(body: string, from: number, to: number): number {
  let search = from;
  while (search < to) {
    const close = body.indexOf("</p>", search);
    if (close === -1 || close + 4 > to) return -1;
    if (!insideNestedBlock(body.slice(from, close))) return close + 4;
    search = close + 4;
  }
  return -1;
}

export function insertImagesIntoBody(body: string, images: BlogImage[]): string {
  // Strip previously inserted generated images so re-running never duplicates them.
  const cleanBody = body.replace(/\s*<figure[^>]*>\s*<img[^>]*wp-image-generated[^>]*>\s*<\/figure>/gi, "");

  const h2Starts: number[] = [];
  const h2Re = /<h2[\s>]/gi;
  let m: RegExpExecArray | null;
  while ((m = h2Re.exec(cleanBody)) !== null) {
    if (!insideNestedBlock(cleanBody.slice(0, m.index))) h2Starts.push(m.index);
  }

  // One slot per section: after the first paragraph of that section, so the image
  // sits between text instead of directly under a heading or another image.
  const sectionSlots: number[] = h2Starts.map((start, i) => {
    const end = i + 1 < h2Starts.length ? h2Starts[i + 1] : cleanBody.length;
    const headingEnd = cleanBody.indexOf("</h2>", start);
    if (headingEnd === -1 || headingEnd > end) return -1;
    return firstParagraphEnd(cleanBody, headingEnd + 5, end);
  });
  const introEnd = h2Starts.length ? h2Starts[0] : cleanBody.length;
  const introSlot = firstParagraphEnd(cleanBody, 0, introEnd);

  const usedSections = new Set<number>();
  const inserts: Array<{ pos: number; html: string }> = [];
  const seenPlacements = new Set<string>();
  let introUsed = false;
  let topUsed = false;

  const takeSection = (preferred: number): number => {
    const order: number[] = [];
    for (let i = preferred; i < sectionSlots.length; i++) order.push(i);
    for (let i = preferred - 1; i >= 0; i--) order.push(i);
    for (const i of order) {
      if (i >= 0 && sectionSlots[i] !== -1 && !usedSections.has(i)) {
        usedSections.add(i);
        return sectionSlots[i];
      }
    }
    return -1;
  };

  for (const img of images) {
    if (!img.url || seenPlacements.has(img.placement)) continue;
    seenPlacements.add(img.placement);
    const html = blogImageFigure(img);
    let pos = -1;

    if (img.placement === "featured") {
      if (!topUsed) { pos = 0; topUsed = true; }
    } else if (img.placement === "after-intro") {
      if (introSlot !== -1 && !introUsed) { pos = introSlot; introUsed = true; }
      else pos = takeSection(0);
    } else {
      const sectionMatch = img.placement.match(/after-section-(\d+)/);
      const preferred = sectionMatch ? Math.max(0, parseInt(sectionMatch[1], 10) - 1) : 0;
      pos = takeSection(preferred);
    }

    if (pos === -1) continue; // no free slot left — skip rather than stack images
    inserts.push({ pos, html });
  }

  // Insert back-to-front so earlier positions stay valid.
  inserts.sort((a, b) => b.pos - a.pos);
  let result = cleanBody;
  for (const { pos, html } of inserts) {
    const before = result.slice(0, pos);
    const after = result.slice(pos);
    result = pos === 0 ? `${html}\n${after}` : `${before}\n${html}${after}`;
  }
  return result;
}
