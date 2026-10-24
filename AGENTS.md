<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Quasar AI SEO — Feature Status

Last updated: 2026-10-24

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
| MCP Chat partial post edits | Have | `/content-strategy`: `patch_post_content` adds a sentence or paragraph before/after existing text, or links existing anchor text, and changes nothing else (`mcp-patch-content.ts`, matching in `lib/html-patch.ts` on the backend). Saves only the body: through the plugin's `/posts/{id}/content` route (plugin 2.2.0+, token auth; saves only when WordPress's HTML filter would remove nothing, at most tidying markup formatting), else core WordPress with an application password (`lib/wp-content.ts`, `lib/wp-core.ts`); from plugin 2.2.2 markup the filter would remove that is already in the post (embeds, `<style>` blocks, scripts, forms) is kept byte for byte around the edit (`quasar_safe_body_save` in `includes/quasar-safe-writes.php`), and a refusal names the markup, the reason and what to do; sites on an older plugin are told to install 2.2.2 (`wordpress-plugin/quasar-ai-seo-2.2.2.zip`). Refuses Elementor and custom-render pages; `dry_run` previews; recorded in History with Undo. Custom page designs (`update_custom_render` / `wp_update_custom_render`) need plugin 2.2.1+, which stores them in the Custom Web Render fields (`_cwr_*`) the renderer reads; HTML is filtered and JS/head code are not accepted through the token |
| MCP Chat SEO fields reach the live page | Have | `update_post_meta` / `fix_seo` (and `wp_update_seo` / `wp_fix_seo`) send `seo_title`/`seo_description`/`focus_keyword`; plugin 2.2.2 writes them to every store a page reads (Custom Web Render, Yoast, Rank Math, SEOPress, The SEO Framework), clears page caches and returns what the page uses. The backend then reads the live page (`lib/wp-live-check.ts`, fresh + normal copy) and only says "live" when it shows the values; otherwise it gives the exact Reason and What to do (custom design on an older plugin, page cache, unsupported SEO plugin, theme). Failures from WordPress are explained by `lib/wp-errors.ts` (token, firewall, missing route, PHP error, timeout) |
| MCP Chat site tools | Have | `/content-strategy`: `manage_menus` (list, create, add/edit/remove items, assign theme locations), `manage_site_setup` (title, tagline, homepage, posts page, permalinks, time zone, search visibility…), `manage_media` (list, alt/title/caption, upload from a link, delete unused files), `list_plugins` (read-only) and `manage_backups` (UpdraftPlus status, start a backup; restore is done in UpdraftPlus via the link the tool gives). Backend `mcp-site-tools.ts`; plugin 2.2.0 `wordpress-plugin/quasar-ai-seo/includes/quasar-site-tools.php` (token auth, `quasar_ai_seo_site_tools_enabled` filter turns it off). Deletes, hiding from search and permalink changes need `confirm: true` after the user agrees. Installing/updating/switching plugins is deliberately not offered |
| MCP Chat thread memory | Have | `/content-strategy`: files uploaded on any turn stay readable for the whole thread — `read_uploaded_file` re-reads the original exactly (sheets by real row number, tab, columns, search; documents by offset/search), and every turn lists the thread's files with their sheets, row counts and headers. `remember` pins notes (progress, decisions) shown on every later turn (`lastReport._memory`). Long threads send the newest messages in full and a digest of older ones instead of dropping them. Backend `mcp-thread-memory.ts`, `lib/mcp-chat-attachments.ts` |
| MCP Chat traffic at a glance | Have | `/content-strategy`: under the website bar of each chat, a small collapsible strip compares the last 7 or 28 days with the period before — Search Console clicks, impressions, CTR and average position, plus Analytics sessions when a property's website matches — each with the change and a mini line (gray = the period before). Picks the matching Search Console property (domain property first) across all connected Google accounts; says so when the site isn't connected. `components/mcp/site-traffic-glance.tsx`; no backend change |
| MCP Chat history & undo | Have | `/content-strategy` → History button: every post/page the chat creates or edits, and saved content pages, is listed with an Undo (`mcp-history.ts`, table `McpChange`). Undo is itself recorded, so it can be undone; new posts go to the WordPress trash. Works with any plugin version |
| AI provider (OpenAI/OpenRouter) | Have | Settings — model selector works in MCP |
| Multiple Google accounts | Have | Settings → Google Connect: the admin adds any number of Google accounts (`components/settings/google-accounts.tsx`); Search Console and Analytics list the websites from all of them, grouped by account, and each data call goes to the account that owns the site (`lib/google-api.ts`). Backend: table `GoogleAccount` (`google-accounts.ts`, tokens encrypted, the old connection is copied in on first start). Contract: `docs/backend-google-accounts-and-mcp.md` |
| Admin MCP server | Have | Settings → MCP access (super only, `components/settings/mcp-access-tab.tsx`): access keys with an access level — **Read only** (13 data tools + read-only WordPress tools) or **Read + change WordPress sites** (adds tools that edit posts, SEO fields, menus, media, setup, custom designs and start backups) — and copy-paste setup for Claude Code, Cursor, Claude.ai/Claude Desktop and ChatGPT. 52 tools in all; `quasar_guide` gives agents the rules and recipes. Backend: `POST /mcp` and `/api/admin-mcp` (`modules/admin-mcp/`: `mcp-tools.ts` data tools, `mcp-wordpress-tools.ts` WordPress tools run through MCP Chat's code via `runWordPressTool`, so edits show in History with Undo; table `McpAccessKey` with `access`). Tool reference: `docs/mcp-server-tools.md`. Contract: `docs/backend-google-accounts-and-mcp.md` |
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
- The WordPress plugin on client sites is the bundle in `wordpress-plugin/quasar-ai-seo/` (see `wordpress-plugin/README.md`); `quasar-ai-seo-ten/` is the old connector-only plugin.
- Design system: brand color `brand-*` (magenta #D11F76 = brand-700, hover #7A48ED = `brand-hover`), IBM Plex Sans, neutral surfaces. Page names/descriptions live in `lib/navigation.ts`; use `PageHeader` at the top of dashboard pages. Avoid gradient text, purple gradients, glow shadows and eyebrow labels (checked with the `impeccable` detector).
