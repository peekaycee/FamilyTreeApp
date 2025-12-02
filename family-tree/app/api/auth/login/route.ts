// // /app/api/auth/login/route.ts
// import { NextResponse } from 'next/server'

// export async function POST(request: Request) {
//   try {
//     const { email, password } = await request.json()

//     // TODO: replace with real auth (DB) check
//     const valid = email === 'test@example.com' && password === '1234'

//     if (!valid) {
//       return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
//     }

//     const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

//     const res = NextResponse.json({ message: 'Login successful' })
//     res.cookies.set('familytree_session', sessionToken, {
//       httpOnly: true,
//       path: '/',
//       sameSite: 'lax',
//       secure: process.env.NODE_ENV === 'production',
//       maxAge: 60 * 60 * 24, // 1 day
//     })
//     return res
//   } catch (err) {
//     console.error('Login error:', err)
//     return NextResponse.json({ message: 'Server error' }, { status: 500 })
//   }
// }


import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { message: 'Logged in', user: data.user, session: data.session },
      { status: 200 }
    )
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

