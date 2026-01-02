import { NextResponse } from 'next/server'
import { controlPlaneClient as supabase } from '../../../../lib/supabase/controlPlaneClient'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      return NextResponse.json(
        { message: error?.message || 'Login failed' },
        { status: 401 }
      )
    }

    const response = NextResponse.json(
      { message: 'Logged in', user: data.user, session: data.session },
      { status: 200 }
    )

    // Set cookies for sb-access-token and sb-refresh-token
    const expires = data.session.expires_at
      ? new Date(data.session.expires_at * 1000)
      : undefined

    response.cookies.set('sb-access-token', data.session.access_token, {
      path: '/',
      httpOnly: true,
      expires,
    })

    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      path: '/',
      httpOnly: true,
      expires,
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
