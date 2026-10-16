# Quasar MCP server — tools reference

Generated from `quasar-ai-seo-backend/src/modules/admin-mcp/` (mcp-tools.ts, mcp-wordpress-tools.ts). The same descriptions are sent to the agent in `tools/list`; regenerate this file when they change.

- Endpoint: `POST https://api.seo.quasarasoft.com/mcp` (Streamable HTTP, JSON-RPC). Key in `Authorization: Bearer qmcp_…` or `?key=`.
- Keys are created by an admin in Quasar → Settings → MCP access. **Read only** keys see the read tools; **Read + change WordPress sites** keys see all tools.
- WordPress tools need the Quasar AI SEO plugin on the site (2.2.0+ for paragraph edits, menus, setup, media editing, plugins and backups; 2.2.2+ so SEO fields reach custom-designed pages and edits work in posts with embeds, styles or scripts).
- Changes to posts made through these tools appear in Quasar → MCP Chat → History, with Undo.

## Agent guide (returned by `quasar_guide`): Quasar AI SEO — how to work on WordPress sites

Every WordPress tool takes "site" (the site's address). Start with wp_list_sites.

## Golden rules
1. Read before you write. Look at the post, menu or setting first, then change it.
2. Small edits to existing posts (add a sentence, add an internal link): use wp_patch_post_content, never wp_update_post with the whole body. A full rewrite can lose blocks, images, tables, links and schema.
3. Preview first: wp_patch_post_content supports dry_run: true. Show the user the preview when they asked to review.
4. Changes that remove things or can hurt search visibility need confirm: true, which you may only send after the user agreed in their own words: deleting posts, menus, menu items or media; hiding the site from search engines; changing the permalink structure.
5. Suggest a backup (wp_run_backup) before big or risky changes.
6. Write content in the site's own language. Keep the site's tone.
7. Report exactly what a tool returned. If it failed or said "Not done yet" or "NOT live", say so and give the user its Reason and What to do — never claim a change that did not happen, and never summarize a precise reason into a vague one.
8. Post edits made here appear in Quasar → MCP Chat → History, where they can be undone. WordPress also keeps revisions (wp_list_revisions).

## Common tasks
- Add a sentence after a paragraph: wp_read_paragraphs(site, post_id) → copy the exact paragraph text → wp_patch_post_content(site, post_id, find_text, insert_after, dry_run: true) → show the preview → same call without dry_run.
- Add an internal link to existing words: wp_patch_post_content(site, post_id, link_text: "exact words", link_url: "https://…"). Add find_text to pick the right paragraph when the words appear more than once.
- Improve SEO title / meta description / focus keyword: wp_get_post (see current values and what the page uses) → wp_update_seo. It works with any SEO plugin, none, and Quasar custom page designs, and checks the live page: report "live" only when it says live = "visible"; otherwise pass on its Reason and What to do.
- Write a new post: wp_create_post (status "draft" unless the user asked to publish; add image_prompts for AI images). Then wp_publish_post or wp_schedule_post.
- Many posts on a schedule: wp_schedule_many_posts, then wp_post_queue to follow progress.
- Put a page in the main menu: wp_list_menus (find the menu shown in the main location) → wp_list_pages (page ID) → wp_manage_menus(action "add_item", menu_id, object_id).
- Fix image alt texts: wp_list_media(search) → wp_manage_media(action "update", media_id, alt).
- Homepage SEO title/description (Yoast/Rank Math): wp_get_site_seo → wp_update_site_seo.
- Site title, tagline, homepage, permalinks, time zone: wp_get_site_setup → wp_update_site_setup.
- Check a live page: seo_analyze_url, seo_get_page_schema.
- Backups: wp_backup_status → wp_run_backup. Restoring is done by the user in UpdraftPlus (the status tool gives the link).

## Limits
- Plugins can be listed (wp_list_plugins) but not installed, updated or switched on/off — the user does that in WordPress → Plugins.
- Pages built with Elementor or with a Quasar custom page design can't be edited with wp_patch_post_content (it explains why).
- Custom page designs (wp_update_custom_render) accept HTML and CSS; WordPress filters the HTML (removed tags are reported) and JavaScript / <head> code are not accepted through this connection — say so when a reply mentions it. Needs plugin 2.2.1+.
- Tools marked as changing the site need an access key with "manage" access.
- The site needs the Quasar AI SEO plugin 2.2.0 or newer for paragraph edits, menus, setup, media editing, plugins and backups; tools say so when a site is older.
- Plugin 2.2.2 or newer: SEO fields reach custom-designed pages, title/slug/publish changes no longer strip embeds or <style> blocks from the body, and paragraph edits work in posts that contain embeds, styles or scripts (that markup is kept exactly as it is). With an older plugin the tools say what is missing.

## Data tools (read-only)

### `list_websites` — List websites
Read-only.

Every website in the system: Search Console sites and Analytics properties from all Google accounts, WordPress sites and brand profiles. Use the siteUrl and propertyId from here in the report tools.

Parameters:
- none

### `list_google_accounts` — List Google accounts
Read-only.

Connected Google accounts and which services each one gives access to.

Parameters:
- none

### `search_console_report` — Search Console report
Read-only.

Clicks, impressions, CTR and position for a site from Google Search Console, with totals for the period. Split by date, query, page, country or device. Defaults to the last 28 days by date.

Parameters:
- `siteUrl` (required) — Exactly as list_websites shows it, e.g. https://example.com/ or sc-domain:example.com
- `startDate`
- `endDate`
- `dimensions` — How to split the rows. Default ["date"].
- `searchType` — one of `web`, `image`, `video`, `news`, `discover`, `googleNews`
- `rowLimit` — Most rows to return. Default 100, max 1000.

### `analytics_report` — Analytics report
Read-only.

Google Analytics 4 report for a property: users, sessions, page views, engagement and any other GA4 metric, split by dimensions such as date, pagePath, sessionDefaultChannelGroup, country or deviceCategory. Defaults to the last 28 days by date.

Parameters:
- `propertyId` (required)
- `startDate`
- `endDate`
- `metrics` — GA4 metric names. Default totalUsers, sessions, screenPageViews, engagementRate, averageSessionDuration.
- `dimensions` — GA4 dimension names. Default ["date"].
- `limit` — Most rows to return. Default 50, max 1000.

### `analytics_realtime` — Analytics realtime
Read-only.

People on a site right now (last 30 minutes), by country.

Parameters:
- `propertyId` (required)

### `team_activity` — Team activity
Read-only.

Everyone's AI tokens, active time, tool runs, top website and cost, busiest first: who works the most.

Parameters:
- `days` — How many days back. Default 30.

### `user_activity` — One person's activity
Read-only.

One person's activity in detail: tokens per area, time and work per website, and the tools they used. Give their email (or user id from team_activity).

Parameters:
- `email`
- `userId`
- `days` — How many days back. Default 30.

### `ai_costs` — AI costs
Read-only.

API spend by day, model, feature and person, with the 20 most recent calls.

Parameters:
- `days` — How many days back. Default 30.

### `list_scheduled_posts` — Scheduled posts
Read-only.

Posts queued for publishing by MCP Chat, for everyone, with website, time (site-local), status and link once published. Soonest first.

Parameters:
- `status` — queued, running, done, failed or cancelled
- `from` — Only posts scheduled on or after this day.
- `to` — Only posts scheduled on or before this day.
- `limit` — Most rows to return. Default 100, max 500.

### `list_content_changes` — Content changes
Read-only.

Posts and pages MCP Chat created or edited, for everyone: what changed, on which website, who did it and when. Newest first.

Parameters:
- `days` — How many days back. Default 30.
- `limit` — Most rows to return. Default 100, max 500.

### `list_generation_jobs` — Post Writer jobs
Read-only.

Post Writer jobs for everyone and their status. Newest first.

Parameters:
- `status` — one of `idle`, `generating`, `completed`, `failed`
- `limit` — Most rows to return. Default 50, max 200.

### `list_tasks` — SEO tasks
Read-only.

SEO tasks with assignee, status, priority, website and due date. Most recently updated first.

Parameters:
- `status` — one of `todo`, `in_progress`, `review`, `done`
- `assignee` — Part of the assignee's name.
- `limit` — Most rows to return. Default 100, max 500.

### `list_strategy_sessions` — MCP Chat threads
Read-only.

MCP Chat threads per website (keyword research and content plans): who owns each, how long it is and when it was last used.

Parameters:
- `website` — Part of the website name or URL.
- `limit` — Most rows to return. Default 50, max 200.

## WordPress tools

### `quasar_guide` — How to use the WordPress tools
Read-only.

Read this first when you will work on a WordPress site: the rules (read before write, small edits with wp_patch_post_content, dry runs, confirm before deleting) and step-by-step recipes for common tasks (add a sentence or link to a post, SEO titles, menus, alt texts, new posts, backups).

Parameters:
- none

### `wp_list_sites` — List connected WordPress sites
Read-only.

All WordPress sites connected to Quasar (address, name, who connected it). Every other wp_ tool needs one of these addresses as "site". Use this first when the user names a site, to check it is connected. lastPostListSync is only when Quasar last copied the site's post list for its own pages — the wp_ tools always talk to the live site, so an old date does not matter for them.

Parameters:
- none

### `wp_site_overview` — Site overview
Read-only.

Basic facts about one site: name, tagline, URL, WordPress version, time zone and plugin settings. Use it to get oriented before working on a site.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.

### `wp_list_posts` — List posts
Read-only.

Posts on the site, newest first: ID, title, status, date, link, excerpt, categories. Use search to find a post by words in its title or text, status to filter (publish, draft, pending, future), and page for more results. Use the IDs with wp_get_post, wp_read_paragraphs and the editing tools.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `search` — Words to search for in title and content.
- `status` — one of `any`, `publish`, `draft`, `pending`, `future` — Default any.
- `page` — Page of results, 1 = newest. Default 1.
- `per_page` — Results per page, max 100. Default 30.

### `wp_list_pages` — List pages
Read-only.

Pages on the site (published, draft, private): ID, title, status, link. Use the IDs for menus (wp_manage_menus object_id), editing and as homepage (wp_update_site_setup page_on_front).

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.

### `wp_get_post` — Get a post with its SEO fields
Read-only.

One post or page in full: title, content (HTML), excerpt, slug, link, categories, tags, the SEO fields of the site's SEO plugin (Yoast or Rank Math), and (plugin 2.2.2+) the SEO title, meta description and focus keyword in effect on the page — also for Quasar custom page designs. Use before changing SEO fields or when you need the whole content.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).

### `wp_read_paragraphs` — Read a post paragraph by paragraph
Read-only.

The visible text of a post split into numbered blocks (paragraphs, headings, list items, table cells), as visitors read it. Use this before wp_patch_post_content: copy an exact sentence or paragraph from here into find_text. Works for posts and pages.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).

### `wp_list_categories` — List categories
Read-only.

Categories on the site with IDs, slugs and post counts. Use exact names from here when creating posts.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.

### `wp_list_tags` — List tags
Read-only.

Tags on the site with IDs, slugs and post counts.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.

### `wp_list_revisions` — List revisions of a post
Read-only.

Earlier saved versions of a post (WordPress revisions): date, author, preview. Use to see what changed or to tell the user an older version exists.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).

### `wp_patch_post_content` — Small edit to a post (sentence, paragraph, link)
**Changes the site — needs a manage key.**

The safe way to change part of an existing post or page: insert a sentence or paragraph before/after existing text, and/or turn existing words into a link. Everything else (blocks, images, tables, links, SEO fields, design) stays byte-for-byte the same, and only the body is saved.
How: 1) wp_read_paragraphs to see the text. 2) Copy an exact sentence or whole paragraph into find_text (must be unique, or pass occurrence). 3) insert_after or insert_before with the new text (simple HTML allowed, e.g. a link <a href="https://…">anchor</a>), and/or link_text + link_url. 4) Use dry_run: true to preview, then call again without it.
placement: auto (default) adds a new paragraph when find_text is a whole paragraph or heading, otherwise inserts in the same paragraph. The tool refuses instead of guessing: text not found (it suggests close matches), found more than once, Elementor or custom-design pages, or text already present. Posts with embeds, <style> blocks, scripts or forms: with plugin 2.2.2+ that markup is kept exactly as it is around the edit; an edit that would change it, or new text containing such markup, is refused with a Reason naming the markup and What to do — pass both on to the user. Recorded in Quasar History with Undo.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).
- `find_text` — Exact existing sentence or paragraph (as visitors read it). Needed for insert_before / insert_after.
- `occurrence` — Which match of find_text to use when it appears more than once (1 = first).
- `insert_before` — Text/HTML to insert before find_text.
- `insert_after` — Text/HTML to insert after find_text.
- `placement` — one of `auto`, `same_paragraph`, `new_paragraph` — Where inserted text goes. Default auto.
- `link_text` — Existing words to turn into a link (exact).
- `link_url` — Link address for link_text (https://… or /path/).
- `link_occurrence` — Which match of link_text to link when it appears more than once.
- `link_new_tab` — Open the link in a new tab.
- `link_rel` — Optional rel, e.g. "nofollow" or "sponsored".
- `allow_duplicate` — Insert even if the same text is already in the post.
- `dry_run` — Preview the exact change without saving.

### `wp_update_seo` — Update SEO fields of a post
**Changes the site — needs a manage key.**

Change a post's or page's SEO title, meta description and focus keyword (and optionally its title, slug, excerpt). Works with Yoast, Rank Math, SEOPress, no SEO plugin, and Quasar custom page designs: the values are written wherever the page reads them, page caches are cleared, and the live page is checked. live = "visible" only when the page shows the new values; otherwise result explains the Reason and What to do — tell the user both, never say it is live. Read the current values with wp_get_post first and tell the user old → new. Changing the slug changes the post's address: only do it when asked. Recorded in History with Undo.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).
- `title` — New post title (the H1 / visible title).
- `slug` — New URL slug. Changes the address — old links break unless redirected.
- `excerpt`
- `seo_title` — SEO title shown in Google (about 50-60 characters).
- `meta_description` — Meta description shown in Google (about 140-160 characters).
- `focus_keyword` — Main keyword the post should rank for.

### `wp_fix_seo` — Let AI fix a post's SEO fields
**Changes the site — needs a manage key.**

Audits one post and lets Quasar's AI write and apply better SEO fields (SEO title, meta description, focus keyword, social tags, schema type, canonical, robots). It does not rewrite the body. Uses AI credits. Prefer wp_update_seo when the user gave exact values. Recorded in History with Undo.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).

### `wp_create_post` — Create a post or page
**Changes the site — needs a manage key.**

Create a new post or page from HTML you wrote. Defaults to a draft — publish only when the user asked. The address (slug) is built cleanly from the title and checked. Pass image_prompts to have Quasar generate on-brand AI images and place them (one "featured" plus "after-section-1", "after-section-2"… — each prompt describes a scene, never text in the image); this takes a few minutes and uses credits. Use category names that exist (wp_list_categories). Undo in History moves the new post to the trash.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `title` (required)
- `content` (required) — Body in HTML (headings h2/h3, paragraphs, lists). Do not repeat the title as an H1.
- `post_type` — one of `post`, `page` — Default post.
- `status` — one of `draft`, `publish`, `future`, `pending`, `private` — Default draft. future needs scheduled_at.
- `scheduled_at` — Publish time in the site's local time, e.g. 2026-10-20T09:00 (sets status future).
- `excerpt`
- `slug` — Optional; built from the title if omitted.
- `categories` — Category names that exist on the site.
- `tags`
- `featured_image` — URL of an existing image (from wp_list_media) to use as featured image.
- `image_prompts` — AI images to generate and place: placement "featured" or "after-section-N"; prompt describes a scene.

### `wp_update_post` — Replace a post's title, body, excerpt, status or slug
**Changes the site — needs a manage key.**

Overwrites whole fields of a post. For small changes to the body use wp_patch_post_content instead — sending a full body risks losing blocks, embeds and formatting. Use this only when the user wants the whole text replaced or a status change. Recorded in History with Undo.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).
- `title`
- `content` — The COMPLETE new body (HTML). Everything not included is removed.
- `excerpt`
- `status` — one of `draft`, `publish`, `pending`, `private`
- `slug`

### `wp_publish_post` — Publish a post now
**Changes the site — needs a manage key.**

Makes a draft (or scheduled) post live immediately. Only when the user asked to publish. Recorded in History with Undo.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).

### `wp_schedule_post` — Schedule a post
**Changes the site — needs a manage key.**

Sets a post to publish automatically at a future time (site's local time). WordPress publishes it then. Recorded in History with Undo.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).
- `scheduled_at` (required) — Site-local time, e.g. 2026-10-20T09:00.

### `wp_delete_post` — Move a post to the trash
**Changes the site — needs a manage key.** Destructive: asks for `confirm: true` after the user agreed.

Moves a post or page to the WordPress trash (it can be restored in WordPress → Trash, or with Undo in Quasar's History). Needs confirm: true after the user agreed — say first which post (ID and title) will be removed. Permanent deletion is not offered here.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).
- `confirm` — Set true ONLY after the user has explicitly agreed to this specific change in their own words. Without it the tool explains what would happen and changes nothing.

### `wp_schedule_many_posts` — Write and schedule many posts with AI
**Changes the site — needs a manage key.**

Queues many posts to be written by Quasar's AI (with images, like the Post Writer) and scheduled in WordPress, e.g. "20 posts, one per day at 9:00 from 1 November". Give topics + start_at + every_days/every_hours, or explicit items with their own times. Runs in the background; follow it with wp_post_queue. Uses AI credits. Ask for the start date/time if the user did not give one.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `topics` — One topic per post (include the target keyword). Scheduled evenly from start_at.
- `start_at` — First publish time, site-local, e.g. 2026-11-01T09:00 (with topics).
- `every_days` — Days between posts (with topics).
- `every_hours` — Hours between posts (with topics).
- `weekdays_only`
- `items` — Explicit list instead of topics, each with its own scheduledAt.
- `post_type` — one of `post`, `page`
- `categories`
- `tags`

### `wp_post_queue` — Progress of queued AI posts
Read-only.

Shows posts queued with wp_schedule_many_posts: waiting, being written, scheduled in WordPress, or failed (with the reason).

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `batch_id`

### `wp_cancel_post_queue` — Cancel queued AI posts
**Changes the site — needs a manage key.**

Cancels queued posts that have not been written yet (posts already in WordPress are not touched).

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `batch_id` — Only this batch; omit to cancel all waiting posts of the site owner.

### `wp_list_menus` — List menus and menu items
Read-only.

Without menu_id: the site's menus and the theme's menu locations (which menu shows where, e.g. primary/footer). With menu_id: that menu's items (ID, label, link, position, parent). Use before wp_manage_menus. If the theme has no menu locations it probably uses block-based navigation, which these tools can't change.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `menu_id`

### `wp_manage_menus` — Change menus
**Changes the site — needs a manage key.** Destructive: asks for `confirm: true` after the user agreed.

Actions: create (new menu: name), add_item (menu_id + object_id of a page/post/category, or url for a custom link; optional title, parent_id to nest, position), update_item (item_id + fields), delete_item (item_id, needs confirm), delete (whole menu, needs confirm), assign_location (show menu_id in a theme location; menu_id 0 empties it). Get IDs from wp_list_menus and wp_list_pages first.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `action` (required) — one of `create`, `add_item`, `update_item`, `delete_item`, `delete`, `assign_location`
- `menu_id`
- `item_id`
- `name` — Name of a new menu (create).
- `title` — Label in the menu; leave empty to use the page's own title.
- `object_id` — Page, post or category ID the item links to.
- `object_type` — Only for categories/tags: "category" or "post_tag".
- `url` — Custom link instead of object_id.
- `parent_id` — Item ID to nest under; 0 = top level.
- `position` — Order, 1 = first.
- `new_tab`
- `location` — Theme location slug from wp_list_menus (assign_location).
- `confirm` — Set true ONLY after the user has explicitly agreed to this specific change in their own words. Without it the tool explains what would happen and changes nothing.

### `wp_get_site_setup` — Read site setup
Read-only.

Site title, tagline, homepage and posts page, permalink structure, time zone, date/time format, posts per page, search engine visibility, comments, site icon, theme and WordPress version.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.

### `wp_update_site_setup` — Change site setup
**Changes the site — needs a manage key.**

Change basic settings; pass only what changes in settings. Keys: blogname, blogdescription, show_on_front ("posts"|"page"), page_on_front / page_for_posts (page IDs), permalink_structure (e.g. "/%postname%/"), timezone_string (e.g. "Europe/Amsterdam"), date_format, time_format, start_of_week (0-6), posts_per_page, blog_public (1 visible to search engines, 0 hidden), default_comment_status ("open"|"closed"), site_icon (image media ID). Hiding from search engines and permalink changes need confirm. The reply lists old → new values.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `settings` (required)
- `confirm` — Set true ONLY after the user has explicitly agreed to this specific change in their own words. Without it the tool explains what would happen and changes nothing.

### `wp_get_site_seo` — Read homepage SEO settings
Read-only.

Site name and tagline plus the SEO plugin's homepage title and meta description (Yoast or Rank Math) and which SEO plugin is active.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.

### `wp_update_site_seo` — Change homepage SEO settings
**Changes the site — needs a manage key.**

Set the homepage SEO title and meta description in Yoast or Rank Math, and the site name/tagline. Read the current values first (wp_get_site_seo) and tell the user old → new.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `site_name`
- `tagline`
- `homepage_seo_title`
- `homepage_meta_description`

### `wp_list_media` — List or read media files
Read-only.

Without media_id: files in the media library (search by name), with ID, title, alt text and URL. With media_id: one file's details (size, caption). Use to find images for posts or to find images missing alt text.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `search`
- `media_id`

### `wp_manage_media` — Change media files
**Changes the site — needs a manage key.** Destructive: asks for `confirm: true` after the user agreed.

Actions: update (media_id + title/alt/caption/description — good alt text describes the image in the page's language), upload_from_url (url of a public image/file, optional title, alt, attach_to post ID), delete (media_id, needs confirm; deleting is permanent and refused while posts still use the file unless even_if_used).

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `action` (required) — one of `update`, `upload_from_url`, `delete`
- `media_id`
- `url`
- `title`
- `alt`
- `caption`
- `description`
- `attach_to`
- `even_if_used`
- `confirm` — Set true ONLY after the user has explicitly agreed to this specific change in their own words. Without it the tool explains what would happen and changes nothing.

### `ai_generate_images` — Generate AI images
**Changes the site — needs a manage key.**

Generates on-brand AI images (Quasar's image flow: brand colours and logo, no text in images) and returns their URLs, e.g. to upload with wp_manage_media upload_from_url or use in wp_create_post. Each prompt describes a scene. Uses credits; takes a while.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `title` — Title of the post the images are for (helps the style).
- `image_prompts` (required)

### `wp_list_plugins` — List plugins
Read-only.

Installed plugins: name, version, active or not, update available. Read-only: installing, updating and switching plugins on/off is done by the user in WordPress → Plugins.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.

### `wp_backup_status` — Backup status (UpdraftPlus)
Read-only.

Whether UpdraftPlus is installed and active, recent backups with what they contain, running jobs, and the link where the user restores a backup in UpdraftPlus.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.

### `wp_run_backup` — Start a backup (UpdraftPlus)
**Changes the site — needs a manage key.**

Starts an UpdraftPlus backup in the background: what = all (default), database or files. Suggest it before big changes. Check progress with wp_backup_status. Needs UpdraftPlus installed and active.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `what` — one of `all`, `database`, `files`

### `wp_get_render_settings` — Read custom design settings
Read-only.

Site-wide header, footer and head code used by custom-designed pages, and which header/footer sources exist (custom code, extracted landing-page template, Elementor templates, theme).

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.

### `wp_update_custom_render` — Set a custom page design
**Changes the site — needs a manage key.**

Replaces a page's theme layout with your own HTML and CSS (custom render, stored for the site's Custom Web Render). When enabled, visitors see this HTML instead of the post body — always send the complete page body in html (enabling a page that has no HTML is refused). Choose header_type/footer_type from wp_get_render_settings ("global" = the site-wide setting); choosing one also switches the header/footer on (use_global_header / use_global_footer). The reply says whether a header and footer will show. Put styles in css, not in <style> tags inside html (WordPress removes those).
Limits of the dashboard connection: the HTML goes through WordPress's post filter — the reply lists any tags it removed (for example svg, form, iframe); JavaScript is not accepted. Tell the user when the reply mentions either; those parts can be added in WordPress (Custom Web Render) or through the site's own Custom Web Render MCP connection. Needs plugin 2.2.1+ (older plugins are reported, nothing is claimed). Recorded in History with Undo.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `post_id` (required) — WordPress post or page ID (from wp_list_posts / wp_list_pages).
- `html` — Complete page body HTML.
- `css`
- `js` — Not accepted through the dashboard connection; the reply says it was ignored.
- `enabled` — Default true; false switches custom design off (the normal post body shows again).
- `header_type` — one of `global`, `custom`, `elementor`, `theme`, `extracted`, `none`
- `footer_type` — one of `global`, `custom`, `elementor`, `theme`, `extracted`, `none`
- `header_elementor_id`
- `footer_elementor_id`
- `use_global_header` — Show a header on this page. The page renderer shows NO header unless this is on, whatever header_type says. Defaults to true when you pass a header_type other than "none" (and false for "none"); pass it to change only this switch.
- `use_global_footer` — Show a footer on this page. The page renderer shows NO footer unless this is on, whatever footer_type says. Defaults to true when you pass a footer_type other than "none" (and false for "none"); pass it to change only this switch.

### `wp_update_global_render` — Set site-wide header/footer for custom designs
**Changes the site — needs a manage key.**

Sets the site-wide header and footer (or their source: custom, elementor, theme, extracted) used by every custom-designed page. Affects many pages at once — read wp_get_render_settings first and confirm the plan with the user. Header/footer HTML goes through WordPress's post filter (removed tags are reported); <head> code is not accepted through the dashboard connection. Needs plugin 2.2.1+.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `header`
- `footer`
- `head` — Not accepted through the dashboard connection; the reply says it was ignored.
- `header_type` — one of `custom`, `elementor`, `theme`, `extracted`
- `footer_type` — one of `custom`, `elementor`, `theme`, `extracted`
- `header_elementor_id`
- `footer_elementor_id`

### `seo_analyze_url` — SEO audit of a page
Read-only.

Checks a live page: title and meta description length, headings, word count, image alt texts, internal/external links, canonical, robots, schema, social tags. use_ai adds AI recommendations (uses credits). Works for any public URL. Needs "site" only to know whose AI settings to use — pass the site the page belongs to.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `url` (required)
- `use_ai`

### `seo_get_page_schema` — Read a page's structured data
Read-only.

The JSON-LD structured data (schema.org) currently on a live page. Use to check FAQ/Article/Organization schema before suggesting changes.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `url` (required)

### `seo_generate_schema` — Generate structured data with AI
Read-only.

Writes JSON-LD (FAQPage, Organization, Article, Review or all) for a page with AI and returns it. It does NOT save it to the site. Uses credits.

Parameters:
- `site` (required) — WordPress site address, e.g. "https://quasarliving.com" or just "quasarliving.com". Use one of the wordpressSites from list_websites or wp_list_sites.
- `url` (required)
- `schema_type` (required) — one of `faq`, `organization`, `article`, `review`, `all`
- `company_name`
