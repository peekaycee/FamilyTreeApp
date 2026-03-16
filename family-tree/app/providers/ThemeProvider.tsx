"use client";

import { useEffect } from "react";
import { useSettings } from "@/app/hooks/useSettings";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useSettings();

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--accent-color", state.accentColor);

    if (state.theme === "dark") {
      root.classList.add("dark");
    } else if (state.theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, [state.theme, state.accentColor]);

  return <>{children}</>;
}