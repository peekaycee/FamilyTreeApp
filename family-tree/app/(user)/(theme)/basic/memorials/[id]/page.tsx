// // app/memorials/[id]/page.tsx

// export const dynamic = "force-dynamic"; // keep dynamic to avoid caching

// import MemorialDetailClient from "./MemorialDetailClient";
// import { getTenantClient } from "@/lib/supabase/getTenantClient";
// import { notFound } from "next/navigation";

// type Params = {
//   params: Promise<{ id: string }>;
// };

// // Safe helper to extract candle_count whether object or array
// function getCandleCount(memorial: any) {
//   if (!memorial.memorial_candles) return 0;
//   return Array.isArray(memorial.memorial_candles)
//     ? memorial.memorial_candles[0]?.count ?? 0
//     : memorial.memorial_candles.count ?? 0;
// }

// export default async function MemorialDetailPage({ params }: Params) {
//   const { id } = await params;

//   const supabase = getTenantClient();

//   const { data: memorial, error } = await supabase
//     .from("memorials")
//     .select(
//       `
//         *,
//         memorial_messages (
//           id,
//           message,
//           created_at,
//           author,
//           user_id
//         ),
//         memorial_candles (count)
//       `
//     )
//     .eq("id", id)
//     .order("created_at", {
//       foreignTable: "memorial_messages",
//       ascending: true,
//     })
//     .single();

//   if (error || !memorial) return notFound();

//   const normalizedMemorial = {
//       ...memorial,
//       picture:
//         memorial.picture ||
//         "/images/image-placeholder-removebg-preview (1).png",
//       candle_count: getCandleCount(memorial),
//     };

//   return <MemorialDetailClient initialMemorial={normalizedMemorial} />;
// }



// app/memorials/[id]/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import MemorialDetailClient from "./MemorialDetailClient";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

function getCandleCount(memorial: any) {
  const candles = memorial.memorial_candles;

  if (!candles) return 0;

  return Array.isArray(candles)
    ? candles[0]?.count ?? 0
    : candles.count ?? 0;
}

export default async function MemorialDetailPage({
  params,
}: Params) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  // 1. Authenticate the visitor.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. Retrieve only this user's memorial.
  const { data: memorial, error } = await supabase
    .from("memorials")
    .select(`
      *,
      memorial_messages (
        id,
        message,
        created_at,
        author,
        user_id
      ),
      memorial_candles (count)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .order("created_at", {
      foreignTable: "memorial_messages",
      ascending: true,
    })
    .maybeSingle();

  if (error || !memorial) {
    notFound();
  }

  const normalizedMemorial = {
    ...memorial,

    picture:
      memorial.picture ||
      "/images/image-placeholder-removebg-preview (1).png",

    candle_count: getCandleCount(memorial),
  };

  return (
    <MemorialDetailClient
      initialMemorial={normalizedMemorial}
    />
  );
}
