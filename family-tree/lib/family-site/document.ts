
import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentItem = {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  body?: string;
  image_path?: string | null;
  desktop_image_path?: string | null;
  mobile_image_path?: string | null;
  video_path?: string | null;
  date_of_birth?: string | null;
  year?: number | null;
  sort_order?: number;
  is_published?: boolean;
  [key: string]: unknown;
};

export type FamilySiteContent = {
  homepage: {
    hero: ContentItem;
    family_video: ContentItem;
    legacy_spot: ContentItem[];
    testimonies: ContentItem[];
  };
  our_family: {
    images: ContentItem[];
  };
  legacy: {
    featured_family: ContentItem[];
    timeline: ContentItem[];
  };
};

export const defaultContent = (): FamilySiteContent => ({
  homepage: {
    hero: {},
    family_video: {},
    legacy_spot: [
      {
        id: "legacy-spot-1",
        sort_order: 1,
        is_published: false,
      },
      {
        id: "legacy-spot-2",
        sort_order: 2,
        is_published: false,
      },
    ],
    testimonies: [],
  },
  our_family: {
    images: [],
  },
  legacy: {
    featured_family: [],
    timeline: [],
  },
});

export function normalizeContent(raw: any): FamilySiteContent {
  const defaults = defaultContent();
  const content = raw && typeof raw === "object" ? raw : {};

  const homepage = content.homepage ?? {};
  const ourFamily = content.our_family ?? {};
  const legacy = content.legacy ?? {};

  let legacySpot = homepage.legacy_spot;

// Convert previous single Featured Family object into an array.
let featuredFamily = legacy.featured_family;

if (
  featuredFamily &&
  !Array.isArray(featuredFamily) &&
  typeof featuredFamily === "object" &&
  Object.keys(featuredFamily).length > 0
) {
  featuredFamily = [
    {
      id: featuredFamily.id || "featured-family-legacy",
      ...featuredFamily,
    },
  ];
}

if (!Array.isArray(featuredFamily)) {
  featuredFamily = [];
}

// Ensure older array records have stable IDs.
featuredFamily = featuredFamily.map((item: any, index: number) => ({
  ...item,
  id: item.id || `featured-family-${index + 1}`,
}));

  // Convert the previous single Legacy Spot object into an array.
  if (
    legacySpot &&
    !Array.isArray(legacySpot) &&
    typeof legacySpot === "object" &&
    Object.keys(legacySpot).length > 0
  ) {
    legacySpot = [
      {
        id: crypto.randomUUID(),
        ...legacySpot,
      },
    ];
  }

  if (!Array.isArray(legacySpot)) {
    legacySpot = [];
  }

  // Always provide at least two editable Legacy Spot slots.
  while (legacySpot.length < 2) {
    const slotNumber = legacySpot.length + 1;

    legacySpot.push({
      id: `legacy-spot-${slotNumber}`,
      sort_order: slotNumber,
      is_published: false,
    });
  }

  return {
    homepage: {
      ...defaults.homepage,
      ...homepage,
      hero: homepage.hero ?? {},
      family_video: homepage.family_video ?? {},
      legacy_spot: legacySpot,
      testimonies: Array.isArray(homepage.testimonies)
        ? homepage.testimonies
        : [],
    },
    our_family: {
      ...defaults.our_family,
      ...ourFamily,
      images: Array.isArray(ourFamily.images)
        ? ourFamily.images
        : [],
    },
    legacy: {
      ...defaults.legacy,
      ...legacy,
      featured_family: featuredFamily,
      timeline: Array.isArray(legacy.timeline)
        ? legacy.timeline
        : [],
    },
  };
}

export function getContentLocation(
  section: string,
  contentType: string
): { key: string; isArray: boolean } | null {
  const locations: Record<string, Record<string, { key: string; isArray: boolean }>> = {
    homepage: {
      hero: { key: "hero", isArray: false },
      "family-video": { key: "family_video", isArray: false },
      "legacy-spot": { key: "legacy_spot", isArray: true },
      testimony: { key: "testimonies", isArray: true },
    },
    "our-family": {
      "family-image": { key: "images", isArray: true },
    },
    legacy: {
      "featured-family": { key: "featured_family", isArray: true },
      timeline: { key: "timeline", isArray: true },
    },
  };

  return locations[section]?.[contentType] ?? null;
}

export async function getDocument(
  admin: SupabaseClient,
  tenantId: string
) {
  const { data: existingData, error } = await admin
    .from("family_site_documents")
    .select("id, tenant_id, content, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  let document = existingData;

  if (!document) {
    const { error: insertError } = await admin
      .from("family_site_documents")
      .upsert(
        {
          tenant_id: tenantId,
          content: defaultContent(),
        },
        { onConflict: "tenant_id" }
      );

    if (insertError) {
      throw insertError;
    }

    const { data: newDocument, error: fetchError } = await admin
      .from("family_site_documents")
      .select("id, tenant_id, content, created_at, updated_at")
      .eq("tenant_id", tenantId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    document = newDocument;
  }

  return {
    ...document,
    content: normalizeContent(document.content),
  };
}

export async function addSignedMediaUrls(
  admin: SupabaseClient,
  value: any
): Promise<any> {
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item) => addSignedMediaUrls(admin, item))
    );
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const result: Record<string, any> = {};

  for (const [key, item] of Object.entries(value)) {
    if (
      typeof item === "string" &&
      key.endsWith("_path") &&
      item.length > 0
    ) {
      const bucket = key === "video_path"
        ? "family-site-videos"
        : "family-site-images";

      const { data } = await admin.storage
        .from(bucket)
        .createSignedUrl(item, 3600);

      result[key] = item;
      result[key.replace("_path", "_url")] =
        data?.signedUrl ?? null;
    } else {
      result[key] = await addSignedMediaUrls(admin, item);
    }
  }

  return result;
}
