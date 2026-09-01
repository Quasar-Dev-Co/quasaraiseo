"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Server, Send, Bot, User, Wrench, Loader2, CheckCircle2,
  Search, Globe, FileText, FileSpreadsheet, Trash2, Download,
  CircleDot, Cpu, Activity, ChevronRight, Sparkles, Terminal,
  Plus, MessageSquare, Paperclip, ArrowUp, X,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  keywordMcpApi,
  type McpChatMessage,
  type McpSession,
  type McpToolCall,
  type McpFile,
  type McpSessionPreview,
  type ModelRecord,
} from "@/lib/keyword-mcp-api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ModelSelector, usePersistentModel } from "@/components/ModelSelector";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Tool icons ───

const TOOL_ICONS: Record<string, typeof Search> = {
  web_search: Search,
  fetch_url: Globe,
  get_branding: Sparkles,
  save_keyword_report: FileText,
  generate_pdf: FileText,
  generate_csv: FileSpreadsheet,
};

function getToolLabel(tool: string, args: Record<string, unknown>): string {
  if (tool === "web_search") return `Searching: "${args.query || ""}"`;
  if (tool === "fetch_url") return `Fetching: ${String(args.url || "").slice(0, 50)}`;
  if (tool === "get_branding") return "Loading your branding info";
  if (tool === "save_keyword_report") return "Saving keyword report";
  if (tool === "generate_pdf") return "Generating PDF";
  if (tool === "generate_csv") return "Generating CSV";
  return tool;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Main Component ───

function QuasarMcpContent() {
  const [session, setSession] = useState<McpSession | null>(null);
  const [sessions, setSessions] = useState<McpSessionPreview[]>([]);
  const [messages, setMessages] = useState<McpChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeTools, setActiveTools] = useState<McpToolCall[]>([]);
  const [models, setModels] = useState<ModelRecord[]>([]);
  const { selectedModel, setModel } = usePersistentModel(models);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const [webBuilderMode, setWebBuilderMode] = useState(false);

  // Load session list + get/create current session
  const loadSessions = useCallback(async () => {
    try {
      const { sessions } = await keywordMcpApi.listSessions();
      setSessions(sessions);
    } catch {}
  }, []);

  useEffect(() => {
    keywordMcpApi.getSession()
      .then(({ session }) => {
        setSession(session);
        setMessages(session.messages || []);
      })
      .catch(() => {});
    loadSessions();
    keywordMcpApi.listModels()
      .then(({ models }) => setModels(models))
      .catch(() => {});
  }, [loadSessions]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, activeTools]);

  // Close tools menu on outside click
  useEffect(() => {
    if (!toolsOpen) return;
    const handler = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [toolsOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isThinking || !session) return;

    const userMsg: McpChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);
    setActiveTools([]);

    try {
      const result = await keywordMcpApi.sendMessage(session.id, text, selectedModel, webBuilderMode ? "web-builder" : undefined);
      if (result.toolCalls && result.toolCalls.length > 0) {
        setActiveTools(result.toolCalls);
      }
      const assistantMsg: McpChatMessage = {
        role: "assistant",
        content: result.response,
        timestamp: Date.now(),
        toolCalls: result.toolCalls,
        files: result.files,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Refresh session list
      loadSessions();
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Failed to get response"}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsThinking(false);
      setActiveTools([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick reply: sends a preset message as if the user typed it
  const handleQuickReply = useCallback(async (text: string) => {
    if (!text.trim() || isThinking || !session) return;
    const userMsg: McpChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setActiveTools([]);
    try {
      const result = await keywordMcpApi.sendMessage(session.id, text, selectedModel, webBuilderMode ? "web-builder" : undefined);
      if (result.toolCalls && result.toolCalls.length > 0) setActiveTools(result.toolCalls);
      const assistantMsg: McpChatMessage = {
        role: "assistant",
        content: result.response,
        timestamp: Date.now(),
        toolCalls: result.toolCalls,
        files: result.files,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      loadSessions();
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsThinking(false);
      setActiveTools([]);
    }
  }, [session, isThinking, selectedModel, loadSessions]);

  const handleNewChat = async () => {
    try {
      const { session: newSession } = await keywordMcpApi.createNewSession();
      setSession(newSession);
      setMessages([]);
      setInput("");
      setIsThinking(false);
      setActiveTools([]);
      loadSessions();
    } catch {}
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      const { session: loaded } = await keywordMcpApi.getSessionById(sessionId);
      setSession(loaded);
      setMessages(loaded.messages || []);
      setIsThinking(false);
      setActiveTools([]);
    } catch {}
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await keywordMcpApi.clearSession(sessionId);
      // If we deleted the active session, create a new one
      if (session?.id === sessionId) {
        const { session: newSession } = await keywordMcpApi.createNewSession();
        setSession(newSession);
        setMessages([]);
      }
      loadSessions();
    } catch {}
  };

  // Collect tool calls from recent messages
  const recentToolCalls: McpToolCall[] = [];
  for (let i = messages.length - 1; i >= 0 && recentToolCalls.length < 20; i--) {
    const m = messages[i];
    if (m.toolCalls) {
      for (const tc of m.toolCalls) {
        recentToolCalls.unshift(tc);
      }
    }
  }

  return (
    <div className="-mx-4 -my-8 flex h-[calc(100vh-64px-5px)] flex-col overflow-hidden lg:-mx-9">

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
            <Server className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Quasar MCP
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI SEO Agent Server
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <CircleDot className="size-3 text-emerald-500" />
            Online
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Cpu className="size-3 text-blue-500" />
            {isThinking ? "Thinking" : "Idle"}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleNewChat} className="gap-1.5 text-xs">
            <Plus className="size-3.5" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ─── LEFT: Sessions + Activity ─── */}
        <div className="hidden w-[340px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 md:flex min-h-0">

          {/* New Chat button at top of sidebar */}
          <div className="border-b border-slate-200 p-3 dark:border-slate-800">
            <Button
              onClick={handleNewChat}
              variant="outline"
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="size-4" />
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 min-h-0">

            {/* Active tools while thinking */}
            {isThinking && (
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 dark:border-blue-800 dark:bg-blue-950/30">
                  <Loader2 className="size-4 animate-spin text-blue-500" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Agent is working...
                  </span>
                </div>
                {activeTools.length > 0 && (
                  <div className="space-y-1">
                    {activeTools.map((tc, i) => (
                      <ToolCallItem key={i} tool={tc} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat history list */}
            <div>
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                Chat History
              </h3>
              <div className="space-y-1.5">
                {sessions.length === 0 && !isThinking && (
                  <p className="px-2 py-4 text-center text-xs text-slate-400">
                    No chats yet. Click "New Chat" to start.
                  </p>
                )}
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={`group cursor-pointer rounded-lg border p-2.5 transition-all ${
                      session?.id === s.id
                        ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-3.5 shrink-0 text-slate-400" />
                      <p className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                        {s.preview}
                      </p>
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="size-3 text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{formatDate(s.updatedAt)}</span>
                      <span>•</span>
                      <span>{s.messageCount} msgs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tool history for current session */}
            {recentToolCalls.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 px-1 text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                  Tool History
                </h3>
                <div className="space-y-1.5">
                  {recentToolCalls.map((tc, i) => (
                    <ToolCallItem key={i} tool={tc} compact />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Chat ─── */}
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
            <div className="mx-auto max-w-3xl space-y-4">

              {/* Loading skeleton when session is not loaded yet */}
              {!session ? (
                <div className="space-y-4 py-8">
                  <div className="flex gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl">
                    <Bot className="size-8" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                    Quasar MCP Server
                  </h2>
                  <p className="mx-auto mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    A real AI agent that can search the web, read your branding,
                    research keywords, and generate PDF/CSV reports. Just tell it
                    what you need.
                  </p>

                  <div className="mx-auto max-w-lg space-y-2">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Try these</p>
                    {[
                      "Find keywords for my website",
                      "Research keywords for AI web development",
                      "Search keywords for dentist in Portland",
                      "Find keywords for my company and download as PDF",
                    ].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => setInput(cmd)}
                        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                      >
                        <Terminal className="size-4 text-blue-500" />
                        {cmd}
                        <ChevronRight className="ml-auto size-3.5 text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Messages */}
              {messages.map((msg, i) => (
                <ChatMessageItem key={i} message={msg} onQuickReply={handleQuickReply} />
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <div className="flex gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <Loader2 className="size-4 animate-spin text-blue-500" />
                    <span className="text-sm text-slate-500">
                      {activeTools.length > 0
                        ? `Using ${activeTools[activeTools.length - 1].name}...`
                        : "Thinking..."}
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input — Devin-style chat bar */}
          <div className="border-t border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mx-auto max-w-3xl">
              {/* Rounded input card */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors focus-within:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-slate-500">
                {/* Web Builder mode badge */}
                {webBuilderMode && (
                  <div className="flex items-center justify-between px-4 pt-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400 dark:ring-blue-400/20">
                      <Globe className="size-3.5" />
                      Web Builder Mode
                    </div>
                    <button
                      type="button"
                      onClick={() => setWebBuilderMode(false)}
                      className="text-xs font-medium text-slate-400 transition-colors hover:text-red-500"
                    >
                      Exit
                    </button>
                  </div>
                )}
                {/* Text area */}
                <div className="px-4 pt-3 pb-1">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={webBuilderMode ? "Ask about your website... e.g. 'check my WordPress site' or 'rebuild my landing page'" : "Tell the agent what you need... e.g. 'find keywords for my website'"}
                    disabled={isThinking}
                    className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white"
                    rows={1}
                  />
                </div>
                {/* Bottom toolbar */}
                <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                  {/* Left: upload buttons */}
                  <div className="flex items-center gap-1">
                    {/* Attach file button hidden for now — will re-enable later
                    <button
                      type="button"
                      title="Attach file"
                      className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                      <Paperclip className="size-4" />
                    </button>
                    */}
                    <div className="relative" ref={toolsMenuRef}>
                      {/* "Add tool" plus button hidden for now — will re-enable later
                      <button
                        type="button"
                        title="Add tool"
                        onClick={() => setToolsOpen((v) => !v)}
                        className={`grid size-8 place-items-center rounded-lg transition-colors ${
                          toolsOpen
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400"
                            : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        }`}
                      >
                        <Plus className={`size-4 transition-transform ${toolsOpen ? "rotate-45" : ""}`} />
                      </button>
                      */}
                      {toolsOpen && (
                        <div className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
                          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tools</span>
                            <button
                              type="button"
                              onClick={() => setToolsOpen(false)}
                              className="grid size-5 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="max-h-72 overflow-y-auto p-1.5">
                            <button
                              type="button"
                              onClick={() => { setWebBuilderMode(true); setToolsOpen(false); }}
                              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-400/10 dark:hover:to-purple-400/10"
                            >
                              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm transition-transform group-hover:scale-105">
                                <Globe className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Web Builder</span>
                                <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">Build & deploy websites with AI</span>
                              </span>
                              <ChevronRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500 dark:text-slate-600" />
                            </button>
                          </div>
                          <div className="border-t border-slate-100 px-4 py-2 text-center text-[10px] text-slate-400 dark:border-white/5 dark:text-slate-500">
                            More tools coming soon
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Right: model selector + send button */}
                  <div className="flex items-center gap-2">
                    <ModelSelector
                      models={models}
                      value={selectedModel}
                      onChange={setModel}
                      dark
                      compact
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() || isThinking}
                      className="grid size-8 place-items-center rounded-lg bg-slate-900 text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      {isThinking ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {/* Helper text */}
              <p className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
                Quasar MCP can search the web, read your branding, research keywords, and generate reports
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Tool Call Item ───

function ToolCallItem({ tool, compact }: { tool: McpToolCall; compact?: boolean }) {
  const Icon = TOOL_ICONS[tool.name] || Wrench;
  const label = getToolLabel(tool.name, tool.args);

  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 ${compact ? "bg-white dark:bg-slate-800" : "bg-blue-50/50 dark:bg-blue-950/30"}`}>
      <div className="mt-0.5 shrink-0">
        <Icon className="size-3.5 text-blue-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{label}</p>
        {tool.result && compact && (
          <p className="mt-0.5 truncate text-[10px] text-slate-400">{tool.result}</p>
        )}
      </div>
      <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
    </div>
  );
}

// ─── Chat Message Item ───

function ChatMessageItem({ message, onQuickReply }: { message: McpChatMessage; onQuickReply?: (text: string) => void }) {
  const isUser = message.role === "user";

  // Detect quick-reply prompts from the AI
  const quickReplies: { label: string; text: string }[] = [];
  if (!isUser && onQuickReply) {
    const c = message.content.toLowerCase();
    if (c.includes("start writing") || c.includes('reply "start writing"') || c.includes('say "start writing"')) {
      quickReplies.push({ label: "Start writing", text: "Start writing" });
    }
    if (c.includes("should i start writing") || c.includes("shall i start") || c.includes("ready to write")) {
      quickReplies.push({ label: "Start writing", text: "Start writing" });
    }
    if (c.includes("save it") || c.includes("give me the file") || c.includes("download it")) {
      if (c.includes("say 'save") || c.includes("say \"save") || c.includes("'save it'") || c.includes("give me the file")) {
        quickReplies.push({ label: "Save it", text: "Save it" });
        quickReplies.push({ label: "Give me the file", text: "Give me the file" });
      }
    }
    if (c.includes("should i save") || c.includes("want me to save") || c.includes("ready to save")) {
      quickReplies.push({ label: "Save it", text: "Save it" });
    }
    if (c.includes("looks good") && (c.includes("confirm") || c.includes("proceed") || c.includes("continue"))) {
      quickReplies.push({ label: "Looks good, continue", text: "Looks good, continue" });
    }
    if (c.includes("want me to adjust") || c.includes("want me to change") || c.includes("any changes")) {
      if (!c.includes("start writing")) {
        quickReplies.push({ label: "Looks good, start writing", text: "Looks good, start writing" });
      }
    }
    if (c.includes("more changes") || c.includes("any more changes")) {
      quickReplies.push({ label: "Save it", text: "Save it" });
      quickReplies.push({ label: "No more changes, save it", text: "No more changes, save it" });
    }
    if (c.includes("confirm") && c.includes("structure")) {
      quickReplies.push({ label: "Looks good, start writing", text: "Looks good, start writing" });
    }

    // ─── WordPress site metadata workflow buttons ───
    // When MCP asks if user wants to research/propose metadata
    if (c.includes("would you like me to research") || c.includes("want me to research") || c.includes("propose an seo")) {
      quickReplies.push({ label: "Yes, research and propose", text: "Yes, research and propose" });
    }
    // When MCP asks if user wants to apply the recommended metadata
    if (c.includes("would you like me to apply") || c.includes("want me to apply") || c.includes("apply the recommended")) {
      quickReplies.push({ label: "Yes, apply it", text: "Yes, apply it" });
      quickReplies.push({ label: "No, make changes", text: "No, make changes" });
    }
    // When MCP asks about optimizing homepage or posts
    if (c.includes("optimize the site") || c.includes("optimize my homepage") || c.includes("optimize the homepage")) {
      quickReplies.push({ label: "Optimize homepage metadata", text: "Optimize my homepage metadata" });
      quickReplies.push({ label: "Optimize my posts", text: "Optimize my posts" });
    }
    // When MCP asks which post to optimize
    if (c.includes("which post do you want") || c.includes("which post would you like") || c.includes("which post")) {
      quickReplies.push({ label: "Optimize post 1", text: "Optimize post 1" });
    }
    // When MCP asks if user wants to optimize the next post
    if (c.includes("optimize the next post") || c.includes("optimize another post")) {
      quickReplies.push({ label: "Yes, optimize next post", text: "Yes, optimize the next post" });
      quickReplies.push({ label: "No, that's enough", text: "No, that's enough for now" });
    }
    // When MCP shows current site settings and asks what to do
    if (c.includes("site title:") && c.includes("description:") && c.includes("would you like")) {
      quickReplies.push({ label: "Yes, optimize it", text: "Yes, optimize it" });
    }
    // When MCP confirms changes were applied
    if (c.includes("changes are now live") || c.includes("updated successfully")) {
      quickReplies.push({ label: "Optimize my posts too", text: "Now optimize my posts" });
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${
        isUser
          ? "bg-gradient-to-br from-slate-600 to-slate-800 text-white"
          : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
      }`}>
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      <div className={`flex max-w-[80%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Tool calls inline */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 w-full space-y-1">
            {message.toolCalls.map((tc, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                {(() => {
                  const Icon = TOOL_ICONS[tc.name] || Wrench;
                  return <Icon className="size-3.5 text-blue-500" />;
                })()}
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {getToolLabel(tc.name, tc.args)}
                </span>
                <CheckCircle2 className="ml-auto size-3 text-emerald-500" />
              </div>
            ))}
          </div>
        )}

        {/* Message text */}
        <div className={`rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-slate-800 text-white dark:bg-slate-700"
            : "bg-white text-slate-700 shadow-sm border border-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-bold text-slate-900 dark:text-white">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-2 mt-3 text-sm font-bold text-slate-900 dark:text-white">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-1.5 mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{children}</h3>,
                  h4: ({ children }) => <h4 className="mb-1 mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{children}</h4>,
                  p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-slate-600 dark:text-slate-400">{children}</em>,
                  code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-blue-600 dark:bg-slate-800 dark:text-blue-400">{children}</code>,
                  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800">{children}</pre>,
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400">{children}</a>,
                  table: ({ children }) => <table className="mb-2 w-full border-collapse text-xs">{children}</table>,
                  th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold dark:border-slate-700 dark:bg-slate-800">{children}</th>,
                  td: ({ children }) => <td className="border border-slate-200 px-2 py-1 dark:border-slate-700">{children}</td>,
                  blockquote: ({ children }) => <blockquote className="mb-2 border-l-2 border-blue-400 pl-3 italic text-slate-600 dark:text-slate-400">{children}</blockquote>,
                  hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Download files */}
        {!isUser && message.files && message.files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.files.map((file) => (
              <FileDownloadButton key={file.fileId} file={file} />
            ))}
          </div>
        )}

        {/* Quick reply buttons */}
        {!isUser && quickReplies.length > 0 && onQuickReply && (
          <div className="mt-2 flex flex-wrap gap-2">
            {quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => onQuickReply(qr.text)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-700 transition-all hover:border-blue-400 hover:bg-blue-100 hover:shadow-sm dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
              >
                <Sparkles className="size-3 text-blue-500 transition-transform group-hover:scale-110" />
                {qr.label}
                <ArrowUp className="size-3 text-blue-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}

        <span className="mt-1 px-1 text-[10px] text-slate-400">
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </span>
      </div>
    </div>
  );
}

// ─── File Download Button ───

function FileDownloadButton({ file }: { file: McpFile }) {
  const isPdf = file.fileType === "pdf";
  const Icon = isPdf ? FileText : FileSpreadsheet;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await keywordMcpApi.downloadFile(file.fileId, file.fileName);
    } catch (err) {
      alert(`Download failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-all hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
    >
      <Icon className="size-4" />
      <div>
        <p className="text-xs font-bold">Download {file.fileType.toUpperCase()}</p>
        <p className="text-[10px] text-blue-500">{file.fileName}</p>
      </div>
      {downloading ? <Loader2 className="ml-2 size-4 animate-spin" /> : <Download className="ml-2 size-4" />}
    </button>
  );
}

// ─── Page Export ───

export default function ContentStrategyPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <QuasarMcpContent />
      </DashboardLayout>
    </RequireAuth>
  );
}
