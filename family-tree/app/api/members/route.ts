import { NextResponse } from "next/server";
import { getSubscriber } from "../../../lib/supabase/getSubscriber";
import { createSubscriberSupabaseClient } from "../../../lib/supabase/supabaseFactory";

/* ------------------------------------------------------------------ */
/* GET: fetch all members                                              */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const subscriber = await getSubscriber("default");

    const supabase = createSubscriberSupabaseClient(
      subscriber.supabase_url,
      subscriber.supabase_anon_key
    );

    const { data, error } = await supabase
      .from("family_members")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Server error";

    console.error("GET /members error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST: add or update member                                          */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const subscriber = await getSubscriber("default");

    const supabase = createSubscriberSupabaseClient(
      subscriber.supabase_url,
      subscriber.supabase_anon_key
    );

    const body = await req.json();
    const {
      id,
      name,
      role,
      father_id,
      mother_id,
      avatar_url,
      avatar_path,
    } = body;

    const { data, error } = await supabase
      .from("family_members")
      .upsert(
        [
          {
            id: id || undefined,
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
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Server error";

    console.error("POST /members error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
