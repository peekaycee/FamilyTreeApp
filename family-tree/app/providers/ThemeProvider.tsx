// "use client";

// import { useEffect } from "react";
// import { usePathname } from "next/navigation";
// import { useSettings } from "@/app/hooks/useSettings";

// export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  
//   const { state, isHydrated } = useSettings();

//   useEffect(() => {
//     if (!isHydrated) return;

//     const root = document.documentElement;

//     // Apply theme
//     root.setAttribute("data-theme", state.theme);

//     // Apply accent color
//     if (state.accentColor) {
//       root.style.setProperty("--color-accent", state.accentColor);
//     }

//   }, [state.theme, state.accentColor, isHydrated]);

//   return <>{children}</>;
// }

"use client";

import { useEffect } from "react";
import { useSettings } from "@/app/hooks/useSettings";
import { usePathname } from "next/navigation";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state, isHydrated } = useSettings();
  const pathname = usePathname();

  const isPublicPage = pathname === "/"; // extend if needed

  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;

    // 🚨 Force light theme on public homepage
    if (isPublicPage) {
      root.setAttribute("data-theme", "light");
      return;
    }

    // ✅ Normal tenant/system behavior
    root.setAttribute("data-theme", state.theme);

    if (state.accentColor) {
      root.style.setProperty("--color-accent", state.accentColor);
    }

  }, [state.theme, state.accentColor, isHydrated, isPublicPage]);

  return <>{children}</>;
}