import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

/* ================= GET: fetch all members ================= */
export async function GET(req: NextRequest) {
  try {
    const supabase = getTenantClient(req);

    // Get logged-in user ID
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", user.id) // tenant isolation
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err: any) {
    const message = err?.message ?? "Failed to fetch members";
    console.error("GET /members error:", message);
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

/* ================= POST: add or update member ================= */
export async function POST(req: NextRequest) {
  try {
    const supabase = getTenantClient(req);

    // Get logged-in user ID
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { id, name, role, father_id, mother_id, avatar_url, avatar_path } = body;

    const { data, error } = await supabase
      .from("family_members")
      .upsert(
        [
          {
            id: id || undefined,
            user_id: user.id, // ensure tenant association
            name,
            role,
            father_id: father_id || null,
            mother_id: mother_id || null,
            avatar_url: avatar_url || null,
            avatar_path: avatar_path || null,
          },
        ],
        { onConflict: "id" }
      )
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    const message = err?.message ?? "Failed to save member";
    console.error("POST /members error:", message);
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
