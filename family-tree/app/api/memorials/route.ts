import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

// Helper to get authenticated user
async function getUserId(supabase: ReturnType<typeof getTenantClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}

/* ================= GET /api/memorials ================= */
export async function GET(req: NextRequest) {
  try {
    const supabase = getTenantClient(req);

    // Select memorials with candle counts
    const { data, error } = await supabase
      .from("memorials")
      .select(`
        *,
        memorial_candles(count)
      `);

    if (error) throw error;

    // Format response so each memorial has candle_count
    const formatted = data.map((m: any) => ({
      id: m.id,
      name: m.name,
      born: m.born,
      died: m.died,
      tribute: m.tribute,
      bio: m.bio,
      picture: m.picture,
      candle_count: m.memorial_candles?.count ?? 0,
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error("Fetch memorials error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch memorials" }, { status: 500 });
  }
}
/* ================= POST /api/memorials ================= */
export async function POST(req: NextRequest) {
  try {
    const supabase = getTenantClient(req);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memorial = await req.json();

    // Attach user_id for RLS
    memorial.user_id = user.id;

    const { data, error } = await supabase
      .from("memorials")
      .insert(memorial)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create memorial" },
      { status: err.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
