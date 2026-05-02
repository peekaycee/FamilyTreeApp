"use client";

import { useEffect } from "react";
import { useSettings } from "@/app/hooks/useSettings";
import { usePathname } from "next/navigation";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state, isHydrated } = useSettings();
  const pathname = usePathname();

  // ✅ Define all public pages here
  const publicRoutes = ["/", "/about", "/auth/login", "/contact"];

  const isPublicPage = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;

    // 🚨 Force light theme for ALL public pages
    if (isPublicPage) {
      root.setAttribute("data-theme", "light");

      // optional: ensure accent is reset or neutral on public pages
      if (state.accentColor) {
        root.style.setProperty("--color-accent", state.accentColor);
      }

      return;
    }

    // ✅ Tenant/system theme logic
    root.setAttribute("data-theme", state.theme);

    if (state.accentColor) {
      root.style.setProperty("--color-accent", state.accentColor);
    }

  }, [state.theme, state.accentColor, isHydrated, isPublicPage]);

  return <>{children}</>;
}