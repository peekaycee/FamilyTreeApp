// api/achievements/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";
import { SupabaseClient } from "@supabase/supabase-js";

// Helper to get logged-in user ID from sb-access-token cookie
async function getUserId(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("User not authenticated");
  return data.user.id;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getTenantClient(req);
    const user_id = await getUserId(supabase);

    const { achievements } = await req.json();
    if (!achievements || !Array.isArray(achievements) || achievements.length === 0)
      throw new Error("No achievements provided");

    // Attach user_id to each achievement
    const achievementsWithUser = achievements.map((a: any) => ({ ...a, user_id }));

    const { data, error } = await supabase
      .from("achievements")
      .insert(achievementsWithUser)
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to import achievements" },
      { status: err.message === "User not authenticated" ? 401 : 500 }
    );
  }
}
