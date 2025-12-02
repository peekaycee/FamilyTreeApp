import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

// GET: fetch all members
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('GET /members error:', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST: add or update member
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, role, father_id, mother_id, avatar_url, avatar_path } = body;

    const { data, error } = await supabase
      .from('family_members')
      .upsert([
        {
          id: id || undefined,
          name,
          role,
          father_id: father_id || null,
          mother_id: mother_id || null,
          avatar_url: avatar_url || null,
          avatar_path: avatar_path || null,
        },
      ], { onConflict: 'id' })
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('POST /members error:', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
