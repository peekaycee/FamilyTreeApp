// import { createClient } from "@supabase/supabase-js";
// import { NextRequest, NextResponse } from "next/server";
// import {
//   defaultContent,
//   normalizeContent,
//   addSignedMediaUrls,
// } from "@/lib/family-site/document";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// function getAdminClient() {
//   const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//   if (!serviceKey) {
//     throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
//   }

//   return createClient(supabaseUrl, serviceKey, {
//     auth: {
//       autoRefreshToken: false,
//       persistSession: false,
//       detectSessionInUrl: false,
//     },
//   });
// }

// function getPublicKey() {
//   const key =
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

//   if (!key) {
//     throw new Error("Missing Supabase public/anon key.");
//   }

//   return key;
// }

// export async function GET(req: NextRequest) {
//   try {
//     // 1. Retrieve authenticated session token.
//     const accessToken = req.cookies.get("sb-access-token")?.value;

//     if (!accessToken) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     // 2. Validate authenticated user.
//     const userClient = createClient(supabaseUrl, getPublicKey(), {
//       global: {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       },
//       auth: {
//         autoRefreshToken: false,
//         persistSession: false,
//         detectSessionInUrl: false,
//       },
//     });

//     const { data: userData, error: authError } =
//       await userClient.auth.getUser(accessToken);

//     if (authError || !userData.user) {
//       return NextResponse.json(
//         { error: "Your session is invalid or has expired." },
//         { status: 401 }
//       );
//     }

//     // 3. Initialize admin client.
//     const admin = getAdminClient();

//     // 4. Resolve tenant using authenticated user ID.
//     const { data: subscriber, error: subscriberError } = await admin
//       .from("subscribers")
//       .select("id")
//       .eq("owner_user_id", userData.user.id)
//       .maybeSingle();

//     if (subscriberError) {
//       throw subscriberError;
//     }

//     if (!subscriber) {
//       return NextResponse.json(
//         { error: "No family website is associated with this account." },
//         { status: 404 }
//       );
//     }

//     // 5. Retrieve only this tenant's family website document.
//     const { data: document, error: documentError } = await admin
//       .from("family_site_documents")
//       .select("content")
//       .eq("tenant_id", subscriber.id)
//       .maybeSingle();

//     if (documentError) {
//       throw documentError;
//     }

//     const content = normalizeContent(
//       document?.content ?? defaultContent()
//     );

//     // 6. Return only published homepage content.
//     const publishedContent = {
//       ...content,

//       homepage: {
//         ...content.homepage,

//         hero:
//           content.homepage.hero?.is_published === true
//             ? content.homepage.hero
//             : {},

//         family_video:
//           content.homepage.family_video?.is_published === true
//             ? content.homepage.family_video
//             : {},

//         legacy_spot: content.homepage.legacy_spot.filter(
//           (item) => item.is_published === true
//         ),

//         testimonies: content.homepage.testimonies.filter(
//           (item) => item.is_published === true
//         ),
//       },

//       // 7. Return only published family images.
//       our_family: {
//         ...content.our_family,

//         images: content.our_family.images.filter(
//           (image) => image.is_published === true
//         ),
//       },
//     };

//     // 8. Generate signed URLs for private Storage media.
//     const contentWithUrls = await addSignedMediaUrls(
//       admin,
//       publishedContent
//     );

//     // 9. Return authenticated tenant's content.
//     return NextResponse.json(
//       {
//         content: contentWithUrls,
//       },
//       {
//         headers: {
//           "Cache-Control": "private, no-store, max-age=0",
//         },
//       }
//     );

//   } catch (error) {
//     console.error("Family site content error:", error);

//     return NextResponse.json(
//       { error: "Unable to retrieve family website content." },
//       {
//         status: 500,
//         headers: {
//           "Cache-Control": "no-store",
//         },
//       }
//     );
//   }
// }



// app/api/family-site-content/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import {
  defaultContent,
  normalizeContent,
  addSignedMediaUrls,
} from "@/lib/family-site/document";

import { getTenantClient } from "@/lib/supabase/getTenantClient";

export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate the request using the user's token.
    const supabase = getTenantClient(req);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 }
      );
    }

    // 2. Initialize privileged client only after authentication.
    const admin = getAdminClient();

    // 3. Resolve the authenticated user's tenant.
    const { data: subscriber, error: subscriberError } = await admin
      .from("subscribers")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (subscriberError) throw subscriberError;

    if (!subscriber) {
      return NextResponse.json(
        { error: "No family website is associated with this account." },
        { status: 404 }
      );
    }

    // 4. Retrieve only the authenticated tenant's document.
    const { data: document, error: documentError } = await admin
      .from("family_site_documents")
      .select("content")
      .eq("tenant_id", subscriber.id)
      .maybeSingle();

    if (documentError) throw documentError;

    const content = normalizeContent(
      document?.content ?? defaultContent()
    );

    // 5. Expose only published content.
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

      our_family: {
        ...content.our_family,

        images: content.our_family.images.filter(
          (image) => image.is_published === true
        ),
      },
    };

    // 6. Generate signed URLs for private storage media.
    const contentWithUrls = await addSignedMediaUrls(
      admin,
      publishedContent
    );

    return NextResponse.json(
      {
        content: contentWithUrls,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Family site content error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve family website content." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
