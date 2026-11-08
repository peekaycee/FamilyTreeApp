
import { NextRequest, NextResponse } from "next/server";
import { getCmsClients } from "@/lib/supabase/getCmsClients";

export const runtime = "nodejs";

const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const videoTypes: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(req: NextRequest) {
  const { admin, error, status } = await getCmsClients(req);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const formData = await req.formData();

    const tenantId = formData.get("tenantId");
    const section = formData.get("section");
    const file = formData.get("file");

    if (
      typeof tenantId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)
    ) {
      return NextResponse.json(
        { error: "Invalid tenant ID." },
        { status: 400 }
      );
    }

    if (
      typeof section !== "string" ||
      !["homepage", "our-family", "legacy"].includes(section)
    ) {
      return NextResponse.json(
        { error: "Invalid content section." },
        { status: 400 }
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Please select a file." },
        { status: 400 }
      );
    }

    const isImage = Boolean(imageTypes[file.type]);
    const isVideo = Boolean(videoTypes[file.type]);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Unsupported file format." },
        { status: 400 }
      );
    }

    const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isImage
            ? "Images must not exceed 10MB."
            : "Videos must not exceed 100MB.",
        },
        { status: 400 }
      );
    }

    const { data: tenant, error: tenantError } = await admin
      .from("subscribers")
      .select("id")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Tenant not found." },
        { status: 404 }
      );
    }

    const bucket = isImage
      ? "family-site-images"
      : "family-site-videos";

    const extension = isImage
      ? imageTypes[file.type]
      : videoTypes[file.type];

    const path = `${tenantId}/${section}/${crypto.randomUUID()}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: signed, error: signedError } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 3600);

    if (signedError) {
      // Clean up if preview URL generation fails.
      await admin.storage.from(bucket).remove([path]);

      return NextResponse.json(
        { error: signedError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      path,
      bucket,
      signedUrl: signed.signedUrl,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process this upload." },
      { status: 500 }
    );
  }
}
