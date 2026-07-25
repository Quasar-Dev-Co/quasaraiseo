"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  Plug, Server, Wrench, FileText, Terminal, Copy,
  Play, Square, Plus, Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";

export default function AuditMcpPage() {
  const mcp = useSelector((state: RootState) => state.mcp);

  const statusBadge = (status: string) => {
    if (status === "connected") return <Badge className="bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200">Connected</Badge>;
    if (status === "error") return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="secondary">Disconnected</Badge>;
  };

  return (
    <RequireAuth>
    <DashboardLayout>
      {/* Hero */}
      <section className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/80 bg-fuchsia-50/86 px-3 py-2 text-xs font-bold uppercase tracking-[0.19em] text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-300">
          <span className="size-2 rounded-full bg-fuchsia-500" />
          MCP Server
        </div>
        <h1 className="mt-5 text-[clamp(34px,5vw,52px)] font-black leading-[1.02] tracking-[-0.052em] text-slate-900 dark:text-white">
          Audit MCP{" "}
          <em className="not-italic bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Server & Tools
          </em>
        </h1>
        <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
          Manage your Model Context Protocol servers, tools, and resources. Connect external SEO audit engines and expose them as MCP tools for AI agents.
        </p>
      </section>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Server className="size-4" /> Servers</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{mcp.servers.length}</div>
          <div className="mt-1 text-xs text-fuchsia-600 dark:text-fuchsia-400">{mcp.servers.filter(s => s.status === "connected").length} active</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Wrench className="size-4" /> Tools</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{mcp.tools.length}</div>
          <div className="mt-1 text-xs text-fuchsia-600 dark:text-fuchsia-400">{mcp.tools.filter(t => t.enabled).length} enabled</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><FileText className="size-4" /> Resources</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{mcp.resources.length}</div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Cached & live</div>
        </article>
        <article className="rounded-[18px] border border-slate-200 bg-white/80 p-5.5 shadow-[0_14px_42px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400"><Terminal className="size-4" /> Port</div>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{mcp.port}</div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{mcp.isRunning ? "Running" : "Stopped"}</div>
        </article>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="servers">
        <TabsList>
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Servers tab */}
        <TabsContent value="servers">
          <article className="mt-4.5 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Server className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Connected Servers</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">MCP servers providing audit tools and resources</p>
                </div>
              </div>
              <Button size="sm" variant="outline"><Plus className="size-3.5" /> Add Server</Button>
            </header>
            <div className="p-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Server Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Tools</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Ping</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mcp.servers.map((srv) => (
                    <TableRow key={srv.id}>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{srv.name}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{srv.url}</TableCell>
                      <TableCell>{srv.toolsCount}</TableCell>
                      <TableCell>{statusBadge(srv.status)}</TableCell>
                      <TableCell className="text-xs text-slate-500">{srv.lastPing ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button size="icon-xs" variant="ghost"><Play className="size-3.5" /></Button>
                          <Button size="icon-xs" variant="ghost"><Trash2 className="size-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </article>
        </TabsContent>

        {/* Tools tab */}
        <TabsContent value="tools">
          <article className="mt-4.5 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Wrench className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Available Tools</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">MCP tools exposed by connected servers</p>
                </div>
              </div>
            </header>
            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {mcp.tools.map((tool) => (
                  <div key={tool.id} className={`rounded-xl border p-4 transition-colors ${tool.enabled ? "border-fuchsia-200 bg-fuchsia-50/40 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/5" : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Wrench className={`size-4 ${tool.enabled ? "text-fuchsia-600" : "text-slate-400"}`} />
                        <code className="text-sm font-bold text-slate-800 dark:text-slate-200">{tool.name}</code>
                      </div>
                      <Badge variant={tool.enabled ? "default" : "secondary"} className={tool.enabled ? "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" : ""}>
                        {tool.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{tool.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{tool.category}</Badge>
                      <Button size="xs" variant="ghost">{tool.enabled ? "Disable" : "Enable"}</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </TabsContent>

        {/* Resources tab */}
        <TabsContent value="resources">
          <article className="mt-4.5 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><FileText className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">MCP Resources</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Files, configs, and data exposed via MCP resource URIs</p>
                </div>
              </div>
            </header>
            <div className="p-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URI</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mcp.resources.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{res.name}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{res.uri}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{res.type}</Badge></TableCell>
                      <TableCell className="text-xs text-slate-500">{res.size}</TableCell>
                      <TableCell><Button size="icon-xs" variant="ghost"><Copy className="size-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </article>
        </TabsContent>

        {/* Logs tab */}
        <TabsContent value="logs">
          <article className="mt-4.5 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
              <div className="flex gap-2.75">
                <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Terminal className="size-[18px]" /></span>
                <div>
                  <h3 className="m-0 text-base text-slate-900 dark:text-white">Server Logs</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Real-time MCP server activity and events</p>
                </div>
              </div>
              <Button size="sm" variant="outline"><Square className="size-3.5" /> Clear</Button>
            </header>
            <div className="p-5">
              <div className="space-y-1.5">
                {mcp.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 font-mono text-xs hover:bg-slate-50 dark:hover:bg-white/5">
                    <span className="shrink-0 text-slate-400">{log.timestamp}</span>
                    <span className={`shrink-0 font-bold uppercase ${log.level === "error" ? "text-red-500" : log.level === "warn" ? "text-amber-500" : "text-fuchsia-500"}`}>{log.level}</span>
                    <span className="shrink-0 text-slate-400">[{log.serverName}]</span>
                    <span className="text-slate-700 dark:text-slate-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </TabsContent>
      </Tabs>

      {/* API config */}
      <article className="mt-4.5 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5.5 dark:border-white/5">
          <div className="flex gap-2.75">
            <span className="grid size-9 place-items-center rounded-[12px] bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400"><Plug className="size-[18px]" /></span>
            <div>
              <h3 className="m-0 text-base text-slate-900 dark:text-white">API Configuration</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">MCP endpoint settings for AI agent connections</p>
            </div>
          </div>
        </header>
        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">API Key</label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-slate-900/50">
                <code className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-300">{mcp.apiKey}</code>
                <Button size="icon-xs" variant="ghost"><Copy className="size-3.5" /></Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Server Port</label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-slate-900/50">
                <code className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-300">:{mcp.port}</code>
                <Badge className={mcp.isRunning ? "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" : ""}>{mcp.isRunning ? "Running" : "Stopped"}</Badge>
              </div>
            </div>
          </div>
        </div>
      </article>
    </DashboardLayout>
    </RequireAuth>
  );
}
