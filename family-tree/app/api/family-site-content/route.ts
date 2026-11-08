
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  defaultContent,
  normalizeContent,
  addSignedMediaUrls,
} from "@/lib/family-site/document";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function getPublicKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error("Missing Supabase public/anon key.");
  }

  return key;
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("sb-access-token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate the authenticated tenant.
    const userClient = createClient(supabaseUrl, getPublicKey(), {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data: userData, error: authError } =
      await userClient.auth.getUser(accessToken);

    if (authError || !userData.user) {
      return NextResponse.json(
        { error: "Your session is invalid or has expired." },
        { status: 401 }
      );
    }

    const admin = getAdminClient();

    // Resolve the tenant from the authenticated user.
    const { data: subscriber, error: subscriberError } = await admin
      .from("subscribers")
      .select("id")
      .eq("owner_user_id", userData.user.id)
      .maybeSingle();

    if (subscriberError) {
      throw subscriberError;
    }

    if (!subscriber) {
      return NextResponse.json(
        { error: "No family website is associated with this account." },
        { status: 404 }
      );
    }

    // Fetch only this tenant's CMS document.
    const { data: document, error: documentError } = await admin
      .from("family_site_documents")
      .select("content")
      .eq("tenant_id", subscriber.id)
      .maybeSingle();

    if (documentError) {
      throw documentError;
    }

    const content = normalizeContent(
      document?.content ?? defaultContent()
    );

    // Return only published homepage content.
    const publishedContent = {
      ...content,
      homepage: {
        ...content.homepage,

        hero:
          content.homepage.hero?.is_published === true
            ? content.homepage.hero
            : {},

        family_video:
          content.homepage.family_video?.is_published === true
            ? content.homepage.family_video
            : {},

        legacy_spot: content.homepage.legacy_spot.filter(
          (item) => item.is_published === true
        ),

        testimonies: content.homepage.testimonies.filter(
          (item) => item.is_published === true
        ),
      },
    };

    // Generate signed URLs for private Storage media.
    const contentWithUrls = await addSignedMediaUrls(
      admin,
      publishedContent
    );

    return NextResponse.json({
      content: contentWithUrls,
    });
  } catch (error) {
    console.error("Family site content error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve family website content." },
      { status: 500 }
    );
  }
}
