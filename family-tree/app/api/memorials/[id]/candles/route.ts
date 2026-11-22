// import { NextRequest, NextResponse } from "next/server";
// import { getTenantClient } from "@/lib/supabase/getTenantClient";

// export async function POST(
//   req: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   const { id } = await context.params;
//   if (!id) {
//     return NextResponse.json({ error: "Missing memorial ID" }, { status: 400 });
//   }

//   const supabase = getTenantClient(req);

//   const { data, error } = await supabase.rpc(
//     "increment_memorial_candle",
//     { memorial_id_input: id }
//   );

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }

//   return NextResponse.json({ count: data });
// }



// app/api/memorials/[id]/candles/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing memorial ID." },
        { status: 400 }
      );
    }

    const supabase = getTenantClient(req);

    // 1. Authenticate the user.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Confirm ownership of the memorial.
    const { data: memorial, error: memorialError } = await supabase
      .from("memorials")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memorialError) throw memorialError;

    if (!memorial) {
      return NextResponse.json(
        { error: "Memorial not found or access denied." },
        { status: 404 }
      );
    }

    // 3. Increment the candle using the authenticated client.
    const { data, error } = await supabase.rpc(
      "increment_memorial_candle",
      {
        memorial_id_input: id,
      }
    );

    if (error) throw error;

    return NextResponse.json({
      count: data,
    });
  } catch (err: any) {
    console.error("Candle update error:", err);

    return NextResponse.json(
      { error: "Unable to light candle." },
      { status: 500 }
    );
  }
}
