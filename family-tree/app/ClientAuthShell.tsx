"use client";

import useAuthGuard from "./hooks/useAuthGuard";

export default function ClientAuthShell({ children }: { children: React.ReactNode }) {
  useAuthGuard(); // now safe — runs ONLY on client
  return <>{children}</>;
}
