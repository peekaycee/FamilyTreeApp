import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getTenantClient(req);
  const { id } = await context.params;
  const body = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: story, error: fetchError } = await supabase
    .from("family_stories")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !story) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Assign user_id if null
  if (!story.user_id) {
    await supabase.from("family_stories").update({ user_id: user.id }).eq("id", id);
    story.user_id = user.id;
  }

  if (story.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Handle image update if provided
  let image_url = story.image_url;
  if (body.imageFileBase64) {
    const ext = "png"; // or dynamically detect
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(body.imageFileBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");

    const { error: uploadError } = await supabase.storage
      .from("family_stories")
      .upload(path, buffer, { contentType: "image/png", upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    // Delete old image if exists
    if (story.image_url) {
      const oldPath = new URL(story.image_url).pathname.replace(
        /^\/storage\/v1\/object\/public\/family_stories\//,
        ""
      );
      if (oldPath) await supabase.storage.from("family_stories").remove([oldPath]);
    }

    image_url = supabase.storage.from("family_stories").getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("family_stories")
    .update({ title: body.title, author: body.author, excerpt: body.excerpt, content: body.content, image_url })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message || "Failed to update story" }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = getTenantClient(req);
  const { id } = await context.params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: story, error: fetchError } = await supabase
    .from("family_stories")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !story) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!story.user_id) {
    await supabase.from("family_stories").update({ user_id: user.id }).eq("id", id);
    story.user_id = user.id;
  }

  if (story.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete image if exists
  if (story.image_url) {
    const path = new URL(story.image_url).pathname.replace(
      /^\/storage\/v1\/object\/public\/family_stories\//,
      ""
    );
    if (path) await supabase.storage.from("family_stories").remove([path]);
  }

  const { error } = await supabase.from("family_stories").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

