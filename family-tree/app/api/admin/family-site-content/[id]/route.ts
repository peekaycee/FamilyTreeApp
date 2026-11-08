
import { NextRequest, NextResponse } from "next/server";
import { getCmsClients } from "@/lib/supabase/getCmsClients";
import {
  getDocument,
  normalizeContent,
  getContentLocation,
} from "@/lib/family-site/document";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  const { admin, error, status } = await getCmsClients(req);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const { tenant_id, section, content_type } = body;

    if (!tenant_id || !section || !content_type || !id) {
      return NextResponse.json(
        { error: "Tenant, section, content type and item ID are required." },
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

    const updates =
      body.updates ??
      body.item ??
      Object.fromEntries(
        Object.entries(body).filter(
          ([key]) =>
            !["tenant_id", "section", "content_type"].includes(key)
        )
      );

    const document = await getDocument(admin, tenant_id);
    const content = normalizeContent(document.content);

    const sectionData: any =
      section === "our-family"
        ? content.our_family
        : content[section.replace(/-/g, "_") as keyof typeof content];

    if (location.isArray) {
      const items = sectionData[location.key];

      const index = items.findIndex(
        (entry: any) => entry.id === id
      );

      if (index === -1) {
        return NextResponse.json(
          { error: "Content item not found." },
          { status: 404 }
        );
      }

      items[index] = {
        ...items[index],
        ...updates,
        id,
      };
    } else {
      sectionData[location.key] = {
        ...sectionData[location.key],
        ...updates,
      };
    }

    const { data, error: saveError } = await admin
      .from("family_site_documents")
      .update({ content })
      .eq("tenant_id", tenant_id)
      .select("id, tenant_id, content, updated_at")
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({
      message: "Content updated successfully.",
      document: data,
    });
  } catch (err) {
    console.error("PATCH family site document:", err);

    return NextResponse.json(
      { error: "Unable to update family website content." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  const { admin, error, status } = await getCmsClients(req);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const { id } = await context.params;

    const tenantId = req.nextUrl.searchParams.get("tenantId");
    const section = req.nextUrl.searchParams.get("section");
    const contentType = req.nextUrl.searchParams.get("content_type");

    if (!tenantId || !section || !contentType || !id) {
      return NextResponse.json(
        { error: "Tenant, section, content type and item ID are required." },
        { status: 400 }
      );
    }

    const location = getContentLocation(section, contentType);

    if (!location) {
      return NextResponse.json(
        { error: "Invalid section or content type." },
        { status: 400 }
      );
    }

    const document = await getDocument(admin, tenantId);
    const content = normalizeContent(document.content);

    const sectionData: any =
      section === "our-family"
        ? content.our_family
        : content[section.replace(/-/g, "_") as keyof typeof content];

    if (location.isArray) {
      sectionData[location.key] = sectionData[location.key].filter(
        (entry: any) => entry.id !== id
      );

      // Keep at least two Legacy Spot slots available.
      if (section === "homepage" && contentType === "legacy-spot") {
        while (sectionData[location.key].length < 2) {
          const slotNumber = sectionData[location.key].length + 1;

          sectionData[location.key].push({
            id: crypto.randomUUID(),
            sort_order: slotNumber,
            is_published: false,
          });
        }
      }
    } else {
      sectionData[location.key] = {};
    }

    const { data, error: saveError } = await admin
      .from("family_site_documents")
      .update({ content })
      .eq("tenant_id", tenantId)
      .select("id, tenant_id, content, updated_at")
      .single();

    if (saveError) throw saveError;

    // Media files are deliberately not deleted here.
    // A file may still be referenced by another content item.

    return NextResponse.json({
      message: "Content deleted successfully.",
      document: data,
    });
  } catch (err) {
    console.error("DELETE family site document:", err);

    return NextResponse.json(
      { error: "Unable to delete family website content." },
      { status: 500 }
    );
  }
}
