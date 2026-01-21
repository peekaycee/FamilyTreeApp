// app/api/memorials/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

export const dynamic = "force-dynamic";

// DELETE memorial
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing memorial ID" }, { status: 400 });

  const { error } = await getTenantClient(req).from("memorials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ message: "Deleted successfully" });
}

// PATCH memorial
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing memorial ID" }, { status: 400 });

  const body = await req.json();
  const { name, born, died, tribute, bio, picture } = body;

  const updates: any = { name, born, died, tribute, bio };
  if (picture) updates.picture = picture;

  const { data, error } = await getTenantClient(req)
    .from("memorials")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data);
}

// GET memorial
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = getTenantClient(req);

  const { data, error } = await supabase
    .from("memorials")
    .select(`
      *,
      memorial_messages (
        id,
        message,
        created_at,
        author,
        user_id
      ),
      memorial_candles (count)
    `)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    candle_count: data.memorial_candles?.[0]?.count ?? 0,
  });
}
