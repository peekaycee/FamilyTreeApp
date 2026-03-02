import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body ?? {};

    // 1️⃣ Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // 2️⃣ Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: { full_name: name },
      },
    });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    if (!data?.user) {
      return NextResponse.json(
        { message: "User creation failed" },
        { status: 400 }
      );
    }

    // 3️⃣ Create slug safely
    const slug = email.includes("@")
      ? email.split("@")[0]
      : email;

    // 4️⃣ IMPORTANT: If email confirmation is enabled,
    // data.session may be null. We must ensure session exists.
    if (!data.session) {
      return NextResponse.json(
        {
          message:
            "Registration successful. Please confirm your email before proceeding.",
        },
        { status: 201 }
      );
    }

    // 5️⃣ Insert into subscribers table
    const { error: subError } = await supabase
      .from("subscribers")
      .insert({
        email,
        full_name: name,
        owner_user_id: data.user.id, // ✅ correct
        slug,
      });

    if (subError) {
      return NextResponse.json(
        { message: subError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: data.user,
        session: data.session,
      },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("REGISTER API ERROR:", err);
    return NextResponse.json(
      { message: err?.message || "Registration failed" },
      { status: 500 }
    );
  }
}