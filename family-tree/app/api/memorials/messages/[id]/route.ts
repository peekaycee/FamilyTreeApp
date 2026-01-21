import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const supabase = getTenantClient(req);
    const { message } = await req.json();

    if (!id || !message) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("memorial_messages")
      .update({ message })
      .eq("id", id);

    if (error) {
      console.error("PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const supabase = getTenantClient(req);

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("memorial_messages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
