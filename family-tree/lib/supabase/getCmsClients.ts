import { createClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function getPublicKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error("Missing Supabase public/anon key.");
  }

  return key;
}

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getCmsClients(req: NextRequest): Promise<{
  user: User | null;
  admin: ReturnType<typeof getAdminClient>;
  error: string | null;
  status: number;
}> {
  const accessToken = req.cookies.get("sb-access-token")?.value;

  const admin = getAdminClient();

  if (req.method !== "GET" && req.method !== "HEAD") {
  const origin = req.headers.get("origin");
  const requestOrigin = new URL(req.url).origin;

  if (!origin || origin !== requestOrigin) {
    return {
      user: null,
      admin,
      error: "Invalid request origin.",
      status: 403,
    };
  }
}

  if (!accessToken) {
    return {
      user: null,
      admin,
      error: "Unauthorized",
      status: 401,
    };
  }

  const userClient = createClient(supabaseUrl, getPublicKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await userClient.auth.getUser(accessToken);

  if (error || !data.user) {
    return {
      user: null,
      admin,
      error: "Your session is invalid or has expired. Please sign in again.",
      status: 401,
    };
  }

  if (data.user.app_metadata?.role !== "super_admin") {
    return {
      user: data.user,
      admin,
      error: "You do not have permission to manage family websites.",
      status: 403,
    };
  }

  return {
    user: data.user,
    admin,
    error: null,
    status: 200,
  };
}
