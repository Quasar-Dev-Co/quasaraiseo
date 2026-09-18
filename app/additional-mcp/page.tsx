"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  Plug,
  Plus,
  Power,
  RefreshCw,
  Server,
  Trash2,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMinLoading } from "@/lib/use-min-loading";
import {
  mcpConnectionsApi,
  type McpConnection,
  type McpTestResult,
} from "@/lib/mcp-connections-api";

const card = "overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50";
const hdr = "flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/5";

interface NewConnection {
  name: string;
  url: string;
  token: string;
}

const emptyForm: NewConnection = { name: "", url: "", token: "" };

export default function AdditionalMcpPage() {
  const [connections, setConnections] = useState<McpConnection[]>([]);
  const [fetching, setFetching] = useState(true);
  const loading = useMinLoading(fetching);
  const [form, setForm] = useState<NewConnection>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await mcpConnectionsApi.getAll();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load MCP connections");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load().finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name.trim() || !form.url.trim() || !form.token.trim()) {
      setError("Name, URL, and bearer token are all required.");
      return;
    }
    setCreating(true);
    try {
      const { connection, test } = await mcpConnectionsApi.create({
        name: form.name.trim(),
        url: form.url.trim(),
        token: form.token.trim(),
      });
      setConnections((prev) => [connection, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      if (test.ok) {
        setSuccess(`Connected to ${connection.serverTitle || connection.name} — ${test.tools?.length ?? 0} tools available.`);
      } else {
        setError(`Saved, but the connection test failed: ${test.message}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add MCP connection");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (connection: McpConnection) => {
    setError("");
    setSuccess("");
    try {
      const updated = await mcpConnectionsApi.update(connection.id, { enabled: !connection.enabled });
      setConnections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update connection");
    }
  };

  const handleTest = async (id: string) => {
    setError("");
    setSuccess("");
    setTestingId(id);
    try {
      const { connection, test } = await mcpConnectionsApi.test(id);
      setConnections((prev) => prev.map((c) => (c.id === connection.id ? connection : c)));
      if (test.ok) {
        setSuccess(test.message);
      } else {
        setError(test.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setError("");
    setSuccess("");
    setDeletingId(id);
    try {
      await mcpConnectionsApi.delete(id);
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete connection");
    } finally {
      setDeletingId(null);
    }
  };

  const configJson = JSON.stringify(
    {
      mcpServers: {
        [connections.find((c) => c.enabled)?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "your-wordpress-site"]: {
          type: "http",
          url: connections.find((c) => c.enabled)?.url || "https://yoursite.com/wp-json/custom-web-render/v1/mcp",
          headers: {
            Authorization: "Bearer YOUR_TOKEN",
          },
        },
      },
    },
    null,
    4,
  );

  const copyConfig = async () => {
    await navigator.clipboard.writeText(configJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const enabledCount = connections.filter((c) => c.enabled).length;

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                <Plug className="h-7 w-7 text-fuchsia-500" />
                Additional MCP
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Connect external Streamable HTTP MCP servers — the same way Cursor, Claude Desktop, Windsurf, and Codex connect to them.
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Cancel" : "Add MCP Server"}
            </Button>
          </div>

          {/* Status banner */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Add form */}
          {showForm && (
            <form onSubmit={handleCreate} className={`${card} mb-6`}>
              <div className={hdr}>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Add MCP Server</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Enter the MCP endpoint and bearer token from your WordPress plugin's MCP Server page.
                  </p>
                </div>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Connection Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. CodeMyPixel WordPress"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    MCP Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://yoursite.com/wp-json/custom-web-render/v1/mcp"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    WordPress admin → Custom Web Render → MCP Server shows the exact endpoint URL.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Bearer Token
                  </label>
                  <input
                    type="password"
                    value={form.token}
                    onChange={(e) => setForm({ ...form, token: e.target.value })}
                    placeholder="cwr_..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Generate a token on the plugin's MCP Server page (shown once — copy it immediately).
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={creating} className="gap-2">
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    {creating ? "Connecting..." : "Add & Test Connection"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Connections list */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-36 w-full rounded-3xl" />
              ))}
            </div>
          ) : connections.length === 0 ? (
            <div className={`${card} flex flex-col items-center justify-center px-6 py-16 text-center`}>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-500/10">
                <Server className="h-8 w-8 text-fuchsia-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No MCP servers connected</h3>
              <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Add your WordPress site's MCP endpoint to route content-strategy WordPress tools through it — exactly like connecting Cursor or Claude Desktop.
              </p>
              <Button onClick={() => setShowForm(true)} className="mt-5 gap-2">
                <Plus className="h-4 w-4" />
                Add MCP Server
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div key={connection.id} className={card}>
                  <div className={hdr}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10">
                        <Globe className="h-5 w-5 text-fuchsia-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{connection.name}</h3>
                          <Badge variant={connection.enabled ? "default" : "secondary"} className={connection.enabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}>
                            {connection.enabled ? "Active" : "Off"}
                          </Badge>
                          {connection.lastTestOk && connection.lastTestedAt && (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{connection.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(connection)}
                        className="gap-2"
                      >
                        <Power className="h-3.5 w-3.5" />
                        {connection.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(connection.id)}
                        disabled={testingId === connection.id}
                        className="gap-2"
                      >
                        {testingId === connection.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(connection.id)}
                        disabled={deletingId === connection.id}
                        className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        {deletingId === connection.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 px-6 py-4 sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Server</p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                        {connection.serverTitle || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tools</p>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{connection.toolCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Protocol</p>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{connection.protocolVersion || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Last Test</p>
                      <p className={`mt-1 truncate text-sm font-medium ${connection.lastTestOk ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                        {connection.lastTestedAt ? new Date(connection.lastTestedAt).toLocaleString() : "Never"}
                      </p>
                    </div>
                  </div>
                  {connection.lastTestMessage && (
                    <div className="border-t border-slate-100 px-6 py-3 dark:border-white/5">
                      <p className={`text-xs ${connection.lastTestOk ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {connection.lastTestMessage}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* How to connect — mirrors the plugin's client connector cards */}
          <div className={`${card} mt-8`}>
            <div className={hdr}>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">How to get your MCP credentials</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Same steps Cursor, Claude Desktop, Windsurf, and Codex users follow.
                </p>
              </div>
            </div>
            <div className="space-y-5 px-6 py-5">
              <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-xs font-bold text-white">1</span>
                  <span>
                    In your WordPress admin, open <strong>Custom Web Render → MCP Server</strong>. Create a token with the permissions you need (read, write, settings).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-xs font-bold text-white">2</span>
                  <span>
                    Copy the <strong>endpoint URL</strong> (e.g. <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-white/10">https://yoursite.com/wp-json/custom-web-render/v1/mcp</code>) and the <strong>token</strong> (shown once).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-xs font-bold text-white">3</span>
                  <span>
                    Add them above. When enabled, WordPress tool calls from <strong>/content-strategy</strong> route through this MCP server — the exact same protocol Cursor and Codex use.
                  </span>
                </li>
              </ol>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Equivalent client config (for reference)
                </p>
                <div className="relative">
                  <pre className="max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-200 dark:bg-black/40">
                    <code>{configJson}</code>
                  </pre>
                  <button
                    type="button"
                    onClick={copyConfig}
                    className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/20"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                {enabledCount > 0
                  ? `${enabledCount} connection${enabledCount === 1 ? "" : "s"} active — WordPress tools in /content-strategy are routing through your MCP server.`
                  : "No connection enabled — WordPress tools fall back to the direct REST integration."}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
