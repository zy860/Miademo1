import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('blog_posts')
      .select('*')
      .eq('id', Number(id))
      .maybeSingle();

    if (error) throw new Error(`查询文章失败: ${error.message}`);
    if (!data) {
      return NextResponse.json({ error: '文章未找到' }, { status: 404 });
    }

    return NextResponse.json({ post: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
