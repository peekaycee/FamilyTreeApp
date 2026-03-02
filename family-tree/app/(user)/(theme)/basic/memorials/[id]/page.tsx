// app/memorials/[id]/page.tsx

export const dynamic = "force-dynamic"; // keep dynamic to avoid caching

import MemorialDetailClient from "./MemorialDetailClient";
import { getTenantClient } from "@/lib/supabase/getTenantClient";
import { notFound } from "next/navigation";

type Params = {
  params: Promise<{ id: string }>;
};

// Safe helper to extract candle_count whether object or array
function getCandleCount(memorial: any) {
  if (!memorial.memorial_candles) return 0;
  return Array.isArray(memorial.memorial_candles)
    ? memorial.memorial_candles[0]?.count ?? 0
    : memorial.memorial_candles.count ?? 0;
}

export default async function MemorialDetailPage({ params }: Params) {
  const { id } = await params;

  const supabase = getTenantClient();

  const { data: memorial, error } = await supabase
    .from("memorials")
    .select(
      `
        *,
        memorial_messages (
          id,
          message,
          created_at,
          author,
          user_id
        ),
        memorial_candles (count)
      `
    )
    .eq("id", id)
    .order("created_at", {
      foreignTable: "memorial_messages",
      ascending: true,
    })
    .single();

  if (error || !memorial) return notFound();

  const normalizedMemorial = {
    ...memorial,
    candle_count: getCandleCount(memorial),
  };

  return <MemorialDetailClient initialMemorial={normalizedMemorial} />;
}
