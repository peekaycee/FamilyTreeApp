import { NextRequest, NextResponse } from "next/server";
import { getSubscriber } from "../../../../lib/supabase/getSubscriber";
import { createSubscriberSupabaseClient } from "../../../../lib/supabase/supabaseFactory";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing ID" },
        { status: 400 }
      );
    }

    const subscriber = await getSubscriber("default");

    const supabase = createSubscriberSupabaseClient(
      subscriber.supabase_url,
      subscriber.supabase_anon_key
    );

    // Fetch member to get avatar path
    const { data: member, error: fetchError } = await supabase
      .from("family_members")
      .select("avatar_path")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Delete member
    const { error: deleteError } = await supabase
      .from("family_members")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Delete avatar from storage if exists
    if (member?.avatar_path) {
      await supabase
        .storage
        .from("avatars")
        .remove([member.avatar_path]);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Server error";

    console.error("DELETE /api/members/[id] error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
