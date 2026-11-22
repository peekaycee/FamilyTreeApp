// import { NextResponse } from 'next/server';

// import { createSupabaseServerClient } from '@/lib/supabase/server';


// export async function POST(req: Request) {

//   const supabase = await createSupabaseServerClient();

//   try {

//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return NextResponse.json(
//         { message: 'Email and password are required' },
//         { status: 400 }
//       );
//     }

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password
//     });

//     if (error || !data.session) {
//       return NextResponse.json(
//         { message: error?.message || 'Login failed' },
//         { status: 401 }
//       );
//     }

//     const response = NextResponse.json({
//       message: 'Logged in successfully',
//       user: data.user,
//       session: data.session,
//     });

//     // ================================================
//     // SET COOKIES FOR SERVER-SIDE AUTHENTICATION
//     // ================================================

//     const expires = data.session.expires_at
//       ? new Date(data.session.expires_at * 1000)
//       : undefined;

//     response.cookies.set(
//       'sb-access-token',
//       data.session.access_token,
//       {
//         path: '/',
//         httpOnly: true,
//         expires,
//       }
//     );

//     response.cookies.set(
//       'sb-refresh-token',
//       data.session.refresh_token,
//       {
//         path: '/',
//         httpOnly: true,
//         expires,
//       }
//     );

//     return response;

//   } catch (err: any) {

//     return NextResponse.json(
//       { message: err.message || 'Login failed' },
//       { status: 500 }
//     );

//   }

// }


// app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { message: error?.message || "Login failed." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      message: "Logged in successfully",
      user: data.user,
      session: data.session,
    });

    const secure = process.env.NODE_ENV === "production";

    // Access token cookie.
    response.cookies.set("sb-access-token", data.session.access_token, {
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "lax",
      expires: data.session.expires_at
        ? new Date(data.session.expires_at * 1000)
        : undefined,
    });

    // Refresh token has its own longer lifetime.
    response.cookies.set("sb-refresh-token", data.session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);

    return NextResponse.json(
      { message: err.message || "Login failed." },
      { status: 500 }
    );
  }
}