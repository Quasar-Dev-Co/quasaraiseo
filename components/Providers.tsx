"use client";

import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState } from "@/lib/store";
import { setTheme } from "@/lib/store/auditSlice";
import React, { useEffect, useRef } from "react";

const THEME_KEY = "quasar_theme";

function ThemeSync({ children }: { children: React.ReactNode }) {
  const theme = useSelector((state: RootState) => state.audit.theme);
  const dispatch = useDispatch();
  const restored = useRef(false);

  // Restore the last theme the user picked (storage may be unavailable).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") dispatch(setTheme(saved));
    } catch { /* ignore */ }
    restored.current = true;
  }, [dispatch]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (restored.current) {
      try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
    }
  }, [theme]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeSync>{children}</ThemeSync>
    </Provider>
  );
}
