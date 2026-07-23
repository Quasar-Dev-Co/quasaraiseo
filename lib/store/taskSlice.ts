import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type WorkType =
  | "Technical SEO"
  | "Content Optimization"
  | "Link Building"
  | "Keyword Research"
  | "Site Audit"
  | "On-page SEO"
  | "Schema Markup"
  | "Core Web Vitals";

export interface SeoTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeAvatar: string;
  priority: TaskPriority;
  status: TaskStatus;
  workType: WorkType;
  websiteUrl: string;
  dueDate: string;
  createdAt: string;
  progress: number;
  tags: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  activeTasks: number;
  completedTasks: number;
  efficiency: number;
  online: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  author: string;
  avatar: string;
  message: string;
  timestamp: string;
}

interface TaskState {
  tasks: SeoTask[];
  teamMembers: TeamMember[];
  comments: TaskComment[];
  selectedTaskId: string | null;
  filterStatus: TaskStatus | "all";
  filterPriority: TaskPriority | "all";
  filterAssignee: string | "all";
}

const initialState: TaskState = {
  tasks: [
    {
      id: "tsk-001",
      title: "Fix robots.txt blocking on service pages",
      description: "Update robots.txt rules to allow indexing of /services/* paths. Validate canonical tags and resubmit to Google.",
      assignee: "Arjun Patel",
      assigneeAvatar: "AP",
      priority: "urgent",
      status: "in_progress",
      workType: "Technical SEO",
      websiteUrl: "https://client-a.com",
      dueDate: "2026-07-25",
      createdAt: "2026-07-20",
      progress: 65,
      tags: ["indexation", "robots.txt", "critical"],
    },
    {
      id: "tsk-002",
      title: "Optimize Core Web Vitals for mobile templates",
      description: "LCP exceeds 2.5s on mobile. Optimize hero images, defer non-critical JS, and implement lazy loading.",
      assignee: "Sarah Chen",
      assigneeAvatar: "SC",
      priority: "high",
      status: "in_progress",
      workType: "Core Web Vitals",
      websiteUrl: "https://client-b.com",
      dueDate: "2026-07-28",
      createdAt: "2026-07-18",
      progress: 40,
      tags: ["cwv", "mobile", "performance"],
    },
    {
      id: "tsk-003",
      title: "Create landing pages for 3 high-intent keywords",
      description: "Build dedicated pages for 'ai seo audit tool', 'seo report generator', and 'ai visibility report'.",
      assignee: "Marcus Johnson",
      assigneeAvatar: "MJ",
      priority: "high",
      status: "todo",
      workType: "Content Optimization",
      websiteUrl: "https://client-a.com",
      dueDate: "2026-08-02",
      createdAt: "2026-07-21",
      progress: 0,
      tags: ["landing-pages", "content", "keywords"],
    },
    {
      id: "tsk-004",
      title: "Add Organization schema markup",
      description: "Expand schema.org Organization entity with social profiles, contact info, and logo.",
      assignee: "Priya Sharma",
      assigneeAvatar: "PS",
      priority: "medium",
      status: "review",
      workType: "Schema Markup",
      websiteUrl: "https://client-c.com",
      dueDate: "2026-07-24",
      createdAt: "2026-07-19",
      progress: 85,
      tags: ["schema", "structured-data"],
    },
    {
      id: "tsk-005",
      title: "Keyword gap analysis — competitor set",
      description: "Identify 20+ keyword opportunities where competitors rank but client does not. Prioritize by search volume and intent.",
      assignee: "Sarah Chen",
      assigneeAvatar: "SC",
      priority: "medium",
      status: "done",
      workType: "Keyword Research",
      websiteUrl: "https://client-b.com",
      dueDate: "2026-07-22",
      createdAt: "2026-07-15",
      progress: 100,
      tags: ["keywords", "gap-analysis", "competitors"],
    },
    {
      id: "tsk-006",
      title: "Fix 5xx server errors on product pages",
      description: "Investigate server logs, identify failing endpoints on /products/*, and coordinate with backend team.",
      assignee: "Arjun Patel",
      assigneeAvatar: "AP",
      priority: "urgent",
      status: "todo",
      workType: "Technical SEO",
      websiteUrl: "https://client-a.com",
      dueDate: "2026-07-26",
      createdAt: "2026-07-22",
      progress: 0,
      tags: ["server-errors", "5xx", "critical"],
    },
    {
      id: "tsk-007",
      title: "Internal linking audit and optimization",
      description: "Map internal anchor text distribution. Replace generic 'learn more' with descriptive anchors on 18+ links.",
      assignee: "Marcus Johnson",
      assigneeAvatar: "MJ",
      priority: "low",
      status: "todo",
      workType: "On-page SEO",
      websiteUrl: "https://client-c.com",
      dueDate: "2026-08-05",
      createdAt: "2026-07-21",
      progress: 0,
      tags: ["internal-links", "anchor-text"],
    },
    {
      id: "tsk-008",
      title: "Build niche-relevant backlink portfolio",
      description: "Acquire 10 referring domains from niche-relevant sites via digital PR and partner content.",
      assignee: "Priya Sharma",
      assigneeAvatar: "PS",
      priority: "medium",
      status: "in_progress",
      workType: "Link Building",
      websiteUrl: "https://client-b.com",
      dueDate: "2026-08-10",
      createdAt: "2026-07-17",
      progress: 30,
      tags: ["backlinks", "outreach", "authority"],
    },
  ],
  teamMembers: [
    {
      id: "mem-001",
      name: "Arjun Patel",
      role: "Senior SEO Engineer",
      avatar: "AP",
      activeTasks: 2,
      completedTasks: 47,
      efficiency: 92,
      online: true,
    },
    {
      id: "mem-002",
      name: "Sarah Chen",
      role: "Technical SEO Specialist",
      avatar: "SC",
      activeTasks: 2,
      completedTasks: 38,
      efficiency: 88,
      online: true,
    },
    {
      id: "mem-003",
      name: "Marcus Johnson",
      role: "Content SEO Strategist",
      avatar: "MJ",
      activeTasks: 2,
      completedTasks: 31,
      efficiency: 85,
      online: false,
    },
    {
      id: "mem-004",
      name: "Priya Sharma",
      role: "SEO Analyst",
      avatar: "PS",
      activeTasks: 2,
      completedTasks: 25,
      efficiency: 90,
      online: true,
    },
  ],
  comments: [
    {
      id: "cmt-001",
      taskId: "tsk-001",
      author: "Arjun Patel",
      avatar: "AP",
      message: "Found the issue — Disallow: /services/ was added in the last deploy. Fixing now.",
      timestamp: "2026-07-22 10:30",
    },
    {
      id: "cmt-002",
      taskId: "tsk-001",
      author: "Sarah Chen",
      avatar: "SC",
      message: "Make sure to also check the canonical tags on those pages. Some point to the old domain.",
      timestamp: "2026-07-22 11:15",
    },
    {
      id: "cmt-003",
      taskId: "tsk-002",
      author: "Marcus Johnson",
      avatar: "MJ",
      message: "Hero image is 3.2MB. Converting to WebP and adding width attributes should bring LCP under 2s.",
      timestamp: "2026-07-21 14:45",
    },
  ],
  selectedTaskId: null,
  filterStatus: "all",
  filterPriority: "all",
  filterAssignee: "all",
};

const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setFilterStatus: (state, action: PayloadAction<TaskStatus | "all">) => {
      state.filterStatus = action.payload;
    },
    setFilterPriority: (state, action: PayloadAction<TaskPriority | "all">) => {
      state.filterPriority = action.payload;
    },
    setFilterAssignee: (state, action: PayloadAction<string | "all">) => {
      state.filterAssignee = action.payload;
    },
    selectTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
    updateTaskStatus: (state, action: PayloadAction<{ id: string; status: TaskStatus }>) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        task.status = action.payload.status;
        task.progress = action.payload.status === "done" ? 100 : task.progress;
      }
    },
    updateTaskProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) task.progress = action.payload.progress;
    },
    addTask: (state, action: PayloadAction<Omit<SeoTask, "id" | "createdAt" | "progress">>) => {
      state.tasks.unshift({
        ...action.payload,
        id: `tsk-${String(state.tasks.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString().split("T")[0],
        progress: 0,
      });
    },
    addComment: (state, action: PayloadAction<{ taskId: string; author: string; avatar: string; message: string }>) => {
      state.comments.push({
        id: `cmt-${String(state.comments.length + 1).padStart(3, "0")}`,
        taskId: action.payload.taskId,
        author: action.payload.author,
        avatar: action.payload.avatar,
        message: action.payload.message,
        timestamp: new Date().toISOString().split("T").join(" ").slice(0, 16),
      });
    },
  },
});

export const {
  setFilterStatus,
  setFilterPriority,
  setFilterAssignee,
  selectTask,
  updateTaskStatus,
  updateTaskProgress,
  addTask,
  addComment,
} = taskSlice.actions;

export default taskSlice.reducer;
