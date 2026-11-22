// // app/api/memorials/[id]/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getTenantClient } from "@/lib/supabase/getTenantClient";

// export const dynamic = "force-dynamic";

// // DELETE memorial
// export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
//   const { id } = await context.params;
//   if (!id) return NextResponse.json({ error: "Missing memorial ID" }, { status: 400 });

//   const { error } = await getTenantClient(req).from("memorials").delete().eq("id", id);
//   if (error) return NextResponse.json({ error: error.message }, { status: 400 });

//   return NextResponse.json({ message: "Deleted successfully" });
// }

// // PATCH memorial
// export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
//   const { id } = await context.params;
//   if (!id) return NextResponse.json({ error: "Missing memorial ID" }, { status: 400 });

//   const body = await req.json();
//   const { name, born, died, tribute, bio, picture } = body;

//   const updates: any = { name, born, died, tribute, bio };
//   if (picture) updates.picture = picture;

//   const { data, error } = await getTenantClient(req)
//     .from("memorials")
//     .update(updates)
//     .eq("id", id)
//     .select()
//     .single();

//   if (error) return NextResponse.json({ error: error.message }, { status: 400 });

//   return NextResponse.json(data);
// }

// // GET memorial
// export async function GET(
//   req: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   const { id } = await context.params;

//   const supabase = getTenantClient(req);

//   const { data, error } = await supabase
//     .from("memorials")
//     .select(`
//       *,
//       memorial_messages (
//         id,
//         message,
//         created_at,
//         author,
//         user_id
//       ),
//       memorial_candles (count)
//     `)
//     .eq("id", id)
//     .single();

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }

//   return NextResponse.json({
//     ...data,
//     candle_count: data.memorial_candles?.[0]?.count ?? 0,
//   });
// }



// app/api/memorials/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

async function authenticate(req: NextRequest) {
  const supabase = getTenantClient(req);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

// GET SINGLE MEMORIAL
export async function GET(
  req: NextRequest,
  context: Context
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing memorial ID." },
        { status: 400 }
      );
    }

    const { supabase, user } = await authenticate(req);

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
      .eq("user_id", user.id)
      .order("created_at", {
        foreignTable: "memorial_messages",
        ascending: true,
      })
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    const candleRelation = Array.isArray(data.memorial_candles)
      ? data.memorial_candles[0]
      : data.memorial_candles;

    return NextResponse.json(
      {
        ...data,
        candle_count: candleRelation?.count ?? 0,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (err: any) {
    console.error("Get memorial error:", err);

    return NextResponse.json(
      { error: "Unable to retrieve memorial." },
      { status: 500 }
    );
  }
}

// UPDATE MEMORIAL
export async function PATCH(
  req: NextRequest,
  context: Context
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing memorial ID." },
        { status: 400 }
      );
    }

    const { supabase, user } = await authenticate(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const updates: Record<string, any> = {};

    const allowedFields = [
      "name",
      "born",
      "died",
      "tribute",
      "bio",
      "picture",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid update fields provided." },
        { status: 400 }
      );
    }

    if (updates.born !== undefined) {
      updates.born = Number(updates.born);
    }

    if (updates.died !== undefined) {
      updates.died = Number(updates.died);
    }

    const { data, error } = await supabase
      .from("memorials")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Memorial not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Update memorial error:", err);

    return NextResponse.json(
      { error: "Unable to update memorial." },
      { status: 500 }
    );
  }
}

// DELETE MEMORIAL
export async function DELETE(
  req: NextRequest,
  context: Context
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing memorial ID." },
        { status: 400 }
      );
    }

    const { supabase, user } = await authenticate(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("memorials")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Memorial not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Memorial deleted successfully.",
    });
  } catch (err: any) {
    console.error("Delete memorial error:", err);

    return NextResponse.json(
      { error: "Unable to delete memorial." },
      { status: 500 }
    );
  }
}
