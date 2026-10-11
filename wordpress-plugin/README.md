# WordPress plugins

- **`quasar-ai-seo/`: the plugin installed on client sites** ("Quasar AI SEO", one bundle: dashboard connector, Custom Web Render, MCP server, AI JSON-LD schema). Build `quasar-ai-seo-<version>.zip` from this folder; the zip must contain the folder `quasar-ai-seo/` with `quasar-ai-seo.php`, so WordPress offers "Replace current with uploaded" when it is uploaded over the installed version.
  - 2.2.1: the connector's custom-render and global-render routes store designs in the Custom Web Render fields the renderer reads (HTML filtered, JS/head code not accepted through the token).
  - `includes/quasar-site-tools.php` (2.2.0): exact post body route for MCP Chat's `patch_post_content`, and the site tools (menus, site setup, media, plugin list, UpdraftPlus backups).
- `quasar-ai-seo-ten/` and the `quasar-ai-seo-2.0.x.zip` / `quasar-ai-seo-ten.zip` files: the older connector-only plugin, kept for reference. Do not install them on sites that run the bundle — WordPress would add them as a second plugin.

Upgrading a site: WordPress → Plugins → Add New → Upload Plugin → choose the zip → **Replace current with uploaded**. Do not remove the old version first. The connection token is kept, so the site stays connected.
