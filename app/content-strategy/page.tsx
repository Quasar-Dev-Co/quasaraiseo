"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Server, Send, Bot, User, Wrench, Loader2, CheckCircle2,
  Search, Globe, FileText, FileSpreadsheet, Trash2, Download,
  CircleDot, Cpu, Activity, ChevronRight, Sparkles, Terminal,
  Plus, MessageSquare,
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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isThinking || !session) return;

    const userMsg: McpChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);
    setActiveTools([]);

    try {
      const result = await keywordMcpApi.sendMessage(session.id, text, selectedModel);
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

              {/* Welcome */}
              {messages.length === 0 && (
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
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <ChatMessageItem key={i} message={msg} />
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

          {/* Input */}
          <div className="border-t border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
            {/* Model selector row */}
            <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 whitespace-nowrap">AI Model</span>
              <div className="w-64">
                <ModelSelector
                  models={models}
                  value={selectedModel}
                  onChange={setModel}
                  dark
                />
              </div>
            </div>
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <div className="relative flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell the agent what you need... e.g. 'find keywords for my website'"
                  disabled={isThinking}
                  className="min-h-[44px] max-h-[120px] resize-none rounded-xl border-slate-200 bg-white pr-10 text-sm dark:border-slate-700 dark:bg-slate-900"
                  rows={1}
                />
                <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-400">
                  ↵ to send
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                size="icon"
                className="size-[44px] shrink-0 rounded-xl"
              >
                {isThinking ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
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

function ChatMessageItem({ message }: { message: McpChatMessage }) {
  const isUser = message.role === "user";

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
