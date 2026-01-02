import { getTenantClient } from "@/lib/supabase/getTenantClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const client = getTenantClient(req);
  const { data } = await client.auth.getSession();
  return NextResponse.json(data);
}
