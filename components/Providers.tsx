"use client";

import { Provider, useSelector } from "react-redux";
import { store, RootState } from "@/lib/store";
import React, { useEffect } from "react";

function ThemeSync({ children }: { children: React.ReactNode }) {
  const theme = useSelector((state: RootState) => state.audit.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
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
