import { NextRequest, NextResponse } from "next/server";
import { getCmsClients } from "@/lib/supabase/getCmsClients";

export async function GET(req: NextRequest) {
  const { admin, error, status } = await getCmsClients(req);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const { data, error: queryError } = await admin
    .from("subscribers")
    .select("id, email, full_name, slug")
    .order("created_at", { ascending: false });

  if (queryError) {
    return NextResponse.json(
      { error: queryError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}
