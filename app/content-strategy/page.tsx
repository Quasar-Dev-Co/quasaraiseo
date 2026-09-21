"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Server, Send, Bot, User, Wrench, Loader2, CheckCircle2,
  Search, Globe, FileText, FileSpreadsheet, Trash2, Download,
  CircleDot, Cpu, Activity, ChevronRight, Sparkles, Terminal,
  Plus, MessageSquare, Paperclip, ArrowUp, X, BarChart3,
  ShieldCheck, Wand2, Code2, Image, FilePlus, Edit3, Layout,
  Info, Eye, Calendar, Layers, FolderTree, GitBranch, Settings,
  Plug, Building2, Upload, ChevronDown, Check, ShieldAlert, Images,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  keywordMcpApi,
  setStoredSessionMessages,
  type McpChatAttachment,
  type McpChatMessage,
  type McpSession,
  type McpToolCall,
  type McpFile,
  type McpSessionPreview,
  type ModelRecord,
} from "@/lib/keyword-mcp-api";
import {
  mcpConnectionsApi,
  type McpConnection,
} from "@/lib/mcp-connections-api";
import { brandingApi, type Branding } from "@/lib/branding-api";
import { wordpressApi, type WordPressSite } from "@/lib/wordpress-api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ModelSelector, usePersistentModel } from "@/components/ModelSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { WebsiteMediaGallery } from "@/components/mcp/website-media-gallery";

// ─── Tool icons ───

const TOOL_ICONS: Record<string, typeof Search> = {
  web_search: Search,
  fetch_url: Globe,
  get_branding: Sparkles,
  save_keyword_report: FileText,
  generate_pdf: FileText,
  generate_csv: FileSpreadsheet,
  get_search_console_sites: Globe,
  get_search_console_data: Globe,
  get_analytics_properties: BarChart3,
  get_analytics_data: BarChart3,
  analyze_seo: ShieldCheck,
  fix_seo: Wand2,
  generate_schema: Code2,
  extract_design: Layout,
  search_media: Image,
  create_post: FilePlus,
  update_post: Edit3,
  delete_post: Trash2,
  create_content: FilePlus,
  update_content: Edit3,
  delete_content: Trash2,
  list_content: FileText,
  update_seo: Wand2,
  list_media: Image,
  update_custom_render: Code2,
  get_site_info: Info,
  get_content: Eye,
  publish_content: Send,
  schedule_content: Calendar,
  get_global_render: Layout,
  update_global_render: Layout,
  list_categories: FolderTree,
  list_tags: FolderTree,
  get_revisions: GitBranch,
  get_media: Image,
  get_schema: Code2,
  regenerate_schema_type: Wand2,
  save_schema_type: Code2,
  delete_schema_type: Trash2,
  get_schema_settings: Settings,
  update_schema_settings: Settings,
};

function getToolLabel(tool: string, args: Record<string, unknown>): string {
  if (tool === "web_search") return `Searching: "${args.query || ""}"`;
  if (tool === "fetch_url") return `Fetching: ${String(args.url || "").slice(0, 50)}`;
  if (tool === "get_branding") return "Loading your branding info";
  if (tool === "save_keyword_report") return "Saving keyword report";
  if (tool === "generate_pdf") return "Generating PDF";
  if (tool === "generate_csv") return "Generating CSV";
  if (tool === "get_search_console_sites") return "Fetching Search Console sites";
  if (tool === "get_search_console_data") return "Fetching Search Console data";
  if (tool === "get_analytics_properties") return "Fetching Analytics properties";
  if (tool === "get_analytics_data") return "Fetching Analytics data";
  if (tool === "analyze_seo") return `Analyzing SEO: ${String(args.url || "").slice(0, 50)}`;
  if (tool === "fix_seo") return `Fixing SEO on post ${args.postId || ""}`;
  if (tool === "generate_schema") return `Generating ${args.schemaType || ""} schema`;
  if (tool === "extract_design") return `Extracting design from ${String(args.url || "").slice(0, 50)}`;
  if (tool === "search_media") return `Searching media: "${args.search || ""}"`;
  if (tool === "create_post" || tool === "create_content") return `Creating ${args.post_type === "page" ? "page" : "post"}: "${String(args.title || "").slice(0, 40)}"`;
  if (tool === "update_post" || tool === "update_content") return `Updating post ${args.postId || args.id || ""}`;
  if (tool === "delete_post" || tool === "delete_content") return `Deleting post ${args.postId || args.id || ""}`;
  if (tool === "list_content") return `Listing ${args.post_type === "page" ? "pages" : "content"}`;
  if (tool === "update_seo") return `Updating SEO on post ${args.id || args.postId || ""}`;
  if (tool === "list_media") return `Listing media${args.search ? `: "${String(args.search).slice(0, 40)}"` : ""}`;
  if (tool === "update_custom_render") return `Updating custom render on post ${args.postId || args.id || ""}`;
  if (tool === "get_site_info") return "Fetching site info";
  if (tool === "get_content") return `Fetching content: ${args.postId || args.id || args.slug || ""}`;
  if (tool === "publish_content") return `Publishing post ${args.postId || args.id || ""}`;
  if (tool === "schedule_content") return `Scheduling post ${args.postId || args.id || ""}`;
  if (tool === "get_global_render") return "Fetching global render settings";
  if (tool === "update_global_render") return "Updating global render settings";
  if (tool === "list_categories") return "Fetching categories";
  if (tool === "list_tags") return "Fetching tags";
  if (tool === "get_revisions") return `Fetching revisions for post ${args.postId || args.id || ""}`;
  if (tool === "get_media") return `Fetching media ${args.mediaId || args.id || ""}`;
  if (tool === "get_schema") return `Fetching schema from ${String(args.url || "").slice(0, 50)}`;
  if (tool === "regenerate_schema_type") return `Regenerating ${args.schemaType || ""} schema`;
  if (tool === "save_schema_type") return `Saving ${args.schemaType || ""} schema`;
  if (tool === "delete_schema_type") return `Deleting ${args.schemaType || ""} schema`;
  if (tool === "get_schema_settings") return "Fetching schema settings";
  if (tool === "update_schema_settings") return "Updating schema settings";
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
  const [pendingAttachments, setPendingAttachments] = useState<McpChatAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = session?.id ?? null;
  const [isThinking, setIsThinking] = useState(false);
  const [activeTools, setActiveTools] = useState<McpToolCall[]>([]);
  const [models, setModels] = useState<ModelRecord[]>([]);
  const { selectedModel, setModel } = usePersistentModel(models);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const [webBuilderMode, setWebBuilderMode] = useState(false);
  const [mcpConnections, setMcpConnections] = useState<McpConnection[]>([]);
  const [mcpToggling, setMcpToggling] = useState(false);

  // Brandings and WordPress sites for auto-filling and selecting
  const [brandings, setBrandings] = useState<Branding[]>([]);
  const [wpSites, setWpSites] = useState<WordPressSite[]>([]);

  // Website context state for the active chat
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteLogoUrl, setSiteLogoUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedMcpId, setSelectedMcpId] = useState<string>("auto");
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Slash commands popup state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  // Sync state when active session changes
  useEffect(() => {
    if (session) {
      setSiteName(session.websiteName || "");
      setSiteUrl(session.websiteUrl || "");
      setSiteLogoUrl(session.websiteLogoUrl || "");
      setInstructions(session.additionalInstructions || "");
      setSelectedMcpId(session.mcpConnectionId || "auto");
    }
  }, [session?.id]);

  // Load brandings & WP sites on startup
  useEffect(() => {
    brandingApi.getAll().then(setBrandings).catch(() => {});
    wordpressApi.getSites().then(setWpSites).catch(() => {});
  }, []);

  // The backend uses the oldest enabled connection (createdAt asc) —
  // mirror that here so the badge shows the server that actually routes tools.
  const activeMcp =
    [...mcpConnections]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .find((c) => c.enabled) || null;

  const handleMcpToggle = async () => {
    if (mcpConnections.length === 0 || mcpToggling) return;
    setMcpToggling(true);
    try {
      const target = activeMcp
        ? { id: activeMcp.id, enabled: false }
        : {
            id: [...mcpConnections].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            )[0].id,
            enabled: true,
          };
      const updated = await mcpConnectionsApi.update(target.id, { enabled: target.enabled });
      setMcpConnections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch {
    } finally {
      setMcpToggling(false);
    }
  };

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
        setSiteName(session.websiteName || "");
        setSiteUrl(session.websiteUrl || "");
        setSiteLogoUrl(session.websiteLogoUrl || "");
        setInstructions(session.additionalInstructions || "");
        setSelectedMcpId(session.mcpConnectionId || "auto");
      })
      .catch(() => {});
    mcpConnectionsApi.getAll().then(setMcpConnections).catch(() => {});
    loadSessions();
    keywordMcpApi.listModels()
      .then(({ models }) => setModels(models))
      .catch(() => {});
  }, [loadSessions]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, activeTools]);

  // Slash commands catalog
  const slashCommands = [
    {
      cmd: "/compact",
      label: "Compact Conversation",
      desc: "Summarize chat history into a concise context block to reduce tokens",
      icon: Sparkles,
      color: "text-purple-500",
      prompt: `Please compact and summarize our conversation so far. Retain all key decisions, identified target keywords, site details, and action items in a concise briefing summary so we can continue smoothly without losing context.`,
    },
    {
      cmd: "/generate-post",
      label: "Generate Blog Post",
      desc: "Create full SEO-optimized publish-ready blog article",
      icon: FilePlus,
      color: "text-blue-500",
      prompt: siteName
        ? `Generate a comprehensive, SEO-optimized, publish-ready blog post for ${siteName} (${siteUrl || ""}). Include: Catchy title (max 60 chars), meta description (max 160 chars), URL slug, clean structured HTML body with <h2>, <h3>, <ul>, <ol>, <table>, FAQ block, call to action, and Article + FAQPage schema markup in JSON-LD. Output should be formatted and ready to push to WordPress.`
        : `Generate a comprehensive, SEO-optimized, publish-ready blog post for this website. Include: Catchy title (max 60 chars), meta description (max 160 chars), URL slug, clean structured HTML body with <h2>, <h3>, <ul>, <ol>, <table>, FAQ block, call to action, and Article + FAQPage schema markup in JSON-LD. Output should be formatted and ready to push to WordPress.`,
    },
    {
      cmd: "/generate-page",
      label: "Generate Landing Page",
      desc: "Build complete landing page with hero, features & FAQ",
      icon: Layout,
      color: "text-emerald-500",
      prompt: siteName
        ? `Generate a complete high-converting landing page structure and content for ${siteName} (${siteUrl || ""}). Include: Hero section with clear value proposition and CTA, Social proof/trust badges, Core services/features breakdown, Comparison or pricing table, Testimonials, Interactive FAQ section with schema markup, and Final conversion banner.`
        : `Generate a complete high-converting landing page structure and content for this website. Include: Hero section with clear value proposition and CTA, Social proof/trust badges, Core services/features breakdown, Comparison or pricing table, Testimonials, Interactive FAQ section with schema markup, and Final conversion banner.`,
    },
    {
      cmd: "/security-inspect",
      label: "Security & SEO Inspection",
      desc: "Audit headers, SSL, robots.txt, schema, and crawler safety",
      icon: ShieldAlert,
      color: "text-amber-500",
      prompt: siteUrl
        ? `Perform a comprehensive technical security and SEO audit on ${siteUrl}. Inspect: 1) HTTPS and SSL configuration, 2) Security response headers (CSP, HSTS, X-Frame-Options, Permissions-Policy), 3) Robots.txt rules and AI crawler access directives (GPTBot, ClaudeBot, PerplexityBot), 4) Canonical URL tag and indexability, 5) JSON-LD structured data schema validation, and 6) Provide actionable security & SEO hardening recommendations.`
        : `Perform a comprehensive technical security and SEO audit on this website. Inspect: 1) HTTPS and SSL configuration, 2) Security response headers (CSP, HSTS, X-Frame-Options, Permissions-Policy), 3) Robots.txt rules and AI crawler access directives, 4) Canonical URL tag and indexability, 5) JSON-LD structured data schema validation, and 6) Provide actionable security & SEO hardening recommendations.`,
    },
  ];

  const filteredSlashCommands = input.startsWith("/")
    ? slashCommands.filter(
        (c) =>
          c.cmd.toLowerCase().includes(input.toLowerCase().trim()) ||
          c.label.toLowerCase().includes(input.slice(1).toLowerCase().trim())
      )
    : [];

  const handleSelectSlashCommand = (cmdObj: typeof slashCommands[0]) => {
    setInput(cmdObj.prompt);
    setSlashMenuOpen(false);
  };

  // Optimistic sidebar update: bump the session to the top and set its
  // preview to the user's message instantly (no server round-trip wait).
  const bumpSessionPreview = (sessionId: string, text: string) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
      const now = new Date().toISOString();
      if (idx === -1) {
        return [
          { id: sessionId, preview: text.slice(0, 60), messageCount: 1, updatedAt: now, createdAt: now },
          ...prev,
        ];
      }
      const existing = prev[idx];
      const rest = [...prev];
      rest.splice(idx, 1);
      return [
        {
          ...existing,
          preview: existing.preview === "New chat" ? text.slice(0, 60) : existing.preview,
          messageCount: existing.messageCount + 1,
          updatedAt: now,
        },
        ...rest,
      ];
    });
  };

  const clearComposerAttachments = () => {
    setPendingAttachments([]);
    setUploadNote(null);
    setGalleryOpen(false);
  };

  const handleAttachFiles = async (files: FileList | null) => {
    if (!files?.length || !session || uploadingFile) return;
    const sessionId = session.id;
    setUploadingFile(true);
    setUploadNote(null);
    try {
      const uploaded: McpChatAttachment[] = [];
      for (const file of Array.from(files).slice(0, 8 - pendingAttachments.length)) {
        const result = await keywordMcpApi.uploadAttachment(sessionId, file);
        uploaded.push(result.attachment);
      }
      if (sessionIdRef.current !== sessionId) return;
      setPendingAttachments((prev) => [...prev, ...uploaded].slice(0, 8));
    } catch (err) {
      if (sessionIdRef.current === sessionId) {
        setUploadNote(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && pendingAttachments.length === 0) || isThinking || !session || uploadingFile) return;
    const outgoing = pendingAttachments;

    const userMsg: McpChatMessage = {
      role: "user",
      content: text || "Use the attached files.",
      timestamp: Date.now(),
      attachments: outgoing,
    };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      if (session?.id) {
        setStoredSessionMessages(session.id, next);
      }
      return next;
    });
    setInput("");
    setPendingAttachments([]);
    setIsThinking(true);
    setActiveTools([]);
    bumpSessionPreview(session.id, text || "Attached files");

    try {
      const siteMeta = {
        websiteName: siteName || undefined,
        websiteUrl: siteUrl || undefined,
        websiteLogoUrl: siteLogoUrl || undefined,
        additionalInstructions: instructions || undefined,
        mcpConnectionId: selectedMcpId === "auto" ? undefined : selectedMcpId,
      };
      const result = await keywordMcpApi.sendMessage(
        session.id,
        text || "Use the attached files.",
        selectedModel,
        webBuilderMode ? "web-builder" : undefined,
        siteMeta,
        outgoing,
      );
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
      setMessages((prev) => {
        const next = [...prev, assistantMsg];
        if (session?.id) {
          setStoredSessionMessages(session.id, next);
        }
        return next;
      });
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
    if (slashMenuOpen && filteredSlashCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % filteredSlashCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectSlashCommand(filteredSlashCommands[selectedSlashIndex] || filteredSlashCommands[0]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick reply: sends a preset message as if the user typed it
  const handleQuickReply = useCallback(async (text: string) => {
    if (!text.trim() || isThinking || !session) return;
    const userMsg: McpChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      if (session?.id) {
        setStoredSessionMessages(session.id, next);
      }
      return next;
    });
    setIsThinking(true);
    setActiveTools([]);
    bumpSessionPreview(session.id, text);
    try {
      const siteMeta = {
        websiteName: siteName || undefined,
        websiteUrl: siteUrl || undefined,
        websiteLogoUrl: siteLogoUrl || undefined,
        additionalInstructions: instructions || undefined,
        mcpConnectionId: selectedMcpId === "auto" ? undefined : selectedMcpId,
      };
      const result = await keywordMcpApi.sendMessage(
        session.id,
        text,
        selectedModel,
        webBuilderMode ? "web-builder" : undefined,
        siteMeta,
      );
      if (result.toolCalls && result.toolCalls.length > 0) setActiveTools(result.toolCalls);
      const assistantMsg: McpChatMessage = {
        role: "assistant",
        content: result.response,
        timestamp: Date.now(),
        toolCalls: result.toolCalls,
        files: result.files,
      };
      setMessages((prev) => {
        const next = [...prev, assistantMsg];
        if (session?.id) {
          setStoredSessionMessages(session.id, next);
        }
        return next;
      });
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
  }, [session, isThinking, selectedModel, webBuilderMode, siteName, siteUrl, siteLogoUrl, instructions, selectedMcpId, loadSessions]);

  const handleSaveContext = async () => {
    if (!session) return;
    setIsSavingContext(true);
    try {
      const meta = {
        websiteName: siteName.trim() || undefined,
        websiteUrl: siteUrl.trim() || undefined,
        websiteLogoUrl: siteLogoUrl.trim() || undefined,
        additionalInstructions: instructions.trim() || undefined,
        mcpConnectionId: selectedMcpId === "auto" ? null : selectedMcpId,
      };
      const { session: updated } = await keywordMcpApi.updateSession(session.id, meta);
      setSession(updated);
      setSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...meta } : s))
      );
      setContextSaved(true);
      setTimeout(() => setContextSaved(false), 2500);
    } catch (err) {
      alert(`Failed to save settings: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSavingContext(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const logoUrl = await brandingApi.uploadLogo(file);
      const fullLogoUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${logoUrl}`;
      setSiteLogoUrl(fullLogoUrl);
    } catch {
      // Fallback: convert to base64 data url for preview/save
      const reader = new FileReader();
      reader.onload = (event) => {
        setSiteLogoUrl(String(event.target?.result || ""));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSelectBrandingPreset = (b: Branding) => {
    setSiteName(b.companyName);
    if (b.website) setSiteUrl(b.website);
    if (b.logoUrl) {
      const fullLogo = b.logoUrl.startsWith("http")
        ? b.logoUrl
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${b.logoUrl}`;
      setSiteLogoUrl(fullLogo);
    }
    if (b.description || b.tagline) {
      setInstructions((prev) => prev || (b.tagline ? `${b.tagline}. ${b.description || ""}` : b.description || ""));
    }
    const cleanHost = (b.website || "").replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
    const cleanName = b.companyName.toLowerCase().trim();
    const matchedMcp = mcpConnections.find((c) => {
      const cName = c.name.toLowerCase();
      const cUrl = c.url.toLowerCase();
      return (
        (cleanName && (cName.includes(cleanName) || cleanName.includes(cName))) ||
        (cleanHost && (cUrl.includes(cleanHost) || cleanHost.includes(cUrl)))
      );
    });
    if (matchedMcp) setSelectedMcpId(matchedMcp.id);
  };

  const handleSelectWpSitePreset = (w: WordPressSite) => {
    setSiteName(w.siteName || new URL(w.siteUrl).hostname);
    setSiteUrl(w.siteUrl);
    const matchedMcp = mcpConnections.find((c) =>
      c.url.toLowerCase().includes(new URL(w.siteUrl).hostname.toLowerCase()) ||
      c.name.toLowerCase().includes(new URL(w.siteUrl).hostname.toLowerCase())
    );
    if (matchedMcp) setSelectedMcpId(matchedMcp.id);
  };

  // New Chat modal state
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newSiteLogoUrl, setNewSiteLogoUrl] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newMcpId, setNewMcpId] = useState<string>("auto");

  const openNewChatModal = () => {
    setNewSiteName("");
    setNewSiteUrl("");
    setNewSiteLogoUrl("");
    setNewInstructions("");
    setNewMcpId("auto");
    setNewChatModalOpen(true);
  };

  const handleCreateChatWithSite = async () => {
    try {
      const meta = {
        websiteName: newSiteName.trim() || undefined,
        websiteUrl: newSiteUrl.trim() || undefined,
        websiteLogoUrl: newSiteLogoUrl.trim() || undefined,
        additionalInstructions: newInstructions.trim() || undefined,
        mcpConnectionId: newMcpId === "auto" ? undefined : newMcpId,
      };
      const { session: newSession } = await keywordMcpApi.createNewSession(meta);
      setSession(newSession);
      setMessages([]);
      setInput("");
      clearComposerAttachments();
      setIsThinking(false);
      setActiveTools([]);
      setSiteName(newSession.websiteName || "");
      setSiteUrl(newSession.websiteUrl || "");
      setSiteLogoUrl(newSession.websiteLogoUrl || "");
      setInstructions(newSession.additionalInstructions || "");
      setSelectedMcpId(newSession.mcpConnectionId || "auto");
      setNewChatModalOpen(false);
      setContextDrawerOpen(false);

      setSessions((prev) => [
        {
          id: newSession.id,
          preview: newSession.websiteName ? `Website: ${newSession.websiteName}` : "New chat",
          websiteName: newSession.websiteName || null,
          websiteUrl: newSession.websiteUrl || null,
          websiteLogoUrl: newSession.websiteLogoUrl || null,
          additionalInstructions: newSession.additionalInstructions || null,
          mcpConnectionId: newSession.mcpConnectionId || null,
          messageCount: 0,
          updatedAt: newSession.updatedAt,
          createdAt: newSession.createdAt,
        },
        ...prev,
      ]);
      loadSessions();
    } catch (err) {
      alert(`Failed to create chat: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleNewChat = async () => {
    openNewChatModal();
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      const { session: loaded } = await keywordMcpApi.getSessionById(sessionId);
      setSession(loaded);
      setMessages(loaded.messages || []);
      clearComposerAttachments();
      setSiteName(loaded.websiteName || "");
      setSiteUrl(loaded.websiteUrl || "");
      setSiteLogoUrl(loaded.websiteLogoUrl || "");
      setInstructions(loaded.additionalInstructions || "");
      setSelectedMcpId(loaded.mcpConnectionId || "auto");
      setIsThinking(false);
      setActiveTools([]);
      setContextDrawerOpen(false);
    } catch {}
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic: remove from the list instantly
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    try {
      await keywordMcpApi.clearSession(sessionId);
      // If we deleted the active session, create a new one
      if (session?.id === sessionId) {
        const { session: newSession } = await keywordMcpApi.createNewSession();
        setSession(newSession);
        setMessages([]);
        clearComposerAttachments();
        setSiteName("");
        setSiteUrl("");
        setSiteLogoUrl("");
        setInstructions("");
        setSelectedMcpId("auto");
        setSessions((prev) => [
          {
            id: newSession.id,
            preview: "New chat",
            messageCount: 0,
            updatedAt: newSession.updatedAt,
            createdAt: newSession.createdAt,
          },
          ...prev.filter((s) => s.id !== sessionId),
        ]);
      }
      loadSessions();
    } catch {
      // Roll back on failure
      loadSessions();
    }
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
      <div className="flex items-center justify-between border-b border-slate-200/90 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-[0_4px_14px_rgba(217,70,239,0.35)]">
            <Server className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Quasar MCP
              </h1>
              {siteName && (
                <span className="hidden items-center gap-1 rounded-full border border-fuchsia-200/80 bg-fuchsia-50/80 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700 dark:border-fuchsia-500/20 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 sm:inline-flex">
                  <Globe className="size-2.5" />
                  {siteName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI SEO Agent Server & Workspace
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
          {/* Additional MCP switch — toggles WordPress tools routing */}
          {mcpConnections.length === 0 ? (
            <Link
              href="/additional-mcp"
              className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-fuchsia-400 hover:text-fuchsia-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-fuchsia-500 dark:hover:text-fuchsia-400"
            >
              <Plug className="size-3" />
              Add MCP
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleMcpToggle}
              disabled={mcpToggling}
              title={
                activeMcp
                  ? `Additional MCP active: ${activeMcp.name} — click to turn off (WordPress tools will use direct REST)`
                  : "Additional MCP off — click to route WordPress tools through your MCP server"
              }
              className={`flex items-center gap-2 rounded-full border px-1.5 py-1 text-xs font-medium transition ${
                activeMcp
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
              }`}
            >
              {mcpToggling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plug className={`size-3.5 ${activeMcp ? "text-emerald-500" : "text-slate-400"}`} />
              )}
              <span className="max-w-36 truncate">{activeMcp ? activeMcp.name : "MCP Off"}</span>
              <span
                className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition ${
                  activeMcp ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block size-3 transform rounded-full bg-white shadow transition ${
                    activeMcp ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          )}
          <Button variant="outline" size="sm" onClick={handleNewChat} className="gap-1.5 text-xs font-semibold border-slate-200 dark:border-white/10 hover:border-slate-300">
            <Plus className="size-3.5" />
            New Website Chat
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ─── LEFT: Sessions + Activity ─── */}
        <div className="hidden w-[340px] shrink-0 flex-col border-r border-slate-200/90 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70 md:flex min-h-0">

          {/* New Chat button at top of sidebar */}
          <div className="border-b border-slate-200/90 p-3.5 dark:border-white/10 bg-white/60 dark:bg-slate-900/60">
            <Button
              onClick={handleNewChat}
              className="w-full gap-2 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
              size="sm"
            >
              <Plus className="size-4" />
              New Website Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 min-h-0 space-y-4">

            {/* Active tools while thinking */}
            {isThinking && (
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs dark:border-white/10 dark:bg-slate-900">
                  <Loader2 className="size-4 animate-spin text-fuchsia-600 dark:text-fuchsia-400" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Agent is working...
                  </span>
                </div>
                {activeTools.length > 0 && (
                  <div className="space-y-1.5">
                    {activeTools.map((tc, i) => (
                      <ToolCallItem key={i} tool={tc} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat history list */}
            <div>
              <div className="mb-2.5 flex items-center justify-between px-1">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chat Threads
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  {sessions.length} {sessions.length === 1 ? "thread" : "threads"}
                </span>
              </div>
              <div className="space-y-2">
                {sessions.length === 0 && !isThinking && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center dark:border-white/10">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      No chat threads yet
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      Click &ldquo;New Website Chat&rdquo; above to start
                    </p>
                  </div>
                )}
                {sessions.map((s) => {
                  const isSelected = session?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`group relative cursor-pointer rounded-xl border p-3 transition-all duration-150 ${
                        isSelected
                          ? "border-fuchsia-500 bg-white text-slate-900 shadow-sm ring-1 ring-fuchsia-500/30 dark:border-fuchsia-500/80 dark:bg-slate-900 dark:text-white dark:ring-fuchsia-500/30"
                          : "border-slate-200/80 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 relative size-6 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-slate-800">
                          {s.websiteLogoUrl ? (
                            <img src={s.websiteLogoUrl} alt="" className="size-full object-contain" />
                          ) : (
                            <div className="grid size-full place-items-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              {s.websiteName ? s.websiteName.charAt(0).toUpperCase() : <Globe className="size-3 text-slate-400" />}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {s.websiteName || "General Chat"}
                            </span>
                            <span className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                              {formatDate(s.updatedAt)}
                            </span>
                          </div>

                          {s.websiteUrl && (
                            <span className="block truncate text-[10px] font-medium text-slate-400 dark:text-slate-400">
                              {s.websiteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")}
                            </span>
                          )}

                          <p className={`mt-1 line-clamp-2 text-[11px] leading-snug ${
                            isSelected
                              ? "text-slate-800 dark:text-slate-200 font-medium"
                              : "text-slate-600 dark:text-slate-400"
                          }`}>
                            {s.preview}
                          </p>

                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                            <span>{s.messageCount} {s.messageCount === 1 ? "message" : "messages"}</span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(s.id, e)}
                              title="Delete thread"
                              className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

          {/* Website Target Banner & Config Bar on Top */}
          <div className="border-b border-slate-200/90 bg-white px-4 py-2.5 backdrop-blur-md dark:border-white/10 dark:bg-slate-900">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-slate-800">
                  {siteLogoUrl ? (
                    <img src={siteLogoUrl} alt={siteName || "Logo"} className="size-full object-contain" />
                  ) : (
                    <div className="grid size-full place-items-center text-xs font-bold text-slate-500">
                      {siteName ? siteName.charAt(0).toUpperCase() : <Globe className="size-4 text-slate-400" />}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                      {siteName || "General Chat"}
                    </span>
                    {siteUrl && (
                      <span className="hidden sm:inline-block truncate text-[11px] text-slate-400">
                        ({siteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")})
                      </span>
                    )}
                    {selectedMcpId && selectedMcpId !== "auto" && (
                      <span className="hidden md:inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.2 text-[9px] font-bold text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
                        <Plug className="size-2.5 text-emerald-500" />
                        {mcpConnections.find((c) => c.id === selectedMcpId)?.name || "Custom MCP"}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {instructions
                      ? `Instructions: "${instructions.slice(0, 45)}${instructions.length > 45 ? "..." : ""}"`
                      : "Targeted chat workspace for this website"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {contextSaved && (
                  <span className="hidden items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 sm:inline-flex">
                    <Check className="size-3.5" /> Saved!
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContextDrawerOpen((prev) => !prev)}
                  className={`gap-1.5 text-xs font-semibold ${
                    contextDrawerOpen
                      ? "border-slate-300 bg-slate-100 text-slate-900 dark:border-white/20 dark:bg-slate-800 dark:text-white"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <Settings className="size-3.5" />
                  <span>Configure Site</span>
                  <ChevronDown className={`size-3 transition-transform ${contextDrawerOpen ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Expandable Configuration Drawer */}
            {contextDrawerOpen && (
              <div className="mx-auto mt-3 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-fuchsia-600 dark:text-fuchsia-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Target Website Settings for this Chat
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContextDrawerOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Auto-fill buttons from saved brandings / WP sites */}
                {(brandings.length > 0 || wpSites.length > 0) && (
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-slate-200/60 pb-3 dark:border-white/5">
                    <span className="text-[11px] font-semibold text-slate-500">Auto-fill from:</span>
                    {brandings.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectBrandingPreset(b)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 transition hover:border-fuchsia-400 hover:text-fuchsia-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Building2 className="size-3 text-fuchsia-500" />
                        {b.companyName}
                      </button>
                    ))}
                    {wpSites.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleSelectWpSitePreset(w)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Globe className="size-3 text-blue-500" />
                        {w.siteName || w.siteUrl.replace(/^https?:\/\//, "")}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Website Name
                    </label>
                    <Input
                      placeholder="e.g. Acme Studio"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="h-8 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Website URL
                    </label>
                    <Input
                      placeholder="https://example.com"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="h-8 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Website Logo (URL or Upload)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/logo.png"
                        value={siteLogoUrl}
                        onChange={(e) => setSiteLogoUrl(e.target.value)}
                        className="h-8 flex-1 text-xs bg-white dark:bg-slate-800"
                      />
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="h-8 px-2 text-xs"
                      >
                        {isUploadingLogo ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Assigned MCP Server
                    </label>
                    <select
                      value={selectedMcpId}
                      onChange={(e) => setSelectedMcpId(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-input bg-white px-2.5 text-xs text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-800 dark:text-white"
                    >
                      <option value="auto">Auto (Default / First Enabled MCP)</option>
                      {mcpConnections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.enabled ? "(Enabled)" : "(Disabled)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Additional Instructions for this Website (Passed to AI on every message)
                  </label>
                  <Textarea
                    placeholder="e.g. Always write in British English, tone should be friendly and authoritative, focus on local SEO in Manchester, avoid mentioning competitor BrandX..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={2}
                    className="min-h-[56px] text-xs bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  {contextSaved && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="size-4" /> Saved successfully!
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveContext}
                    disabled={isSavingContext}
                    className="gap-1.5 h-8 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-xs font-bold text-white shadow-sm hover:opacity-95"
                  >
                    {isSavingContext ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Save Website Settings
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0 bg-slate-50/30 dark:bg-slate-950/30">
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
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-fuchsia-500/20">
                    {siteLogoUrl ? (
                      <img src={siteLogoUrl} alt={siteName || "Logo"} className="size-10 rounded-xl object-contain" />
                    ) : (
                      <Bot className="size-8" />
                    )}
                  </div>
                  <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">
                    {siteName ? `${siteName} — AI Agent` : "Quasar MCP Server"}
                  </h2>
                  <p className="mx-auto mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    {siteUrl
                      ? `Dedicated agent targeting ${siteUrl}. Search keywords, optimize meta tags, generate articles, and run SEO audits specifically for this website.`
                      : "A real AI agent that can search the web, read your branding, research keywords, and generate PDF/CSV reports. Just tell it what you need."}
                  </p>

                  <div className="mx-auto max-w-lg space-y-2">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Try these</p>
                    {[
                      siteName ? `Find top keywords for ${siteName}` : "Find keywords for my website",
                      siteName ? `Analyze SEO structure for ${siteName}` : "Research keywords for AI web development",
                      siteUrl ? `Check search console and audit ${siteUrl}` : "Search keywords for dentist in Portland",
                      "Generate comprehensive keyword strategy report as PDF",
                    ].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => setInput(cmd)}
                        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm text-slate-600 transition-all hover:border-fuchsia-300 hover:bg-fuchsia-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-fuchsia-700 dark:hover:bg-fuchsia-950/30"
                      >
                        <Terminal className="size-4 text-fuchsia-500" />
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
                <div className="flex gap-3.5">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(217,70,239,0.3)]">
                    <Bot className="size-4.5" />
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-xs border border-slate-200/90 bg-white px-5 py-3.5 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
                    <Loader2 className="size-4 animate-spin text-fuchsia-600 dark:text-fuchsia-400" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
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

          {/* Input — modern refined chat bar */}
          <div className="border-t border-slate-200/90 bg-white/90 px-4 py-3.5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
            <div className="mx-auto max-w-3xl relative">
              {/* Slash commands autocomplete dropdown */}
              {slashMenuOpen && filteredSlashCommands.length > 0 && (
                <div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Quick Commands
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Press Tab or Enter to select
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1 space-y-1">
                    {filteredSlashCommands.map((sc, idx) => {
                      const Icon = sc.icon;
                      const isHighlighted = idx === selectedSlashIndex;
                      return (
                        <button
                          key={sc.cmd}
                          type="button"
                          onClick={() => handleSelectSlashCommand(sc)}
                          onMouseEnter={() => setSelectedSlashIndex(idx)}
                          className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition ${
                            isHighlighted
                              ? "bg-slate-100 dark:bg-slate-800"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 ${sc.color}`}>
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                {sc.cmd}
                              </span>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {sc.label}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">
                              {sc.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rounded input card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-900/90 dark:focus-within:border-fuchsia-500">
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
                {(pendingAttachments.length > 0 || uploadNote) && (
                  <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
                    {pendingAttachments.map((attachment) => (
                      <span key={attachment.id} className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {attachment.kind === "image" ? (
                          <img src={attachment.url} alt="" className="size-6 rounded object-cover" />
                        ) : (
                          <Paperclip className="size-3 shrink-0" />
                        )}
                        <span className="truncate">{attachment.fileName}</span>
                        <button type="button" onClick={() => setPendingAttachments((prev) => prev.filter((item) => item.id !== attachment.id))} className="text-slate-400 hover:text-red-500"><X className="size-3" /></button>
                      </span>
                    ))}
                    {uploadNote && <span className="text-[11px] text-red-600">{uploadNote}</span>}
                  </div>
                )}
                {/* Text area */}
                <div className="px-4 pt-3 pb-1">
                  <Textarea
                    value={input}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInput(val);
                      if (val.startsWith("/")) {
                        setSlashMenuOpen(true);
                        setSelectedSlashIndex(0);
                      } else {
                        setSlashMenuOpen(false);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      webBuilderMode
                        ? "Ask about your website... e.g. 'check my WordPress site' or 'rebuild my landing page'"
                        : siteName
                        ? `Tell the agent what you need for ${siteName}... or type / for commands (/compact, /generate-post, /generate-page, /security-inspect)`
                        : "Tell the agent what you need... or type / for commands (/compact, /generate-post, /generate-page, /security-inspect)"
                    }
                    disabled={isThinking}
                    className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white"
                    rows={1}
                  />
                </div>
                {/* Bottom toolbar */}
                <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                  {/* Left: Quick slash buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.csv,.xls,.xlsx,.doc,.docx,.txt,.md,image/*,application/pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAttachFiles(e.target.files)}
                    />
                    <button
                      type="button"
                      title="Upload a sheet, document, PDF, or image"
                      disabled={!session || uploadingFile || isThinking}
                      onClick={() => fileInputRef.current?.click()}
                      className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {uploadingFile ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
                    </button>
                    <button
                      type="button"
                      title="Choose images already on the website"
                      disabled={!session || isThinking}
                      onClick={() => setGalleryOpen(true)}
                      className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Images className="size-3.5" />
                    </button>
                    {siteName && (
                      <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300 shrink-0">
                        <Globe className="size-3 text-fuchsia-500" />
                        {siteName}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectSlashCommand(slashCommands[0])}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0"
                    >
                      <Sparkles className="size-2.5 text-purple-500" /> /compact
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSlashCommand(slashCommands[1])}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0"
                    >
                      <FilePlus className="size-2.5 text-blue-500" /> /generate-post
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSlashCommand(slashCommands[2])}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0"
                    >
                      <Layout className="size-2.5 text-emerald-500" /> /generate-page
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSlashCommand(slashCommands[3])}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0"
                    >
                      <ShieldAlert className="size-2.5 text-amber-500" /> /security-inspect
                    </button>
                  </div>
                  {/* Right: model selector + send button */}
                  <div className="flex items-center gap-2 shrink-0">
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
                      disabled={(!input.trim() && pendingAttachments.length === 0) || isThinking || uploadingFile}
                      className="grid size-8 place-items-center rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-xs transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {isThinking ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {/* Helper text */}
              <p className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
                Type <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">/</kbd> for quick actions: /compact, /generate-post, /generate-page, /security-inspect
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* New Chat with Specific Website Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white">
                  <Globe className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Start Chat for Specific Website</h3>
                  <p className="text-[11px] text-slate-500">Configure which website and instructions this chat will target</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewChatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Pick from Existing Brandings / WP Sites */}
            {(brandings.length > 0 || wpSites.length > 0) && (
              <div className="my-3.5 rounded-xl border border-fuchsia-100 bg-fuchsia-50/50 p-3 dark:border-fuchsia-500/10 dark:bg-fuchsia-950/20">
                <span className="block text-[11px] font-bold text-fuchsia-900 dark:text-fuchsia-300 mb-2">
                  Quick Select Existing Website:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {brandings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setNewSiteName(b.companyName);
                        if (b.website) setNewSiteUrl(b.website);
                        if (b.logoUrl) {
                          const fullLogo = b.logoUrl.startsWith("http")
                            ? b.logoUrl
                            : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${b.logoUrl}`;
                          setNewSiteLogoUrl(fullLogo);
                        }
                        if (b.description || b.tagline) {
                          setNewInstructions(b.tagline ? `${b.tagline}. ${b.description || ""}` : b.description || "");
                        }
                        const cleanHost = (b.website || "").replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
                        const cleanName = b.companyName.toLowerCase().trim();
                        const matchedMcp = mcpConnections.find((c) => {
                          const cName = c.name.toLowerCase();
                          const cUrl = c.url.toLowerCase();
                          return (
                            (cleanName && (cName.includes(cleanName) || cleanName.includes(cName))) ||
                            (cleanHost && (cUrl.includes(cleanHost) || cleanHost.includes(cUrl)))
                          );
                        });
                        if (matchedMcp) setNewMcpId(matchedMcp.id);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                        newSiteName.toLowerCase() === b.companyName.toLowerCase()
                          ? "border-fuchsia-500 bg-fuchsia-100 text-fuchsia-800 shadow-xs dark:bg-fuchsia-900/50 dark:text-fuchsia-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-fuchsia-400 hover:text-fuchsia-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <Building2 className="size-3 text-fuchsia-500" />
                      {b.companyName}
                    </button>
                  ))}
                  {wpSites.map((w) => {
                    const sName = w.siteName || new URL(w.siteUrl).hostname;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setNewSiteName(sName);
                          setNewSiteUrl(w.siteUrl);
                          const matchedMcp = mcpConnections.find((c) =>
                            c.url.toLowerCase().includes(new URL(w.siteUrl).hostname.toLowerCase()) ||
                            c.name.toLowerCase().includes(new URL(w.siteUrl).hostname.toLowerCase())
                          );
                          if (matchedMcp) setNewMcpId(matchedMcp.id);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                          newSiteName.toLowerCase() === sName.toLowerCase()
                            ? "border-blue-500 bg-blue-100 text-blue-800 shadow-xs dark:bg-blue-900/50 dark:text-blue-200"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <Globe className="size-3 text-blue-500" />
                        {w.siteName || w.siteUrl.replace(/^https?:\/\//, "")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3 mt-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Website Name
                  </label>
                  <Input
                    placeholder="e.g. Acme Studio"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="h-8.5 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Website URL
                  </label>
                  <Input
                    placeholder="https://example.com"
                    value={newSiteUrl}
                    onChange={(e) => setNewSiteUrl(e.target.value)}
                    className="h-8.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Website Logo URL
                  </label>
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={newSiteLogoUrl}
                    onChange={(e) => setNewSiteLogoUrl(e.target.value)}
                    className="h-8.5 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Assigned MCP Server
                  </label>
                  <select
                    value={newMcpId}
                    onChange={(e) => setNewMcpId(e.target.value)}
                    className="flex h-8.5 w-full rounded-md border border-input bg-white px-2.5 text-xs text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-800 dark:text-white"
                  >
                    <option value="auto">Auto (Default / First Enabled MCP)</option>
                    {mcpConnections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.enabled ? "(Enabled)" : "(Disabled)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Additional Instructions for AI (Website-Specific)
                </label>
                <Textarea
                  placeholder="e.g. Always write in UK English, tone is playful and energetic, prioritize ecommerce conversion keywords, focus on our brand voice..."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewChatModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateChatWithSite}
                className="gap-1.5 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-xs font-bold text-white shadow-sm hover:opacity-95"
              >
                <Plus className="size-3.5" />
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      )}

      <WebsiteMediaGallery
        open={galleryOpen}
        sessionId={session?.id || ""}
        onClose={() => setGalleryOpen(false)}
        onUse={(items) => {
          setPendingAttachments((prev) => {
            const next = [...prev];
            for (const item of items) {
              if (next.length >= 8) break;
              if (next.some((existing) => existing.mediaId === item.id)) continue;
              next.push({
                id: `media-${item.id}`,
                fileName: item.title || "Website image",
                mimeType: "image/*",
                kind: "image",
                size: 0,
                url: item.url,
                mediaId: item.id,
                alt: item.alt,
                source: "website",
              });
            }
            return next;
          });
        }}
      />
    </div>
  );
}

// ─── Tool Call Item ───

function ToolCallItem({ tool, compact }: { tool: McpToolCall; compact?: boolean }) {
  const Icon = TOOL_ICONS[tool.name] || Wrench;
  const label = getToolLabel(tool.name, tool.args);

  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-3 py-2 ${compact ? "bg-white shadow-2xs dark:bg-slate-800" : "border border-blue-200/60 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/30"}`}>
      <div className="mt-0.5 shrink-0">
        <Icon className="size-3.5 text-blue-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</p>
        {tool.result && compact && (
          <p className="mt-0.5 truncate text-[10px] text-slate-400 font-mono">{tool.result}</p>
        )}
      </div>
      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
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
    <div className={`flex gap-3.5 transition-all duration-200 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`grid size-9 shrink-0 place-items-center rounded-xl shadow-sm ${
        isUser
          ? "bg-gradient-to-br from-slate-700 to-slate-900 text-white dark:from-slate-600 dark:to-slate-800"
          : "bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(217,70,239,0.3)]"
      }`}>
        {isUser ? <User className="size-4" /> : <Bot className="size-4.5" />}
      </div>

      <div className={`flex max-w-[85%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Tool calls inline */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2.5 w-full space-y-1.5">
            {message.toolCalls.map((tc, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50/80 to-purple-50/40 px-3 py-1.5 shadow-xs dark:border-blue-500/20 dark:from-blue-950/40 dark:to-purple-950/20">
                {(() => {
                  const Icon = TOOL_ICONS[tc.name] || Wrench;
                  return <Icon className="size-3.5 text-blue-600 dark:text-blue-400" />;
                })()}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {getToolLabel(tc.name, tc.args)}
                </span>
                <CheckCircle2 className="ml-auto size-3.5 text-emerald-500" />
              </div>
            ))}
          </div>
        )}

        {/* Message text bubble with clean modern stack styling */}
        <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all ${
          isUser
            ? "rounded-tr-xs bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md dark:from-slate-800 dark:to-slate-700"
            : "rounded-tl-xs border border-slate-200/90 bg-white text-slate-800 shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-200"
        }`}>
          {isUser ? (
            <div>
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {message.attachments.map((attachment) => (
                    attachment.kind === "image" ? (
                      <img key={attachment.id} src={attachment.url} alt={attachment.fileName} className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <span key={attachment.id} className="rounded-md bg-white/10 px-2 py-1 text-[11px]">{attachment.fileName}</span>
                    )
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap font-normal">{message.content}</p>
            </div>
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
                  code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-fuchsia-600 dark:bg-slate-800 dark:text-fuchsia-400">{children}</code>,
                  pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-xl bg-slate-950 p-3.5 text-xs text-slate-100 shadow-xs dark:bg-black">{children}</pre>,
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold hover:text-blue-700 dark:text-blue-400">{children}</a>,
                  table: ({ children }) => <table className="mb-2 w-full border-collapse text-xs overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">{children}</table>,
                  th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-left font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">{children}</th>,
                  td: ({ children }) => <td className="border border-slate-200 px-3 py-1.5 text-slate-600 dark:border-slate-800 dark:text-slate-300">{children}</td>,
                  blockquote: ({ children }) => <blockquote className="my-2 border-l-3 border-fuchsia-500 pl-3.5 italic text-slate-600 dark:text-slate-400">{children}</blockquote>,
                  hr: () => <hr className="my-3 border-slate-200 dark:border-slate-800" />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Download files */}
        {!isUser && message.files && message.files.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {message.files.map((file) => (
              <FileDownloadButton key={file.fileId} file={file} />
            ))}
          </div>
        )}

        {/* Quick reply buttons */}
        {!isUser && quickReplies.length > 0 && onQuickReply && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => onQuickReply(qr.text)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200/80 bg-fuchsia-50/80 px-3.5 py-1.5 text-xs font-semibold text-fuchsia-800 shadow-2xs transition-all hover:border-fuchsia-400 hover:bg-fuchsia-100 hover:shadow-sm dark:border-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:hover:bg-fuchsia-900"
              >
                <Sparkles className="size-3 text-fuchsia-500 transition-transform group-hover:scale-110" />
                {qr.label}
                <ArrowUp className="size-3 text-fuchsia-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}

        <span className="mt-1 px-1 text-[10px] text-slate-400 dark:text-slate-500">
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
      className="flex items-center gap-2.5 rounded-xl border border-fuchsia-200/90 bg-gradient-to-r from-fuchsia-50/70 to-purple-50/40 px-4 py-2 text-sm font-medium text-fuchsia-900 shadow-2xs transition-all hover:bg-fuchsia-100 disabled:opacity-50 dark:border-fuchsia-500/20 dark:bg-fuchsia-950/30 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/60"
    >
      <Icon className="size-4.5 text-fuchsia-600 dark:text-fuchsia-400" />
      <div className="text-left">
        <p className="text-xs font-bold leading-tight">Download {file.fileType.toUpperCase()}</p>
        <p className="text-[10px] text-fuchsia-700/80 dark:text-fuchsia-400/80 max-w-48 truncate">{file.fileName}</p>
      </div>
      {downloading ? <Loader2 className="ml-2 size-4 animate-spin text-fuchsia-600" /> : <Download className="ml-2 size-4 text-fuchsia-600 dark:text-fuchsia-400" />}
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
