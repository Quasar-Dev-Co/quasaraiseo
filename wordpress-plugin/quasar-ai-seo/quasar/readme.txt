=== QuasarAISEO Schema ===
Contributors: teamquasara
Tags: schema, structured data, json-ld, seo, ai, openai, faq, rich snippets
Requires at least: 5.8
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Automatically generates AI-powered JSON-LD schema (FAQ, Organization, Article, Review) for every post and page using OpenAI, with manual edit/review/delete, company profile, reviews, tone, and language settings.

== Description ==

QuasarAISEO Schema is an AI-powered structured-data generator by team quasara. It uses OpenAI to automatically produce schema.org JSON-LD for every post and page on your site, then lets you manually edit, review, and delete the generated schema.

**Features**

* **Automatic generation** — on post/page save, the plugin sends content to OpenAI and stores validated JSON-LD schema as post meta.
* **Four schema types** — FAQPage (AI-generated Q&A), Organization / LocalBusiness (from your company profile), Article / BlogPosting (AI-generated metadata), Review / AggregateRating (from your reviews list).
* **Single @graph block** — all schema types are merged into one `<script type="application/ld+json">` block in `wp_head`, using stable `@id` references per schema.org best practices.
* **Manual control** — a meta box on the post edit screen lets you view, edit, regenerate, delete, and revert the schema for any post.
* **Company profile** — set your organization name, address, contact, logo, social profiles, founding date, and more. Used as the publisher in Article schema and output site-wide as Organization schema.
* **Reviews** — add individual reviews and an aggregate rating; the plugin outputs Review and AggregateRating schema.
* **Tone & language** — choose the tone (professional, friendly, casual, authoritative, conversational, or custom) and the output language (30+ languages) for AI-generated schema text.
* **Approval gate** — on activation, the plugin emails an approval request to team.quasara@gmail.com. AI generation is disabled until the site is approved.

= How it works =

1. On activation, an approval email is sent to team.quasara@gmail.com. Click the Approve button in that email to enable AI generation.
2. Fill out the Company Profile tab in QuasarAISEO settings.
3. (Optional) Add reviews in the Reviews tab.
4. Choose tone and language in the Tone & Language tab.
5. Save or update any post/page — the plugin generates schema in the background (via WP-Cron) and outputs it in `wp_head`.
6. Edit the schema manually from the post edit screen meta box if needed.

= Notes on FAQ rich results =

Google restricted FAQ rich results to government and health sites in August 2023. FAQ schema markup still provides value because AI systems (ChatGPT, Perplexity, Gemini, Google AI Overviews) extract FAQ data for citations, and it improves content organization signals.

== Installation ==

1. Upload the `quasar-ai-seo-schema` folder to `/wp-content/plugins/`.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. An approval email is sent to team.quasara@gmail.com on activation. Wait for approval before AI generation works.
4. Go to **QuasarAISEO** in the admin menu to configure your company profile, schema types, reviews, tone, and language.
5. Save or update a post/page to auto-generate schema.

== Frequently Asked Questions ==

= Where is the OpenAI API key stored? =

The OpenAI API key is bundled with the plugin and managed by team quasara. Site owners do not need their own key.

= The plugin says "awaiting approval". What do I do? =

On activation, an approval email is sent to team.quasara@gmail.com. Once team quasara clicks the Approve button in that email, AI generation is enabled on your site. You can resend the approval email from the Status tab.

= Can I edit the generated schema? =

Yes. Each post/page has a "QuasarAISEO Schema" meta box where you can view, edit, regenerate, delete, and revert the schema.

= Does it work with custom post types? =

Yes, for any post type that is publicly viewable (`is_post_type_viewable`). The meta box is registered on Posts and Pages by default.

= Is the schema valid? =

Generated JSON-LD is validated against schema.org requirements (headline length, FAQ minimum questions, absolute URLs, valid dates, etc.) before being stored. You can verify output at https://validator.schema.org/.

== Changelog ==

= 1.0.0 =
* Initial release.
* AI-generated FAQPage, Organization, Article/BlogPosting, Review/AggregateRating schema.
* Company profile, reviews, tone, and language settings.
* Manual edit/regenerate/delete via post meta box.
* First-install email approval gate to team.quasara@gmail.com.
