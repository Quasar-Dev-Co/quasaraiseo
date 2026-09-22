"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { profileAvatarApi } from "@/lib/profile-avatar-api";

interface ProfileAvatarContextValue {
  url: string | null;
  refresh: () => Promise<void>;
  setUrl: (url: string | null) => void;
}

const ProfileAvatarContext = createContext<ProfileAvatarContextValue | null>(null);

export function ProfileAvatarProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [url, setUrl] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setUrl(null);
      return;
    }
    try {
      const result = await profileAvatarApi.get();
      setUrl(result.url);
    } catch {
      setUrl(null);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    void refresh();
  }, [loading, refresh]);

  return (
    <ProfileAvatarContext.Provider value={{ url, refresh, setUrl }}>
      {children}
    </ProfileAvatarContext.Provider>
  );
}

export function useProfileAvatar() {
  const context = useContext(ProfileAvatarContext);
  if (!context) throw new Error("useProfileAvatar must be used within a ProfileAvatarProvider");
  return context;
}
