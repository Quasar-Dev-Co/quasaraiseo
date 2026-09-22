=== Quasar AI SEO ===
Contributors: teamquasara
Tags: schema, structured data, json-ld, seo, ai, openai, faq, rich snippets, custom html, custom css, landing page, page builder, mcp, media library
Requires at least: 5.8
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 2.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

One WordPress plugin for the Quasar dashboard connection, custom HTML/CSS/JS page rendering, the MCP server, and AI JSON-LD schema.

== Description ==

Quasar AI SEO is one plugin. It connects the site to the Quasar dashboard and includes custom rendering, MCP, and schema.

**Quasar dashboard**

* Connect from the Quasar AI SEO admin menu with the site token.
* Publish and schedule posts and pages from the Quasar dashboard.
* Receive generated images in the WordPress media library.
* Delete a post or page from Quasar and remove it on this site.

**Custom Web Render + MCP**

* Render selected WordPress pages and posts from trusted custom HTML, CSS, and JavaScript.
* Manage SEO metadata (title, description, focus keyword, canonical, robots, schema, social).
* Run optional OpenRouter AI SEO analysis with Scan SEO, AI Analyze, and AI Fix All.
* Secure Streamable HTTP MCP server for Codex, Claude Code, Cursor, and Windsurf.
* MCP tools: list_content, get_content, create_content, update_content, delete_content, list_categories, list_tags, get_revisions, update_seo, analyze_seo, publish_content, schedule_content, update_custom_render, get_global_render, update_global_render, list_media, get_media, get_schema, generate_schema, regenerate_schema_type, save_schema_type, delete_schema_type, get_schema_settings, update_schema_settings.
* Media library access tools — when an AI client writes a blog post or page and mentions a media image name, it can search the WordPress media library and embed the correct URL automatically.
* Design Code page — fetches the live homepage and extracts the real header, footer, body, and head code, plus the logo image, color palette, fonts, navigation links, and page meta in copy-ready sections.
* Global header, footer, and head-injection code reusable across custom-rendered pages.

**QuasarAISEO Schema**

* Automatically generates AI-powered JSON-LD schema (FAQ, Organization, Article, Review) for every post and page using OpenAI.
* Company profile, reviews, tone, and language settings with manual edit/review/delete.
* Single @graph block with stable @id references per schema.org best practices.
* Frontend FAQ accordion display with customizable colors, layout, and icons.

**Email Approval Gate**

On activation, the plugin emails an approval request to team.quasara@gmail.com. AI features (schema generation, MCP server, AI SEO analysis) are disabled until the site is approved. A bypass password is available for instant activation without waiting for email approval.

== Important Security Note ==

This plugin is designed for trusted administrators. Custom render code stores and renders HTML and JavaScript exactly as entered, because that is the purpose of the plugin. Only trusted users should have administrator access.

All plugin data is preserved when the plugin is deleted so a delete and reinstall can load existing pages/posts again. To intentionally erase all plugin data during uninstall, define `CWR_DELETE_DATA_ON_UNINSTALL` as `true` before deleting the plugin.

== Installation ==

1. Upload the plugin zip through WordPress Plugins → Add New → Upload.
2. Activate Quasar AI SEO. Deactivate the older Quasar AI SEO Assistant plugin and the QuasarAISEO Addons Pack if they are still installed.
3. Open Quasar AI SEO in the WordPress admin menu and connect the site to the dashboard.
4. An approval email is sent to team.quasara@gmail.com on activation. Wait for approval before MCP and schema AI features work (or use the bypass password on the Status tab). The dashboard connection does not wait on that approval.
5. Open Custom Web Render for page rendering, SEO, MCP, and Design Code.
6. Open QuasarAISEO for schema settings, company profile, reviews, tone, and FAQ display.

== Changelog ==

= 2.1.0 =
Combined the Quasar dashboard connector (2.0.2) and the QuasarAISEO Addons Pack (1.3.0) into this one plugin. The dashboard still uses quasar-ai-seo/v1 and the connection token. MCP stays at custom-web-render/v1/mcp. Deactivating the plugin keeps the dashboard connection token.

= 1.3.0 =
Combined the Custom Web Render plugin and the QuasarAISEO Schema plugin into a single plugin: QuasarAISEO Addons Pack by team quasara. The email approval gate from QuasarAISEO Schema now protects all AI features across both systems — MCP token creation, client config downloads, and all MCP tool calls are blocked until the site is approved. Added Media Access MCP tools (list_media, get_media) for searching the WordPress media library by image name. Added Schema MCP tools (get_schema, generate_schema, regenerate_schema_type, save_schema_type, delete_schema_type, get_schema_settings, update_schema_settings) so AI clients can manage JSON-LD schema via the same MCP server. Added a Design Code admin page that fetches the live homepage and extracts the real header, footer, body, head code, logo image, color palette, fonts, navigation links, and page meta. Added full CRUD MCP tools: delete_content, list_categories, list_tags, get_revisions. Added one-click MCP client connectors for Cursor, Claude Desktop, Windsurf, and Codex.

= 1.2.8 =
Added full CRUD MCP tools: delete_content, list_categories, list_tags, get_revisions. Added category and tag support to create_content and update_content.

= 1.2.7 =
Added one-click MCP client connectors.

= 1.2.6 =
Preserved render code and AI settings on plugin delete/reinstall.

= 1.2.0 =
Added the SEO fixer dashboard, per-page/post Scan SEO, AI Analyze, AI Fix All, OpenRouter integration, and MCP SEO analysis support.

= 1.1.0 =
Added the authenticated MCP server, client connection setup, content/SEO/render tools, native post scheduling, scoped tokens, and activity logs.

= 1.0.0 =
Initial release of Custom Web Render and QuasarAISEO Schema as separate plugins.
