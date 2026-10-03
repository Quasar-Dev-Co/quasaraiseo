# Multiple Google accounts and the admin MCP server: API contract

Both features are built: the frontend in this repo and the backend in
`quasar-ai-seo-backend` (`src/modules/google/google-accounts.ts`,
`src/modules/admin-mcp/`). This file is the contract between them. The
frontend still falls back gracefully if it talks to a backend without these
endpoints (single Google connection, MCP server shown as "not deployed yet").

Backend notes: the `GoogleAccount` and `McpAccessKey` tables create
themselves on startup (no migration), Google tokens are encrypted with a key
derived from `JWT_SECRET`, and OAuth `state` is signed and expires after 30
minutes.

Frontend files: `lib/google-api.ts`, `components/settings/google-accounts.tsx`,
`app/google/search-console/page.tsx`, `app/google/analytics/page.tsx`,
`lib/admin-mcp-api.ts`, `components/settings/mcp-access-tab.tsx`.

---

## 1. Multiple Google accounts

Today the backend keeps one Google connection, and connecting again replaces
it. The admin needs to connect several Google logins (one per client, agency
account, etc.) so that everyone sees every website from all of them.

### Storage

One row per Google login, keyed by the Google email. Move the current single
connection into the first row with `isPrimary = true`.

| Field | Notes |
|---|---|
| `id` | Returned to the frontend as `accountId` |
| `email` | Unique. From the ID token / userinfo after OAuth |
| `name` | Optional display name |
| `accessToken`, `refreshToken`, `expiresAt` | Encrypted the same way as today |
| `scopes` | Granted scopes; drives `services` below |
| `isPrimary` | Exactly one. Google Sheets uses the primary account |
| `lastError` | Set when Google rejects the token (`invalid_grant`); cleared on reconnect |
| `connectedById`, `connectedAt` | Who connected it and when |

### Endpoints

All reads are for any signed-in user (as today: everyone sees all websites).
Every write is super user only.

**`GET /api/google/accounts`** → `{ accounts: GoogleAccount[] }`

```ts
interface GoogleAccount {
  id: string;
  email: string;
  name: string | null;
  services: { searchConsole: boolean; analytics: boolean; sheets: boolean };
  scopes: string[];
  connectedAt: string | null;   // ISO
  isPrimary: boolean;
  error?: string | null;        // lastError
}
```

The frontend treats a **404** here as "old backend, one account only", so this
route existing is what turns the feature on.

**`GET /api/google/connect?addAccount=1&loginHint=<email>`** → `{ authUrl }`

- `addAccount=1`: build the URL with `prompt=select_account consent`,
  `access_type=offline`, `include_granted_scopes=true`, so Google shows the
  account picker and returns a refresh token.
- `loginHint`: pass through as `login_hint` (used by "Reconnect").
- Carry `addAccount` in the signed OAuth `state`.

**OAuth callback** (existing route): read the Google email, then **upsert by
email**. Connecting must never delete other accounts. Reconnecting an existing
email updates its tokens and clears `lastError`. The first account ever
connected becomes primary. Redirect to `/setting?google=connected` as today.

**`DELETE /api/google/accounts/:id`**: revoke the token at Google
(`https://oauth2.googleapis.com/revoke`), delete the row. If it was primary,
promote the oldest remaining account.

**`POST /api/google/accounts/:id/primary`**: make this the primary account.

**`POST /api/google/disconnect`** (existing): disconnect every account.

**`GET /api/google/status`** (existing, keep the shape): `connected` = any
account; `services` = OR over all accounts; `email` = the primary's email.

### Lists across all accounts

**`GET /api/google/search-console/sites`**: list sites for every account with
the Search Console scope, in parallel. Add `accountId` and `accountEmail` to
each site. If two accounts share a site, return it once, from the account with
the strongest permission (`siteOwner` > `siteFullUser` > `siteRestrictedUser`).
One account failing (for example `invalid_grant`) must not fail the list: set
its `lastError` and skip it.

**`GET /api/google/analytics/properties`**: the same for Analytics, one entry
per `propertyId`, with `accountId` and `accountEmail`.

### Which account a data call uses

Every Search Console and Analytics data endpoint now gets an optional
`accountId` (query string for GET, JSON body for the two sitemap POSTs):

- `GET /api/google/search-console/analytics`, `/daily`, `/dimension`, `/inspect-url`, `/sitemaps`
- `POST /api/google/search-console/sitemaps/submit`, `/sitemaps/delete`
- `GET /api/google/analytics/data`, `/report`, `/realtime`

Resolve the account like this:

1. `accountId` given and that account can see the site/property → use it.
2. Otherwise, the account whose site/property list contains it (cache each
   account's lists for about 10 minutes).
3. Otherwise the primary account.

Sheets endpoints keep using the primary account.

---

## 2. Admin MCP server

Lets the admin connect Claude, ChatGPT, Cursor or any MCP client to Quasar and
ask about analytics, who works the most, what is scheduled, costs and so on.
Read-only.

### Storage: access keys

| Field | Notes |
|---|---|
| `id`, `name` | Name is free text, e.g. "Claude Desktop – Sam" |
| `prefix` | First 9 characters of the key, shown in the list (`qmcp_4f2a`) |
| `keyHash` | SHA-256 of the full key. Never store the key itself |
| `createdById`, `createdAt` | |
| `lastUsedAt` | Update at most once a minute |
| `expiresAt` | Null = never |
| `revokedAt` | Revoked keys are hidden from the list |

Key format: `qmcp_` + 32 random bytes, base64url.

### Admin endpoints (super user only)

**`GET /api/admin-mcp`** → `{ serverUrl, keys, tools }`

```ts
{
  serverUrl: string;  // public URL of the MCP endpoint, e.g. https://api.seo.quasarasoft.com/mcp
  keys: Array<{
    id: string; name: string; prefix: string;
    createdAt: string; createdByEmail: string | null;
    lastUsedAt: string | null; expiresAt: string | null;
  }>;
  tools: Array<{ name: string; description: string }>;  // what /mcp exposes
}
```

A **404** here makes the page show "not deployed yet".

**`POST /api/admin-mcp/keys`** `{ name: string, expiresInDays: number | null }`
→ `201 { key, secret }`. `secret` is the full key and is returned only here.

**`DELETE /api/admin-mcp/keys/:id`**: set `revokedAt`.

### The MCP endpoint: `POST /mcp`

- MCP Streamable HTTP, stateless (with `@modelcontextprotocol/sdk`:
  `StreamableHTTPServerTransport` with `sessionIdGenerator: undefined`).
  `GET` / `DELETE /mcp` → 405.
- Auth: `Authorization: Bearer <key>`, or `?key=<key>` for apps that only take
  a URL (Claude.ai / Claude Desktop custom connectors, ChatGPT). Strip the
  query string from access logs so keys are not logged.
- Reject keys that are unknown, revoked or expired, and keys whose creator is
  no longer a super user. Answer 401.
- Each tool runs as the key's creator and calls the same service functions as
  the existing REST routes, so there is no new data access path.
- Rate limit per key (for example 60 requests a minute).
- Return compact JSON as text content; cap rows (default 100, max 1000).
  Dates default to the last 28 days.

### Tools

All read-only. Keep this list in step with `PLANNED_MCP_TOOLS` in
`lib/admin-mcp-api.ts`.

| Tool | Input | Data from |
|---|---|---|
| `list_websites` | – | Search Console sites + Analytics properties (all accounts), WordPress sites, brand profiles |
| `list_google_accounts` | – | Google accounts (no tokens) |
| `search_console_report` | `siteUrl`, `startDate?`, `endDate?`, `dimensions?` (`date`/`query`/`page`/`country`/`device`), `searchType?`, `rowLimit?` | Search Console API via the owning account |
| `analytics_report` | `propertyId`, `startDate?`, `endDate?`, `metrics?`, `dimensions?`, `limit?` | GA4 Data API via the owning account |
| `analytics_realtime` | `propertyId` | GA4 realtime |
| `team_activity` | `days?` (7/30/90) | Same as `GET /api/insights/users` |
| `user_activity` | `userId?` or `email?`, `days?` | Same as `GET /api/insights/users/:id` |
| `ai_costs` | `days?` | Same as `GET /api/costs/summary` |
| `list_scheduled_posts` | `status?`, `from?`, `to?`, `website?` | `ScheduledPost` |
| `list_content_changes` | `days?`, `website?` | `McpChange` |
| `list_generation_jobs` | `status?` | Same as `GET /api/wordpress/generation-jobs/all` |
| `list_tasks` | `status?`, `assignee?` | Tasks |
| `list_strategy_sessions` | `website?` | MCP Chat (keyword-mcp) sessions |
