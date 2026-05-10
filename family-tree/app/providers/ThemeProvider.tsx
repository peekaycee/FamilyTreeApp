"use client";

import { useEffect } from "react";
import { useSettings } from "@/app/hooks/useSettings";
import { usePathname } from "next/navigation";
import useGlobalAuth from "@/app/hooks/useGlobalAuth";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, isHydrated } = useSettings();

  const pathname = usePathname();

  // ✅ REAL AUTH STATE
  const loggedIn = useGlobalAuth();

  // ✅ Public pages
  const publicRoutes = [
    "/",
    "/about",
    "/auth/login",
    "/contact",
    "/auth/fam3_reg-permit/register",
    "/familyHeritagePlan",
    "/familyLegacyPlan",
    "/familyPremiumPlan",
  ];

  const isPublicPage = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;

    /**
     * PUBLIC VISITOR
     * Force public branding/light theme
     */
    if (isPublicPage && !loggedIn) {
      root.setAttribute("data-theme", "light");

      // force public accent
      root.style.setProperty("--color-accent", "#e8c535");

      return;
    }

    /**
     * LOGGED-IN USERS
     * Follow saved dashboard/app theme
     */
    root.setAttribute("data-theme", state.theme);

    // use user's selected accent
    if (state.accentColor) {
      root.style.setProperty("--color-accent", state.accentColor);
    }
  }, [
    pathname,
    loggedIn,
    isPublicPage,
    isHydrated,
    state.theme,
    state.accentColor,
  ]);

  return <>{children}</>;
}