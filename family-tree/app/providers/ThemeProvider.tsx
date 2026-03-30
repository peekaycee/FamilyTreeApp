// "use client";

// import { useEffect, useState } from "react";
// import { useSettings } from "@/app/hooks/useSettings";

// type ThemeMode = "light" | "dark" | "system";

// export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  
//   const { state } = useSettings();

//   const [initialProfile, setInitialProfile] = useState<{
//     familyName: string;
//     avatar: string | null;
//   }>({
//     familyName: "",
//     avatar: null,
//   });
  
//   const [initialSettings, setInitialSettings] = useState<{
//     theme: ThemeMode;
//     accentColor: string;
//   }>({
//     theme: "system",
//     accentColor: "#3b82f6",
//   });
  
//   useEffect(() => {
//     if (!state.familyName) return; // prevents empty overwrite
    
//     setInitialProfile({
//       familyName: state.familyName,
//       avatar: state.currentAvatar,
//     });
    
//     setInitialSettings({
//       theme: state.theme,
//       accentColor: state.accentColor,
//     });
//   }, [state.accentColor, state.currentAvatar, state.familyName, state.theme]);


//   useEffect(() => {
//     const root = document.documentElement;

//     root.style.setProperty("--accent-color", state.accentColor);

//     if (state.theme === "dark") {
//       root.classList.add("dark");
//     } else if (state.theme === "light") {
//       root.classList.remove("dark");
//     } else {
//       const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
//       root.classList.toggle("dark", prefersDark);
//     }
//   }, [state.theme, state.accentColor]);

//   return <>{children}</>;
// }

"use client";

import { useEffect } from "react";
import { useSettings } from "@/app/hooks/useSettings";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  
  const { state, isHydrated } = useSettings();

  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;

    // Apply theme
    root.setAttribute("data-theme", state.theme);

    // Apply accent color
    if (state.accentColor) {
      root.style.setProperty("--color-accent", state.accentColor);
    }

  }, [state.theme, state.accentColor, isHydrated]);

  return <>{children}</>;
}