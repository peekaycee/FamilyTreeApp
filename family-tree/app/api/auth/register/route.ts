// import { NextResponse } from "next/server";
// import { getSubscriber } from "../../../../lib/supabase/getSubscriber";
// import { createSubscriberSupabaseClient } from "../../../../lib/supabase/supabaseFactory";

// export async function POST(req: Request) {
//   try {
//     // ✅ Fetch subscriber at REQUEST TIME
//     const subscriber = await getSubscriber("default");

//     const supabase = createSubscriberSupabaseClient(
//       subscriber.supabase_url,
//       subscriber.supabase_anon_key
//     );

//     const { name, email, password } = await req.json();

//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: { full_name: name },
//       },
//     });

//     if (error) {
//       return NextResponse.json(
//         { message: error.message },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { message: "User registered", user: data.user },
//       { status: 201 }
//     );
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   } catch (err: any) {
//     return NextResponse.json(
//       { message: err.message ?? "Registration failed" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: '' ,
        data: { full_name: name},
      },
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // Insert subscriber row linking to the user
    const { error: subError } = await supabase.from('subscribers').insert({
      email,
      full_name: name,
      owner_user_id: data.user!.id,
      slug: email.split('@')[0], // simple slug example
    });

    if (subError) {
      return NextResponse.json({ message: subError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'User registered successfully',
      user: data.user,
      session: data.session,
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Registration failed' }, { status: 500 });
  }
}
