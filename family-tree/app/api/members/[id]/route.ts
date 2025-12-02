import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // Fetch member to get avatar path
    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('avatar_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete member
    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Delete avatar from storage if exists
    if (member?.avatar_path) {
      await supabase.storage.from('avatars').remove([member.avatar_path]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /members/:id error:', err.message);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
