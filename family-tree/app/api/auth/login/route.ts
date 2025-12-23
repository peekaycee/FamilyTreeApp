import { NextResponse } from 'next/server'
import { controlPlaneClient as supabase } from '../../../../lib/supabase/controlPlaneClient'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
