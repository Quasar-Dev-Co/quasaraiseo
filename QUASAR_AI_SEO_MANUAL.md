# Quasar AI SEO — Complete Documentation & Operating Manual

> **System Overview**: Quasar AI SEO is an enterprise-grade AI SEO operating platform consisting of a **Next.js 16 (React 19)** frontend (`quasaraiseo`) and an **Express 5 + Prisma ORM + Redis / BullMQ** backend (`quasar-ai-seo-backend`). It powers AI keyword research, topic clustering, pillar/cluster blog creation, multi-client website targeting, automated WordPress publishing, technical SEO audits, and external Model Context Protocol (MCP) tool routing.

---

## Table of Contents
1. [Architecture & System Structure](#1-architecture--system-structure)
2. [Environment Configuration & Setup](#2-environment-configuration--setup)
3. [Quasar MCP Workspace (`/content-strategy`)](#3-quasar-mcp-workspace-content-strategy)
   - [Target Website Architecture & Profiles](#target-website-architecture--profiles)
   - [Custom AI Prompt Instructions](#custom-ai-prompt-instructions)
   - [Slash Commands Palette](#slash-commands-palette)
   - [Chat Thread Isolation & Persistence](#chat-thread-isolation--persistence)
4. [AI Content Engine & WordPress Publisher (`/post-create`)](#4-ai-content-engine--wordpress-publisher-post-create)
5. [Audit Studio & Skill Runner (`/audit-mcp`)](#5-audit-studio--skill-runner-audit-mcp)
6. [External MCP Server Connections (`/additional-mcp`)](#6-external-mcp-server-connections-additional-mcp)
7. [WordPress Plugin (`quasar-ai-seo-assistant`)](#7-wordpress-plugin-quasar-ai-seo-assistant)
8. [Task Management & Sprint Tracker (`/task-management`)](#8-task-management--sprint-tracker-task-management)
9. [Branding & Identity System (`/branding`)](#9-branding--identity-system-branding)
10. [Google Integrations (`/google/search-console` & `/google/analytics`)](#10-google-integrations)
11. [AI Model Sync & Provider Settings (`/setting`)](#11-ai-model-sync--provider-settings-setting)
12. [Step-by-Step Practical Examples](#12-step-by-step-practical-examples)
13. [Troubleshooting & FAQs](#13-troubleshooting--faqs)

---

## 1. Architecture & System Structure

```
                           ┌─────────────────────────────────────────┐
                           │            Vercel Frontend              │
                           │   quasaraiseo (Next.js 16, React 19)    │
                           │       https://seo.quasarasoft.com       │
                           └────────────────────┬────────────────────┘
                                                │ REST / Bearer Token
                                                ▼
                           ┌─────────────────────────────────────────┐
                           │              API Backend                │
                           │   quasar-ai-seo-backend (Express 5)     │
                           │     https://api.seo.quasarasoft.com     │
                           └────────┬──────────────────────┬─────────┘
                                    │                      │
          ┌─────────────────────────┴─────────┐            └─────────────────────────┐
          ▼                                   ▼                                      ▼
┌──────────────────┐               ┌────────────────────┐                 ┌──────────────────────┐
│  PostgreSQL DB   │               │   Redis + BullMQ   │                 │   External MCPs      │
│  (Supabase / DB) │               │ Image / Audit Jobs │                 │ (WordPress / Stream) │
└──────────────────┘               └────────────────────┘                 └──────────────────────┘
```

### Key Repositories
- **Frontend**: `/agent/repos/quasaraiseo`
  - Routes: `/`, `/dashboard`, `/content-strategy`, `/post-create`, `/audit-mcp`, `/additional-mcp`, `/task-management`, `/branding`, `/wordpress`, `/google/*`, `/setting`.
  - State: Redux Toolkit (`mcpSlice`, `auditSlice`, `postSlice`, `taskSlice`) + local storage fallbacks.
- **Backend**: `/agent/repos/quasar-ai-seo-backend`
  - Core Modules: `auth`, `ai-provider`, `agent`, `keyword-research`, `wordpress`, `mcp-connections`, `google`, `web-builder`, `tasks`, `branding`, `security`.
  - Background Queues: BullMQ queues for `image-generation` and `audit-processing`.

---

## 2. Environment Configuration & Setup

### Frontend Environment Variables (`quasaraiseo/.env.local`)
```ini
NEXT_PUBLIC_API_URL="https://api.seo.quasarasoft.com"
CRON_SECRET="your-secure-cron-secret"
```

### Backend Environment Variables (`quasar-ai-seo-backend/.env`)
```ini
PORT=8080
APP_URL="https://api.seo.quasarasoft.com"
FRONTEND_URL="https://seo.quasarasoft.com"
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB_NAME]"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="your-jwt-signing-secret-minimum-32-chars"
JWT_EXPIRES_IN="30d"

# AI Providers
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
OPENAI_IMAGE_MODEL="gpt-image-2"

# Object Storage (AWS S3)
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="quasar-seo-assets"

# External SEO Integrations
DATAFORSEO_LOGIN="..."
DATAFORSEO_PASSWORD="..."
SERPAPI_KEY="..."
```

---

## 3. Quasar MCP Workspace (`/content-strategy`)

Quasar MCP is an interactive autonomous SEO agent and strategy workstation. It runs iterative multi-tool calls to plan keywords, audit technical SEO, scrape SERPs, and interact directly with connected WordPress sites.

### Target Website Architecture & Profiles
Every chat thread can be bound to a specific client website:
1. **Binding Context**:
   - Website Name (e.g., `CodeMyPixel`)
   - Website URL (e.g., `https://codemypixel.com`)
   - Website Logo URL (displayed in chat headers and thread list)
   - Assigned MCP Server (routes WordPress tools specifically to that site's MCP server)
2. **Top Configuration Bar**:
   - Located at the top of the chat area.
   - Shows active logo, website name, target domain, and MCP connection status.
   - Click **"Configure Site"** to open the real-time drawer to adjust instructions, upload logos, or switch assigned MCP endpoints.
   - Click **"Quick Select Existing Website"** to immediately auto-fill from saved Brandings or connected WordPress sites.

### Custom AI Prompt Instructions
You can supply dedicated instructions per website in the **Configure Site** drawer or when creating a new chat:
- Example:
  ```text
  Always write in British English. Maintain an authoritative B2B agency tone. Focus on automation keywords (n8n, Make, AI Agents) in the UK & European markets. Never mention competitor BrandX.
  ```
- **How it works internally**: The backend receives these instructions and injects them into the agent's core system prompt on every turn. The agent strictly respects these rules during content generation, research, and audit analysis.

### Slash Commands Palette
Type `/` into the chat input or click any quick command chip above the input box:

| Command | Action Name | What It Does & Prompt Payload |
|---|---|---|
| `/compact` | Compact Conversation | Instructs the agent to summarize all previous findings, keywords, and decisions into a concise executive briefing so context is retained with lower token consumption. |
| `/generate-post` | Generate Blog Post | Prompts the AI to generate a full, publish-ready blog article tailored to the active website, complete with `<h2>`, `<h3>`, bullet lists, comparison tables, FAQ section, call-to-action, and JSON-LD schema ready for WordPress. |
| `/generate-page` | Generate Landing Page | Prompts the AI to build a complete high-converting landing page structure with hero section, trust badges, feature grid, comparison table, testimonials, and FAQ schema. |
| `/security-inspect` | Security & SEO Inspection | Audits HTTPS/SSL, HTTP response security headers (CSP, HSTS, X-Frame-Options), robots.txt rules, AI crawler access permissions (GPTBot, ClaudeBot, PerplexityBot), canonical tags, and schema markup. |

### Chat Thread Isolation & Persistence
- Threads are displayed in the left sidebar under **Chat Threads**.
- **Dual-Layer Persistence**: Threads are stored in the database and backed up to browser local storage.
- **Isolated Switching**: Switching from `CodeMyPixel` to another client chat instantly switches the active website profile, top banner, instructions, and tool routing without cross-contaminating conversations.
- **60-Turn AI Memory**: The backend memory retains up to 60 previous messages, allowing deep iterative strategy discussions without losing context.

---

## 4. AI Content Engine & WordPress Publisher (`/post-create`)

The **Post Create** module specializes in turning content briefs, pillar topics, and cluster outlines into live published articles.

### Features
1. **Pillar $\rightarrow$ Cluster Content Generation**:
   - Reference a pillar page outline to create supporting cluster articles that automatically link back up to the pillar.
2. **Branding & Voice Synchronization**:
   - Select a branding profile so the content incorporates the brand's primary color, voice, target audience, and disclaimers.
3. **AI Image Generation**:
   - Generates featured images and section illustrations via `gpt-image-2`.
   - Automatically stores images on AWS S3 and injects `<figure class="wp-block-image">` tags directly into the HTML body.
4. **Direct WordPress Publishing**:
   - Publish immediately as `publish`, save as `draft`, or schedule for `future`.
   - Injects clean JSON-LD `<script type="application/ld+json">` schema metadata into the post.

---

## 5. Audit Studio & Skill Runner (`/audit-mcp`)

Audit Studio executes deep-dive SEO audits using uploadable skills (`SKILL.md` + Python scripts).

### How to Run an Audit
1. Go to `/audit-mcp`.
2. Choose a skill (e.g., `seo-audit`, `aeo-page-audit`, `ai-visibility-30-day-plan`).
3. Enter your target domain or URL.
4. Select your preferred AI reasoning model (e.g., `gpt-4o`, `claude-3.5-sonnet`, `o3-mini`).
5. Click **Run Audit**:
   - The backend crawler crawls the site, extracts HTML signals, headings, links, robots.txt, and AI crawler rules.
   - The agent analyzes content thinness, indexability, speed, and schema markup.
   - Outputs a structured downloadable **PDF report** and JSON export.

---

## 6. External MCP Server Connections (`/additional-mcp`)

Quasar AI SEO supports the **Model Context Protocol (MCP)** via Streamable HTTP (JSON-RPC), allowing the agent to use external tool catalogs (such as the Custom Web Render plugin).

### Connecting a New MCP Server
1. Navigate to `/additional-mcp`.
2. Click **Add MCP Connection**.
3. Fill in:
   - **Connection Name**: e.g. `CodeMyPixel Remote MCP`
   - **MCP Server URL**: e.g. `https://codemypixel.com/wp-json/custom-web-render/v1/mcp`
   - **Bearer Token**: The secret authorization key configured on that site.
4. Click **Test & Save**:
   - Quasar connects via the `initialize` handshake and fetches available tools (`create_content`, `update_custom_render`, `update_seo`, etc.).
5. **Assigning to Chats**: In `/content-strategy`, open the **Configure Site** drawer and assign this MCP server so all agent actions for that client route through this endpoint.

---

## 7. WordPress Plugin (`quasar-ai-seo-assistant`)

The repository includes a production-ready companion WordPress plugin located at:
`/agent/repos/quasaraiseo/wordpress-plugin/quasar-ai-seo-ten`

### Installation
1. Package the folder into a zip file:
   ```bash
   cd /agent/repos/quasaraiseo/wordpress-plugin
   zip -r quasar-ai-seo-assistant.zip quasar-ai-seo-ten/
   ```
2. In your WordPress Admin (`/wp-admin`), go to **Plugins** $\rightarrow$ **Add New** $\rightarrow$ **Upload Plugin**.
3. Upload `quasar-ai-seo-assistant.zip` and click **Activate**.
4. Go to the **Quasar AI SEO** menu item.
5. Copy the generated **Connection Token**.
6. In Quasar, go to `/wordpress`, click **Connect Site**, and input your WordPress URL and Token.

---

## 8. Task Management & Sprint Tracker (`/task-management`)

The Task Management board provides Kanban and list tracking for technical SEO and content deliverables.

### Supported Fields
- **Status**: `To Do`, `In Progress`, `Review`, `Done`
- **Priority**: `Low`, `Medium`, `High`, `Urgent`
- **Work Types**: `Technical SEO`, `Content Optimization`, `Link Building`, `Keyword Research`, `Site Audit`, `Schema Markup`, `Core Web Vitals`
- **Comments & Progress**: Add progress percentages (0–100%) and collaborate via timestamped team comments.

---

## 9. Branding & Identity System (`/branding`)

Store client brand profiles to ensure AI generated content and keyword reports reflect their authentic brand guidelines.

### Profile Properties
- Company Name, Tagline, Description, Industry.
- Brand Colors (Hex code) & Logo upload (stored in AWS S3).
- Social Links (Twitter, LinkedIn, Facebook, Instagram, YouTube).
- **Auto-Extraction**: Enter a website URL and click **Extract Brand Info**; the AI crawler reads the website and automatically extracts the tagline, color palette, description, and contact info.

---

## 10. Google Integrations

Connect Google accounts via OAuth2 to pull verified performance telemetry into your Quasar dashboard and MCP agent tools.

- **Google Search Console (`/google/search-console`)**:
  - Top search queries, impressions, clicks, click-through-rate (CTR), and average rankings.
  - Sitemaps submission & status inspection.
  - URL Inspection: checks Google indexing state, mobile usability, and rich results.
- **Google Analytics 4 (`/google/analytics`)**:
  - Real-time active users and session metrics.
  - Traffic source breakdowns and conversion trends.

---

## 11. AI Model Sync & Provider Settings (`/setting`)

### Managing API Keys
1. Go to `/setting` $\rightarrow$ **AI Provider**.
2. Select your provider:
   - **OpenAI**: Enter your secret API key (`sk-...`).
   - **OpenRouter**: Enter your OpenRouter key for access to Anthropic Claude, Meta Llama, DeepSeek, and Google Gemini models.
3. Keys are encrypted at rest on the backend using AES-256-CBC.

### Automated Hourly Model Sync
- Vercel Cron runs hourly on `/api/cron/sync-models` (configured via `vercel.json`).
- Automatically queries provider APIs to discover newly released models and add them to your model selector without requiring code updates.

---

## 12. Step-by-Step Practical Examples

### Example A: Running an SEO Strategy for a New Client Website

1. Navigate to `/content-strategy`.
2. Click **"New Website Chat"**.
3. Enter:
   - **Website Name**: `CodeMyPixel`
   - **Website URL**: `https://codemypixel.com`
   - **Additional Instructions**: `Focus on AI workflows, n8n integrations, and SaaS backends. Target European enterprise clients.`
4. Click **Start Chat**.
5. Type:
   ```text
   Find 50 high-intent keywords for our services, cluster them into topic pillars, and recommend the best 5 quick wins.
   ```
6. The agent searches the web, analyzes the domain, compiles the keyword clusters, and offers to export a structured PDF report.

### Example B: Using Slash Commands to Publish an Article

1. In the `CodeMyPixel` chat thread, click the `/generate-post` chip or type:
   ```text
   /generate-post Write a comprehensive guide on Self-Hosted n8n Architecture vs Cloud
   ```
2. The agent generates the complete HTML body, meta title, meta description, and schema markup tailored to `CodeMyPixel`.
3. To send this to WordPress:
   ```text
   Publish this article to our connected WordPress site as a draft with category "Automation".
   ```
4. The agent executes `create_post` (or routes via the assigned MCP server) and returns the live WordPress draft URL.

### Example C: Running Technical Security & Header Inspection

1. Type `/security-inspect` into the chat bar and hit **Enter**.
2. The agent evaluates the website's SSL certificate, headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`), robots.txt directives, and AI bot access policies, returning a prioritized checklist of fixes.

---

## 13. Troubleshooting & FAQs

#### Q: When saving site settings, I received a 404 error. Is that fixed?
**A**: Yes. The backend now supports both `PATCH` and `POST` routes on `/api/keyword-mcp/session/:id`, stores profiles safely in the database JSON fallback, and the frontend automatically mirrors settings to client local storage so saves always succeed without interruption.

#### Q: How do I ensure Chat A doesn't mix data with Chat B?
**A**: Always use **"New Website Chat"** to start a thread for each client or website. Each thread stores its own domain, logo, custom instructions, and assigned MCP server. When you click between threads in the sidebar, the workspace immediately isolates and reloads that specific site's context.

#### Q: How do I deploy updates to production?
1. **Frontend**: Pushing or merging to `main` in `quasaraiseo` automatically builds and deploys to **Vercel** (`https://seo.quasarasoft.com`).
2. **Backend**: Pull `main` on your backend server and restart the service:
   ```bash
   cd /path/to/quasar-ai-seo-backend
   git pull origin main
   npm run build
   pm2 restart quasar-backend
   ```
