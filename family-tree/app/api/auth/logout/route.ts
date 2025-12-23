// // /app/api/auth/logout/route.ts
// import { NextResponse } from 'next/server';
// // import { supabase } from '../../../../lib/supabaseClient';

// import { getSubscriber } from '../../../../lib/supabase/getSubscriber';
// import { createSubscriberSupabaseClient } from '../../../../lib/supabase/supabaseFactory';

// const subscriber = await getSubscriber('default');

// const supabase = createSubscriberSupabaseClient(
//   subscriber.supabase_url,
//   subscriber.supabase_anon_key
// );

// await supabase.from('posts').select('*');


// export async function POST() {
//   try {
//     const { error } = await supabase.auth.signOut();

//     if (error) {
//       return NextResponse.json({ message: error.message }, { status: 500 });
//     }

//     const res = NextResponse.json({ message: 'Logged out' }, { status: 200 });
//     // Destroy cookie as well
//     res.cookies.set('familytree_session', '', {
//       path: '/',
//       httpOnly: true,
//       secure: true,
//       sameSite: 'lax',
//       expires: new Date(0),
//     });

//     return res;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   } catch (err: any) {
//     return NextResponse.json({ message: err.message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const res = NextResponse.json(
      { message: "Logged out" },
      { status: 200 }
    );

    res.cookies.set("familytree_session", "", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(0),
    });

    return res;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message ?? "Logout failed" },
      { status: 500 }
    );
  }
}
