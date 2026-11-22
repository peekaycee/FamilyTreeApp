// app/api/memorials/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser(req: NextRequest) {
  const supabase = getTenantClient(req);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
    };
  }

  return {
    supabase,
    user,
  };
}

// GET MEMORIALS
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("memorials")
      .select(`
        *,
        memorial_candles(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("[MEMORIALS TENANT CHECK]", {
  authenticatedUserId: user.id,
  memorialsReturned: (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    user_id: m.user_id,
  })),
});

    const formatted = (data ?? []).map((memorial: any) => {
      const candleRelation = Array.isArray(memorial.memorial_candles)
        ? memorial.memorial_candles[0]
        : memorial.memorial_candles;

      return {
        id: memorial.id,
        name: memorial.name,
        born: memorial.born,
        died: memorial.died,
        tribute: memorial.tribute,
        bio: memorial.bio,
        picture: memorial.picture,
        candle_count: candleRelation?.count ?? 0,
      };
    });

    return NextResponse.json(formatted, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err: any) {
    console.error("Fetch memorials error:", err);

    return NextResponse.json(
      { error: "Failed to fetch memorials." },
      { status: 500 }
    );
  }
}

// CREATE MEMORIAL
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      name,
      born,
      died,
      tribute,
      bio,
      picture,
    } = body;

    if (
      !name ||
      born === undefined ||
      died === undefined ||
      !tribute ||
      !bio
    ) {
      return NextResponse.json(
        { error: "Please provide all required memorial details." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("memorials")
      .insert({
        name,
        born: Number(born),
        died: Number(died),
        tribute,
        bio,
        picture: picture ?? null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Create memorial error:", err);

    return NextResponse.json(
      { error: err.message || "Failed to create memorial." },
      { status: 500 }
    );
  }
}
