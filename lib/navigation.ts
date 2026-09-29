import {
  BarChart3,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  Globe2,
  Home,
  Network,
  Newspaper,
  PenLine,
  Plug,
  Server,
  Settings,
  type LucideIcon,
} from "lucide-react";

// One source of truth for what each area of the app is called and what it is
// for, in plain words. The sidebar, top bar, page headers and onboarding all
// read from here so the explanations never drift apart.

export type NavItem = {
  href: string;
  label: string;
  /** Short plain-language line shown under the label in the sidebar. */
  hint: string;
  /** One sentence at the top of the page: what you can do here. */
  description: string;
  /** Older internal name, kept visible so existing users can still find it. */
  alias?: string;
  icon: LucideIcon;
  beta?: boolean;
};

export type NavGroup = {
  id: "home" | "plan" | "create" | "publish" | "measure" | "team";
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    label: "Home",
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        hint: "Your progress and next step",
        description: "See where each website stands and what to do next.",
        icon: Home,
      },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    items: [
      {
        href: "/content-strategy",
        label: "Strategy chat",
        alias: "Quasar MCP",
        hint: "Keywords and content plans",
        description:
          "Chat with the SEO agent about one website: research keywords, build a pillar and cluster plan, and send finished briefs to the post writer.",
        icon: Network,
      },
      {
        href: "/audit-mcp",
        label: "Site audit",
        alias: "Audit MCP",
        hint: "Find SEO problems on a site",
        description: "Run an SEO audit with a skill and get a report of what to fix, in priority order.",
        icon: Plug,
      },
    ],
  },
  {
    id: "create",
    label: "Create",
    items: [
      {
        href: "/post-create",
        label: "Post writer",
        alias: "Post Create",
        hint: "Write blog posts with images",
        description: "Write a full blog post with images from a short prompt, edit it, then publish or schedule it on WordPress.",
        icon: PenLine,
      },
      {
        href: "/branding",
        label: "Brand profiles",
        alias: "Branding",
        hint: "Logo, colors and tone for the AI",
        description: "Save each client's logo, colors and voice so every post and image matches their brand.",
        icon: Building2,
      },
    ],
  },
  {
    id: "publish",
    label: "Publish",
    items: [
      {
        href: "/wordpress",
        label: "WordPress sites",
        hint: "Connected sites and their posts",
        description: "Connect client WordPress sites so posts can be published to them directly.",
        icon: Newspaper,
      },
      {
        href: "/additional-mcp",
        label: "Connected tools",
        alias: "Additional MCP",
        hint: "Extra tools the agent can use",
        description: "Add outside MCP servers (for example a site's own publishing tools) that the strategy chat can call.",
        icon: Server,
      },
    ],
  },
  {
    id: "measure",
    label: "Measure",
    items: [
      {
        href: "/google/search-console",
        label: "Search Console",
        hint: "Clicks and rankings from Google",
        description: "Clicks, impressions and positions from Google Search for each connected property.",
        icon: Globe2,
      },
      {
        href: "/google/analytics",
        label: "Analytics",
        hint: "Visitors and engagement",
        description: "Visitors, sessions and engagement from Google Analytics.",
        icon: BarChart3,
      },
      {
        href: "/google/sheets",
        label: "Sheets",
        hint: "Export data to Google Sheets",
        description: "Send reports and keyword lists to Google Sheets.",
        icon: FileSpreadsheet,
        beta: true,
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    items: [
      {
        href: "/task-management",
        label: "Tasks",
        hint: "Assign and track SEO work",
        description: "Plan SEO work as tasks, assign them to people and track them to done.",
        icon: ClipboardList,
      },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = {
  href: "/setting",
  label: "Settings",
  hint: "Account, integrations and AI",
  description: "Your account, Google connection, security, workspace and (for admins) the AI provider and costs.",
  icon: Settings,
};

/** The nav entry (and its group) that owns a path. */
export function findNavItem(pathname: string | null | undefined): { item: NavItem; group: NavGroup | null } | null {
  if (!pathname) return null;
  if (pathname.startsWith(SETTINGS_ITEM.href)) return { item: SETTINGS_ITEM, group: null };
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)) {
        return { item, group };
      }
    }
  }
  return null;
}
