
import { NextRequest, NextResponse } from "next/server";
import { getCmsClients } from "@/lib/supabase/getCmsClients";
import {
  getDocument,
  normalizeContent,
  getContentLocation,
  addSignedMediaUrls,
} from "@/lib/family-site/document";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { admin, error, status } = await getCmsClients(req);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const tenantId = req.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required." },
        { status: 400 }
      );
    }

    const document = await getDocument(admin, tenantId);

    const contentWithUrls = await addSignedMediaUrls(
      admin,
      document.content
    );

    return NextResponse.json({
      ...document,
      content: contentWithUrls,
    });
  } catch (err) {
    console.error("GET family site document:", err);

    return NextResponse.json(
      { error: "Unable to load family website content." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { admin, error, status } = await getCmsClients(req);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const body = await req.json();

    const {
      tenant_id,
      section,
      content_type,
      item: submittedItem,
    } = body;

    if (!tenant_id || !section || !content_type) {
      return NextResponse.json(
        { error: "Tenant, section and content type are required." },
        { status: 400 }
      );
    }

    if (
      !submittedItem ||
      typeof submittedItem !== "object" ||
      Array.isArray(submittedItem)
    ) {
      return NextResponse.json(
        { error: "A valid content item is required." },
        { status: 400 }
      );
    }

    const location = getContentLocation(section, content_type);

    if (!location) {
      return NextResponse.json(
        { error: "Invalid section or content type." },
        { status: 400 }
      );
    }

    const document = await getDocument(admin, tenant_id);
    const content = normalizeContent(document.content);

    const item = {
      ...submittedItem,
      id: submittedItem.id || crypto.randomUUID(),
      sort_order: Number(submittedItem.sort_order ?? 0),
      is_published: Boolean(submittedItem.is_published),
    };

    const sectionData =
      section === "our-family"
        ? content.our_family
        : content[section as "homepage" | "legacy"];

    if (location.isArray) {
      const items = sectionData[
        location.key as keyof typeof sectionData
      ] as unknown[];

      if (!Array.isArray(items)) {
        return NextResponse.json(
          { error: "The selected content collection is invalid." },
          { status: 400 }
        );
      }

      const existingIndex = items.findIndex(
        (entry: any) => entry.id === item.id
      );

      if (existingIndex >= 0) {
        items[existingIndex] = {
          ...(items[existingIndex] as Record<string, unknown>),
          ...item,
        };
      } else {
        items.push(item);
      }
    } else {
      const current = sectionData[
        location.key as keyof typeof sectionData
      ];

      (sectionData as any)[location.key] = {
        ...(current && typeof current === "object" ? current : {}),
        ...item,
      };
    }

    const { data, error: saveError } = await admin
      .from("family_site_documents")
      .upsert(
        {
          tenant_id,
          content,
        },
        { onConflict: "tenant_id" }
      )
      .select("id, tenant_id, content, updated_at")
      .single();

    if (saveError) throw saveError;

    return NextResponse.json(
      {
        message: "Content saved successfully.",
        document: data,
        item,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST family site document:", err);

    return NextResponse.json(
      { error: "Unable to save family website content." },
      { status: 500 }
    );
  }
}
