"use client";

import { useEffect, useState } from "react";

/**
 * A universal reactive auth state hook:
 * - Detects login across cookies + localStorage
 * - Updates instantly when login/logout occurs
 * - Broadcasts changes globally via 'authChange'
 */

export default function useGlobalAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  const computeAuth = () => {
    try {
      const flag = localStorage.getItem("ft_logged_in");
      if (flag === "1") return true;
    } catch {}

    const cookies =
      typeof document !== "undefined"
        ? document.cookie.split(";").map((c) => c.trim())
        : [];

    return cookies.some((c) => c.startsWith("familytree_session="));
  };

  const updateAuth = () => {
    const status = computeAuth();
    setLoggedIn(status);
    return status;
  };

  useEffect(() => {
    updateAuth();

    const onAuthChange = () => {
      setTimeout(updateAuth, 50);
    };

    const onStorage = (e: StorageEvent) => {
      if (
        ["ft_logged_in", "ft_last_changed"].includes(e.key ?? "") ||
        (e.key === null && e.newValue === null)
      ) {
        setTimeout(updateAuth, 30);
      }
    };

    window.addEventListener("authChange", onAuthChange);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("authChange", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return loggedIn;
}
