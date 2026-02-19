// import { getTenantClient } from "@/lib/supabase/getTenantClient";
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   const client = getTenantClient(req);
//   const { data } = await client.auth.getSession();
//   return NextResponse.json(data);
// }


import { NextResponse } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/supabase/supabaseClient';
import { cookies } from 'next/headers';

export async function GET() {
  const access_token = (await cookies()).get('sb-access-token')?.value;

  if (!access_token) {
    return NextResponse.json({ session: null }, { status: 200 });
  }
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return NextResponse.json({ session: null, message: error.message }, { status: 200 });
  }

  return NextResponse.json({ session: data.session });
}
