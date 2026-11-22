// import { NextRequest, NextResponse } from "next/server";
// import { getTenantClient } from "@/lib/supabase/getTenantClient";

// export async function POST(req: NextRequest) {
//   try {
//     const supabase = getTenantClient(req);

//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (authError || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const formData = await req.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     const fileName = `${Date.now()}_${file.name}`;

//     const { error: uploadError } = await supabase.storage
//       .from("memorial-images")
//       .upload(fileName, file);

//     if (uploadError) {
//       return NextResponse.json({ error: uploadError.message }, { status: 500 });
//     }

//     const { data } = supabase.storage
//       .from("memorial-images")
//       .getPublicUrl(fileName);

//     return NextResponse.json({ url: data.publicUrl });
//   } catch (err: any) {
//     return NextResponse.json(
//       { error: err.message || "Upload failed" },
//       { status: 500 }
//     );
//   }
// }



// app/api/memorials/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/supabase/getTenantClient";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = getTenantClient(req);

    // 1. Authenticate user.
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

    // 2. Read uploaded file.
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No valid file uploaded." },
        { status: 400 }
      );
    }

    const allowedTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

    const extension = allowedTypes[file.type];

    if (!extension) {
      return NextResponse.json(
        { error: "Unsupported image format." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must not exceed 5MB." },
        { status: 400 }
      );
    }

    // 3. Every user's files occupy their own folder.
    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("memorial-images")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 4. Generate public URL.
    const { data } = supabase.storage
      .from("memorial-images")
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: data.publicUrl,
    });
  } catch (err: any) {
    console.error("Memorial image upload error:", err);

    return NextResponse.json(
      { error: err.message || "Upload failed." },
      { status: 500 }
    );
  }
}
