<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Quasar AI SEO — Feature Status

Last updated: 2026-09-29

| Feature | Status | Where |
|---|---|---|
| Site audit | Have | `/audit-mcp` |
| AI content generation | Have | `/post-create` |
| Skills system | Have | Uploadable skills — selectable per thread in `/content-strategy` (shared library with `/post-create`) |
| API cost tracking | Have | Settings → Costs (super user) — tokens & cost per model, feature, user |
| Onboarding tour & guided dashboard | Have | First-sign-in tour + "How it works" button; Overview shows setup checklist and Plan → Create → Publish → Measure loop |
| AI provider (OpenAI/OpenRouter) | Have | Settings — model selector works in MCP |
| WordPress publishing | Have | `/post-create` |
| Branding extraction | Have | Branding module |
| PDF report generation | Have | Keyword MCP `/content-strategy` — 19 pages, 200+ keywords |
| Content strategy (pillar/cluster) | Have | `/content-strategy` (Quasar MCP) → `/post-create` |
| Keyword research tool | Have | `/content-strategy` (Quasar MCP) |
| Content gap analysis | Have | In keyword research PDF |
| Competitor analysis | Have | In keyword research PDF |
| Pillar→Cluster post generation | Have | `/post-create` reference page selector |
| Schema markup generator | Missing | — |
| Rank tracking | Missing | — |
| Backlink analysis | Missing | — |
| Core Web Vitals checker | Missing | — |
| AI citation tracking | Missing | — |
| Local SEO tools | Missing | — |
| SERP analysis | Missing | — |

### Notes
- `Built now` = working but not yet in the original product vision from the user table
- `Missing` = still needs to be implemented
- Update this table when a feature is finished.
- Design system: brand color `brand-*` (ember, from the logo spark), IBM Plex Sans, neutral surfaces. Page names/descriptions live in `lib/navigation.ts`; use `PageHeader` at the top of dashboard pages. Avoid gradient text, purple gradients, glow shadows and eyebrow labels (checked with the `impeccable` detector).
