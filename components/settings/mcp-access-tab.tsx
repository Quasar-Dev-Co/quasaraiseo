"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Copy, KeyRound, Loader2, Plug, Plus, Server, Trash2, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  adminMcpApi,
  PLANNED_MCP_TOOLS,
  type AdminMcpOverview,
  type McpAccessKey,
} from "@/lib/admin-mcp-api";

// Admin-only: connect an outside AI app (Claude, ChatGPT, Cursor…) to Quasar
// over MCP, so it can read analytics, team activity, schedules and the rest.

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.seo.quasarasoft.com";
const KEY_PLACEHOLDER = "<your-access-key>";

const EXPIRY_OPTIONS: Array<{ label: string; days: number | null }> = [
  { label: "1 year", days: 365 },
  { label: "90 days", days: 90 },
  { label: "30 days", days: 30 },
  { label: "Never", days: null },
];

type ClientId = "claude-code" | "json" | "url";

const CLIENTS: Array<{ id: ClientId; label: string; help: string }> = [
  {
    id: "claude-code",
    label: "Claude Code",
    help: "Run this in a terminal. Claude Code sends the key in a header.",
  },
  {
    id: "json",
    label: "Cursor and other apps",
    help: "Paste into the app's MCP settings file (for Cursor: .cursor/mcp.json).",
  },
  {
    id: "url",
    label: "Claude.ai, Claude Desktop, ChatGPT",
    help: "Add a custom connector and paste this link. The key is inside the link, so treat it like a password.",
  },
];

function snippet(client: ClientId, serverUrl: string, key: string): string {
  if (client === "claude-code") {
    return `claude mcp add --transport http quasar-seo ${serverUrl} --header "Authorization: Bearer ${key}"`;
  }
  if (client === "json") {
    return JSON.stringify(
      { mcpServers: { "quasar-seo": { url: serverUrl, headers: { Authorization: `Bearer ${key}` } } } },
      null,
      2,
    );
  }
  return `${serverUrl}?key=${encodeURIComponent(key)}`;
}

function ago(iso: string | null): string {
  if (!iso) return "Never used";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 14) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked; the text is still selectable.
    }
  };
  return (
    <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={copy}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : label}
    </Button>
  );
}

function Section({ icon: Icon, title, hint, children }: { icon: typeof Server; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
      <header className="flex gap-2.5 border-b border-slate-100 px-6 py-5 dark:border-white/5">
        <Icon className="mt-0.5 size-[18px] shrink-0 text-slate-500 dark:text-slate-400" />
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          {hint && <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function McpAccessTab() {
  const [overview, setOverview] = useState<AdminMcpOverview | null>(null);
  const [deployed, setDeployed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** When the key list was loaded; expiry is judged against it. */
  const [loadedAt, setLoadedAt] = useState(0);

  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(365);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  /** The full key, shown once right after it is created. */
  const [newSecret, setNewSecret] = useState<{ key: McpAccessKey; secret: string } | null>(null);
  const [client, setClient] = useState<ClientId>("claude-code");

  const load = useCallback(() => adminMcpApi.overview()
    .then((data) => {
      setOverview(data);
      setDeployed(data !== null);
      setLoadedAt(Date.now());
      setError(null);
    })
    .catch((e) => setError(e instanceof Error ? e.message : "Could not load MCP access."))
    .finally(() => setLoading(false)), []);

  useEffect(() => {
    load();
  }, [load]);

  const createKey = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the key a name, for example the app or person that will use it.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await adminMcpApi.createKey({ name: trimmed, expiresInDays });
      setNewSecret(created);
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the key.");
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (key: McpAccessKey) => {
    if (!confirm(`Revoke "${key.name}"? Apps using this key lose access right away.`)) return;
    setRevoking(key.id);
    setError(null);
    try {
      await adminMcpApi.revokeKey(key.id);
      if (newSecret?.key.id === key.id) setNewSecret(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke the key.");
    } finally {
      setRevoking(null);
    }
  };

  const serverUrl = overview?.serverUrl ?? `${BACKEND_URL.replace(/\/+$/, "")}/mcp`;
  const tools = overview?.tools.length ? overview.tools : PLANNED_MCP_TOOLS;
  const keys = overview?.keys ?? [];
  const activeClient = CLIENTS.find((c) => c.id === client) ?? CLIENTS[0];
  const shownSnippet = snippet(client, serverUrl, newSecret?.secret ?? KEY_PLACEHOLDER);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Loader2 className="size-4 animate-spin" /> Loading MCP access…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="flex items-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </p>
      )}

      <Section
        icon={Server}
        title="Quasar MCP server"
        hint="Connect Claude, ChatGPT, Cursor or any other MCP app to this system. The app can then answer questions about every website's analytics, who on the team works the most, what is scheduled, costs and more. It can read, not change."
      >
        <div className="space-y-3 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-[13px] text-slate-800 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200">
              {serverUrl}
            </code>
            <CopyButton text={serverUrl} label="Copy URL" />
          </div>
          {deployed ? (
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Only admins can create keys. A key stops working when it is revoked, when it expires, or when the admin who made it is no longer an admin.
            </p>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              The backend does not have the MCP server yet. This page is ready; keys can be created as soon as the backend update is deployed.
            </p>
          )}
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            This is the other direction from Connected tools: there, MCP Chat uses outside servers; here, outside AI apps use Quasar.
          </p>
        </div>
      </Section>

      <Section icon={KeyRound} title="Access keys" hint="Make one key per app or person, so you can revoke one without breaking the others.">
        <div className="space-y-4 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="mb-1.5 block text-[12px] font-bold text-slate-600 dark:text-slate-400">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createKey(); }}
                placeholder="For example: Claude Desktop – Sam"
                disabled={!deployed}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 disabled:opacity-60 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-[12px] font-bold text-slate-600 dark:text-slate-400">Expires</span>
              <select
                value={expiresInDays ?? "never"}
                onChange={(e) => setExpiresInDays(e.target.value === "never" ? null : Number(e.target.value))}
                disabled={!deployed}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none disabled:opacity-60 sm:w-36 dark:border-white/10 dark:bg-slate-800 dark:text-white"
              >
                {EXPIRY_OPTIONS.map((o) => (
                  <option key={o.label} value={o.days ?? "never"}>{o.label}</option>
                ))}
              </select>
            </label>
            <Button className="h-[42px] gap-1.5 rounded-xl px-4" onClick={createKey} disabled={!deployed || creating}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Create key
            </Button>
          </div>

          {newSecret && (
            <div className="space-y-2 rounded-2xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-400/20 dark:bg-brand-400/10">
              <p className="text-[13px] font-bold text-slate-900 dark:text-white">Copy &ldquo;{newSecret.key.name}&rdquo; now</p>
              <p className="text-[12px] text-slate-600 dark:text-slate-300">
                This is the only time the full key is shown. The setup below already has it filled in.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-[12px] text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
                  {newSecret.secret}
                </code>
                <CopyButton text={newSecret.secret} label="Copy key" />
              </div>
            </div>
          )}

          {keys.length === 0 ? (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">No keys yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-white/5 dark:border-white/10">
              {keys.map((key) => {
                const expired = key.expiresAt !== null && new Date(key.expiresAt).getTime() < loadedAt;
                return (
                  <li key={key.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-bold text-slate-900 dark:text-white">{key.name}</span>
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-white/10 dark:text-slate-300">{key.prefix}…</code>
                        {expired && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-400/10 dark:text-red-300">Expired</span>}
                      </div>
                      <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                        Created {shortDate(key.createdAt)}{key.createdByEmail ? ` by ${key.createdByEmail}` : ""}
                        {" · "}{ago(key.lastUsedAt)}
                        {" · "}{key.expiresAt ? `${expired ? "Expired" : "Expires"} ${shortDate(key.expiresAt)}` : "Never expires"}
                      </p>
                    </div>
                    <Button size="sm" variant="destructive" className="shrink-0 gap-1.5" disabled={revoking !== null} onClick={() => revokeKey(key)}>
                      {revoking === key.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Revoke
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Section>

      <Section icon={Plug} title="Connect your app" hint="Pick the app, copy the setup, and ask it something like “Which website got the most clicks this month?” or “Who used Quasar the most this week?”">
        <div className="space-y-3 p-6">
          <div className="flex flex-wrap gap-1 rounded-[12px] bg-slate-100 p-1 dark:bg-slate-800" role="group" aria-label="App">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={client === c.id}
                onClick={() => setClient(c.id)}
                className={`rounded-[9px] px-3 py-1.5 text-[12px] font-bold ${client === c.id ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-slate-600 dark:text-slate-400">{activeClient.help}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-[12px] leading-relaxed text-slate-800 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200">
              {shownSnippet}
            </pre>
            <CopyButton text={shownSnippet} />
          </div>
          {!newSecret && (
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Replace {KEY_PLACEHOLDER} with a key. Create a new key to have it filled in for you.
            </p>
          )}
        </div>
      </Section>

      <Section icon={Wrench} title="What the app can read" hint={deployed ? `${tools.length} read-only tools.` : `${tools.length} read-only tools, available once the backend update is deployed.`}>
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {tools.map((tool) => (
            <li key={tool.name} className="flex flex-col gap-0.5 px-6 py-3 sm:flex-row sm:gap-4">
              <code className="shrink-0 font-mono text-[12px] font-semibold text-slate-900 sm:w-56 dark:text-white">{tool.name}</code>
              <span className="text-[13px] text-slate-600 dark:text-slate-400">{tool.description}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
