import { authApi } from "@/lib/auth-api";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function getToken(): string | null {
  return authApi.getToken();
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

export interface TaskComment {
  id: string;
  taskId: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface SeoTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  workType: string;
  websiteUrl: string;
  dueDate: string;
  progress: number;
  tags: string[];
  comments: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignee?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  workType?: string;
  websiteUrl?: string;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignee?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  workType?: string;
  websiteUrl?: string;
  dueDate?: string;
  progress?: number;
  tags?: string[];
}

export const taskApi = {
  async getTasks(): Promise<SeoTask[]> {
    const res = await fetch(`${BACKEND_URL}/api/tasks`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch tasks");
    }
    const data = (await res.json()) as { tasks: SeoTask[] };
    return data.tasks;
  },

  async getTask(taskId: string): Promise<SeoTask> {
    const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to fetch task");
    }
    const data = (await res.json()) as { task: SeoTask };
    return data.task;
  },

  async createTask(input: CreateTaskInput): Promise<SeoTask> {
    const res = await fetch(`${BACKEND_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to create task");
    }
    const data = (await res.json()) as { task: SeoTask };
    return data.task;
  },

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<SeoTask> {
    const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to update task");
    }
    const data = (await res.json()) as { task: SeoTask };
    return data.task;
  },

  async deleteTask(taskId: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to delete task");
    }
  },

  async addComment(taskId: string, author: string, message: string): Promise<TaskComment> {
    const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ author, message }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? "Failed to add comment");
    }
    const data = (await res.json()) as { comment: TaskComment };
    return data.comment;
  },
};
