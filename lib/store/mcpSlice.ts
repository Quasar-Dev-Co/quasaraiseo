import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface McpServer {
  id: string;
  name: string;
  url: string;
  status: "connected" | "disconnected" | "error";
  toolsCount: number;
  lastPing: string | null;
}

export interface McpTool {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export interface McpResource {
  id: string;
  name: string;
  uri: string;
  type: "audit" | "keyword" | "report" | "config";
  size: string;
}

export interface McpLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  serverName: string;
}

export interface McpState {
  servers: McpServer[];
  tools: McpTool[];
  resources: McpResource[];
  logs: McpLogEntry[];
  apiKey: string;
  port: number;
  isRunning: boolean;
  selectedServerId: string | null;
  mobileSidebarOpen: boolean;
}

const initialState: McpState = {
  servers: [
    {
      id: "srv-1",
      name: "Quasar Audit Engine",
      url: "http://localhost:8080/mcp",
      status: "connected",
      toolsCount: 12,
      lastPing: "2026-07-23T14:30:00Z",
    },
    {
      id: "srv-2",
      name: "Keyword Intelligence",
      url: "http://localhost:8080/mcp/keywords",
      status: "connected",
      toolsCount: 8,
      lastPing: "2026-07-23T14:28:00Z",
    },
    {
      id: "srv-3",
      name: "Report Generator",
      url: "http://localhost:8080/mcp/reports",
      status: "disconnected",
      toolsCount: 5,
      lastPing: null,
    },
  ],
  tools: [
    { id: "tool-1", name: "crawl_website", description: "Crawl a website and extract technical SEO signals", category: "Crawl", enabled: true },
    { id: "tool-2", name: "analyze_keywords", description: "Fetch keyword rankings and search volume data", category: "Keywords", enabled: true },
    { id: "tool-3", name: "get_serp_competitors", description: "Retrieve SERP competitors for a target domain", category: "Keywords", enabled: true },
    { id: "tool-4", name: "generate_audit_report", description: "Generate a full SEO audit report with AI", category: "Report", enabled: true },
    { id: "tool-5", name: "score_technical", description: "Score technical SEO factors from crawl data", category: "Analysis", enabled: true },
    { id: "tool-6", name: "score_content", description: "Score content quality and keyword coverage", category: "Analysis", enabled: true },
    { id: "tool-7", name: "fetch_backlinks", description: "Retrieve backlink profile for a domain", category: "Authority", enabled: false },
    { id: "tool-8", name: "check_indexability", description: "Check robots.txt and meta robots directives", category: "Crawl", enabled: true },
  ],
  resources: [
    { id: "res-1", name: "audit-config.yaml", uri: "config://audit/config.yaml", type: "config", size: "2.4 KB" },
    { id: "res-2", name: "keyword-db.json", uri: "db://keywords/rankings.json", type: "keyword", size: "1.2 MB" },
    { id: "res-3", name: "last-audit-report.pdf", uri: "report://audits/latest.pdf", type: "report", size: "847 KB" },
    { id: "res-4", name: "crawl-cache.json", uri: "cache://crawls/pages.json", type: "audit", size: "3.8 MB" },
  ],
  logs: [
    { id: "log-1", timestamp: "14:30:02", level: "info", message: "MCP server 'Quasar Audit Engine' connected", serverName: "Quasar Audit Engine" },
    { id: "log-2", timestamp: "14:28:15", level: "info", message: "Tool 'crawl_website' registered", serverName: "Quasar Audit Engine" },
    { id: "log-3", timestamp: "14:27:50", level: "warn", message: "Report Generator server timed out", serverName: "Report Generator" },
    { id: "log-4", timestamp: "14:25:00", level: "info", message: "Keyword Intelligence server started on port 8080", serverName: "Keyword Intelligence" },
  ],
  apiKey: "qse-mcp-a7f3e2b1c9d4",
  port: 8080,
  isRunning: true,
  selectedServerId: "srv-1",
  mobileSidebarOpen: false,
};

const mcpSlice = createSlice({
  name: "mcp",
  initialState,
  reducers: {
    toggleServerStatus(state, action: PayloadAction<string>) {
      const server = state.servers.find((s) => s.id === action.payload);
      if (server) {
        server.status = server.status === "connected" ? "disconnected" : "connected";
      }
    },
    setSelectedServer(state, action: PayloadAction<string | null>) {
      state.selectedServerId = action.payload;
    },
    toggleTool(state, action: PayloadAction<string>) {
      const tool = state.tools.find((t) => t.id === action.payload);
      if (tool) {
        tool.enabled = !tool.enabled;
      }
    },
    setApiKey(state, action: PayloadAction<string>) {
      state.apiKey = action.payload;
    },
    setPort(state, action: PayloadAction<number>) {
      state.port = action.payload;
    },
    setRunning(state, action: PayloadAction<boolean>) {
      state.isRunning = action.payload;
    },
    addLog(state, action: PayloadAction<Omit<McpLogEntry, "id">>) {
      state.logs.unshift({
        ...action.payload,
        id: `log-${Date.now()}`,
      });
      if (state.logs.length > 50) {
        state.logs = state.logs.slice(0, 50);
      }
    },
    addServer(state, action: PayloadAction<Omit<McpServer, "id">>) {
      state.servers.push({
        ...action.payload,
        id: `srv-${Date.now()}`,
      });
    },
    removeServer(state, action: PayloadAction<string>) {
      state.servers = state.servers.filter((s) => s.id !== action.payload);
      if (state.selectedServerId === action.payload) {
        state.selectedServerId = null;
      }
    },
    setMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload;
    },
  },
});

export const {
  toggleServerStatus,
  setSelectedServer,
  toggleTool,
  setApiKey,
  setPort,
  setRunning,
  addLog,
  addServer,
  removeServer,
  setMobileSidebarOpen,
} = mcpSlice.actions;

export default mcpSlice.reducer;
