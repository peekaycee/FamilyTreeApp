// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    // Server-side sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Create response
    const res = NextResponse.json({ message: "Logged out" }, { status: 200 });

    // Remove Supabase cookies
    res.cookies.set("sb-access-token", "", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(0),
    });
    res.cookies.set("sb-refresh-token", "", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(0),
    });

    // Remove your custom session cookie if any
    res.cookies.set("familytree_session", "", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(0),
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message ?? "Logout failed" },
      { status: 500 }
    );
  }
}
