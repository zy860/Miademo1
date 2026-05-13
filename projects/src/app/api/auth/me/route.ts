import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const supabase = getSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, created_at')
      .eq('id', Number(userId))
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: { id: user.id, username: user.username } });
  } catch {
    return NextResponse.json({ user: null });
  }
}
