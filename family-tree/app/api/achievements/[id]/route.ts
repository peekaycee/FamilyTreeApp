import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getTenantClient(req);

    // Await params if it's a Promise
    const { id: achievementId } = await params;
    if (!achievementId) return NextResponse.json({ error: "Missing achievement ID" }, { status: 400 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { old_image_path, image_path, ...rest } = body;

    // Delete old image if changed
    if (old_image_path && old_image_path !== image_path) {
      const oldFilePath = old_image_path.split("/storage/v1/object/public/achievements/")[1];
      if (oldFilePath) await supabase.storage.from("achievements").remove([oldFilePath]);
    }

    // Update achievement
    const { data, error } = await supabase
      .from("achievements")
      .update({ ...rest, image_path })
      .eq("id", achievementId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getTenantClient(req);

    const { id: achievementId } = await params;
    if (!achievementId) return NextResponse.json({ error: "Missing achievement ID" }, { status: 400 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch achievement to delete image
    const { data: achievement, error: fetchError } = await supabase
      .from("achievements")
      .select("image_path")
      .eq("id", achievementId)
      .single();
    if (fetchError) throw fetchError;

    if (achievement?.image_path) {
      const filePath = achievement.image_path.split("/storage/v1/object/public/achievements/")[1];
      if (filePath) await supabase.storage.from("achievements").remove([filePath]);
    }

    // Delete achievement
    const { error: deleteError } = await supabase
      .from("achievements")
      .delete()
      .eq("id", achievementId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
