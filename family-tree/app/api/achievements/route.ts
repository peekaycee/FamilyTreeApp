import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

// Helper to get logged-in user ID
async function getUserId(supabase: ReturnType<typeof getTenantClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return user.id;
}

// ================= GET /api/achievements =================
export async function GET(req: NextRequest) {
  try {
    const supabase = getTenantClient(req);
    const user_id = await getUserId(supabase);

    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", user_id)
      .order("year", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch achievements" },
      { status: err.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

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

    const achievement = await req.json();

    // Include user_id for RLS
    achievement.user_id = user.id;

    const { data, error } = await supabase
      .from("achievements")
      .insert(achievement)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save achievement" },
      { status: err.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
