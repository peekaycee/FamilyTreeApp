import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path } = body;
    if (!path) return NextResponse.json({ error: 'Missing file path' }, { status: 400 });

    // Extract and validate Bearer token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

    // Create Supabase client using the user's token to enforce RLS
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    // Validate path prefix to ensure users only upload to their folder
    if (!path.startsWith(`avatars/${user.id}/`)) {
      return NextResponse.json({ error: 'Invalid upload path' }, { status: 400 });
    }

    // Generate signed upload URL (2 minutes validity)
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .createSignedUploadUrl(path);

    if (error) throw error;

    return NextResponse.json({ token: data.token, path });
  } catch (err: any) {
    console.error('Signed upload error:', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
