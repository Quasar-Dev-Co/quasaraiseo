<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Quasar AI SEO — Feature Status

Last updated: 2026-10-11

| Feature | Status | Where |
|---|---|---|
| Site audit | Have | `/audit-mcp` |
| AI content generation | Have | `/post-create` |
| Skills system | Have | Uploadable skills — selectable per thread in `/content-strategy` (shared library with `/post-create`) |
| API cost tracking | Have | Settings → Costs (super user) — tokens & cost per model, feature, user |
| Onboarding tour & guided dashboard | Have | First-sign-in tour + "How it works" button; Overview shows setup checklist and Plan → Create → Publish → Measure loop |
| Personal activity summary | Have | Overview → "Your activity": each user's own tokens, active time, top websites and tools (`/api/insights/me`) |
| Admin tracking | Have | `/tracking` (super only): every person's tokens, active time, tools, top website and cost; open a person to see what they see |
| Permalink guard | Have | Publishing sends a clean slug that matches the title, then checks the link WordPress made (`lib/permalink.ts` on the backend; editable "Page link" in the publish dialog). Works with any plugin version: the link is set right after the post is created, no plugin update needed |
| MCP Chat AI images | Have | `/content-strategy`: when a post/page/image is asked for and no gallery image is chosen, the chat uses the same AI image flow as `/post-create` (`lib/blog-images.ts`; `imagePrompts` on `create_post`, `generate_images` tool) |
| MCP Chat bulk scheduling | Have | `/content-strategy`: "write N posts and publish them on these dates" → `schedule_posts` queues them (table `ScheduledPost`, runner in `mcp-publishing.ts`); each is written in the background with images and given to WordPress with a future date. `list_scheduled_posts` / `cancel_scheduled_posts` |
| MCP Chat partial post edits | Have | `/content-strategy`: `patch_post_content` adds a sentence or paragraph before/after existing text, or links existing anchor text, and changes nothing else (`mcp-patch-content.ts`, matching in `lib/html-patch.ts` on the backend). Saves only the body: through the plugin's `/posts/{id}/content` route (plugin 2.0.3+, token auth; saves only when WordPress's HTML filter would remove nothing, at most tidying markup formatting), else core WordPress with an application password (`lib/wp-content.ts`, `lib/wp-core.ts`); sites on an older plugin without an application password are told to install `wordpress-plugin/quasar-ai-seo-2.0.3.zip`. Refuses Elementor and custom-render pages; `dry_run` previews; recorded in History with Undo |
| MCP Chat site tools | Have | `/content-strategy`: `manage_menus` (list, create, add/edit/remove items, assign theme locations), `manage_site_setup` (title, tagline, homepage, posts page, permalinks, time zone, search visibility…), `manage_media` (list, alt/title/caption, upload from a link, delete unused files), `list_plugins` (read-only) and `manage_backups` (UpdraftPlus status, start a backup; restore is done in UpdraftPlus via the link the tool gives). Backend `mcp-site-tools.ts`; plugin 2.1.0 `includes/site-tools.php` (token auth, `quasar_ai_seo_site_tools_enabled` filter turns it off). Deletes, hiding from search and permalink changes need `confirm: true` after the user agrees. Installing/updating/switching plugins is deliberately not offered |
| MCP Chat history & undo | Have | `/content-strategy` → History button: every post/page the chat creates or edits, and saved content pages, is listed with an Undo (`mcp-history.ts`, table `McpChange`). Undo is itself recorded, so it can be undone; new posts go to the WordPress trash. Works with any plugin version |
| AI provider (OpenAI/OpenRouter) | Have | Settings — model selector works in MCP |
| Multiple Google accounts | Have | Settings → Google Connect: the admin adds any number of Google accounts (`components/settings/google-accounts.tsx`); Search Console and Analytics list the websites from all of them, grouped by account, and each data call goes to the account that owns the site (`lib/google-api.ts`). Backend: table `GoogleAccount` (`google-accounts.ts`, tokens encrypted, the old connection is copied in on first start). Contract: `docs/backend-google-accounts-and-mcp.md` |
| Admin MCP server | Have | Settings → MCP access (super only, `components/settings/mcp-access-tab.tsx`): access keys, copy-paste setup for Claude Code, Cursor, Claude.ai/Claude Desktop and ChatGPT, and 13 read-only tools (analytics, team activity, scheduled posts, costs, tasks…). Backend: `POST /mcp` and `/api/admin-mcp` (`modules/admin-mcp/`, table `McpAccessKey`). Contract: `docs/backend-google-accounts-and-mcp.md` |
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
- Design system: brand color `brand-*` (magenta #D11F76 = brand-700, hover #7A48ED = `brand-hover`), IBM Plex Sans, neutral surfaces. Page names/descriptions live in `lib/navigation.ts`; use `PageHeader` at the top of dashboard pages. Avoid gradient text, purple gradients, glow shadows and eyebrow labels (checked with the `impeccable` detector).
