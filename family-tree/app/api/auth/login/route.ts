
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'


export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return NextResponse.json({ message: error?.message || 'Login failed' }, { status: 401 });
    }

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user: data.user,
      session: data.session,
    });

    // Set cookies for server-side auth
    const expires = data.session.expires_at ? new Date(data.session.expires_at * 1000) : undefined;

    response.cookies.set('sb-access-token', data.session.access_token, { path: '/', httpOnly: true, expires });
    response.cookies.set('sb-refresh-token', data.session.refresh_token, { path: '/', httpOnly: true, expires });

    return response;

  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Login failed' }, { status: 500 });
  }
}
