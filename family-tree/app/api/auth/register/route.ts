// import { NextResponse } from 'next/server'
// // import { supabase } from '../../../../lib/supabaseClient'

// import { getSubscriber } from '../../../../lib/supabase/getSubscriber';
// import { createSubscriberSupabaseClient } from '../../../../lib/supabase/supabaseFactory';

// const subscriber = await getSubscriber('default');

// const supabase = createSubscriberSupabaseClient(
//   subscriber.supabase_url,
//   subscriber.supabase_anon_key
// );

// await supabase.from('posts').select('*');


// export async function POST(req: Request) {
//   try {
//     const { name, email, password } = await req.json()

//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: { full_name: name }, // store user's name in metadata
//       },
//     })

//     if (error) {
//       return NextResponse.json({ message: error.message }, { status: 400 })
//     }

//     return NextResponse.json({ message: 'User registered', user: data.user }, { status: 200 })
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   } catch (err: any) {
//     return NextResponse.json({ message: err.message }, { status: 500 })
//   }
// }


import { NextResponse } from "next/server";
import { getSubscriber } from "../../../../lib/supabase/getSubscriber";
import { createSubscriberSupabaseClient } from "../../../../lib/supabase/supabaseFactory";

export async function POST(req: Request) {
  try {
    // ✅ Fetch subscriber at REQUEST TIME
    const subscriber = await getSubscriber("default");

    const supabase = createSubscriberSupabaseClient(
      subscriber.supabase_url,
      subscriber.supabase_anon_key
    );

    const { name, email, password } = await req.json();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "User registered", user: data.user },
      { status: 201 }
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message ?? "Registration failed" },
      { status: 500 }
    );
  }
}
