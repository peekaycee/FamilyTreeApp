// import { NextResponse } from 'next/server'

// export async function POST() {
//   // Create a response to confirm logout
//   const res = NextResponse.json({ message: 'Logged out successfully' })

//   // Clear session cookie
//   res.cookies.set('familytree_session', '', {
//     httpOnly: true,
//     path: '/',
//     sameSite: 'lax',
//     secure: process.env.NODE_ENV === 'production',
//     maxAge: 0,
//   })

//   return res
// }


import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient'

export async function POST() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Logged out' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

