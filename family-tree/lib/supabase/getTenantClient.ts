// // lib/supabase/getTenantClient.ts
// import { createClient } from '@supabase/supabase-js'
// import { NextRequest } from 'next/server'

// export function getTenantClient(req: NextRequest) {
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
//   const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // use service role for server

//   const access_token = req.cookies.get('sb-access-token')?.value
//   const refresh_token = req.cookies.get('sb-refresh-token')?.value

//   const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//     global: {
//       headers: access_token ? {
//         Authorization: `Bearer ${access_token}`,
//       } : {},
//     },
//   })

//   // Optionally, attach session tokens to supabase auth
//   if (access_token && refresh_token) {
//     supabase.auth.setSession({
//       access_token,
//       refresh_token,
//     })
//   }

//   return supabase
// }


// lib/supabase/getTenantClient.ts
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export function getTenantClient(req?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // SERVER COMPONENT MODE (no req)
  if (!req) {
    return createClient(supabaseUrl, supabaseKey);
  }

  // API ROUTE MODE
  const cookieStore = req.cookies;
  const access_token = cookieStore.get("sb-access-token")?.value;
  const refresh_token = cookieStore.get("sb-refresh-token")?.value;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: access_token
        ? { Authorization: `Bearer ${access_token}` }
        : {},
    },
  });

  if (access_token && refresh_token) {
    supabase.auth.setSession({
      access_token,
      refresh_token,
    });
  }

  return supabase;
}
