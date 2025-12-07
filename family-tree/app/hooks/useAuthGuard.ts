'use client';

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function useAuthGuard() {
  const pathname = usePathname();
  const router = useRouter();

  // Mark protected routes
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/basic");

  const hasSession = () => {
    const fromLocal = localStorage.getItem("ft_logged_in") === '1';
    const fromCookie = document.cookie.includes("familytree_session=");
    return fromLocal || fromCookie;
  };

  useEffect(() => {
    if (!isProtected) return; // public page → do nothing

    // Initial check on mount
    if (!hasSession()) {
      router.replace("/auth/login");
      return;
    }

    // Handle back-button / cached pages
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted && !hasSession()) {
        router.replace("/auth/login");
      }
    };

    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [pathname, isProtected, router]);
}
