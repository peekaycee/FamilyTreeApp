

// lib/supabase/getTenantClient.ts

import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export function getTenantClient(req?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!publicKey) {
    throw new Error("Missing Supabase public/anon key.");
  }

  // This helper is for API routes only.
  // Server components must use createSupabaseServerClient().
  if (!req) {
    throw new Error(
      "getTenantClient requires a NextRequest. Use createSupabaseServerClient() in server components."
    );
  }

  const accessToken = req.cookies.get("sb-access-token")?.value;

  return createClient(supabaseUrl, publicKey, {
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },

    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
