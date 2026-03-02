import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing memorial ID" }, { status: 400 });
  }

  const supabase = getTenantClient(req);

  const { data, error } = await supabase.rpc(
    "increment_memorial_candle",
    { memorial_id_input: id }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data });
}
