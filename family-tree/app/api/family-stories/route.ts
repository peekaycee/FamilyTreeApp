import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

export async function GET(req: NextRequest) {
  const supabase = getTenantClient(req);

  const { data, error } = await supabase
    .from("family_stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getTenantClient(req);
  const body = await req.json();

  const { title, author, excerpt, content, imageFileBase64 } = body;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let image_url: string | null = null;

  // Upload image if base64 provided
  if (imageFileBase64) {
    const ext = imageFileBase64.match(/^data:image\/(\w+);base64,/)?.[1] || "png";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(
      imageFileBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const { error: uploadError } = await supabase.storage
      .from("family_stories")
      .upload(path, buffer, { contentType: `image/${ext}` });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    image_url = supabase.storage.from("family_stories").getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("family_stories")
    .insert({
      title,
      author,
      excerpt,
      content,
      image_url,
      user_id: user.id,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

