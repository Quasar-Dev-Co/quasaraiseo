"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  defaultWorkspacePreferences,
  workspaceApi,
  type WorkspacePreferences,
} from "@/lib/workspace-api";

interface WorkspaceContextValue {
  preferences: WorkspacePreferences;
  updatePreferences: (patch: Partial<WorkspacePreferences>) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [preferences, setPreferences] = useState<WorkspacePreferences>(defaultWorkspacePreferences);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setPreferences(defaultWorkspacePreferences);
      return;
    }

    let cancelled = false;
    workspaceApi
      .get()
      .then((next) => {
        if (!cancelled) setPreferences(next);
      })
      .catch(() => {
        if (!cancelled) setPreferences(defaultWorkspacePreferences);
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const updatePreferences = useCallback(async (patch: Partial<WorkspacePreferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
    try {
      const saved = await workspaceApi.update(patch);
      setPreferences(saved);
    } catch (error) {
      const fresh = await workspaceApi.get().catch(() => null);
      if (fresh) setPreferences(fresh);
      throw error;
    }
  }, []);

  return (
    <WorkspaceContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
