import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password, created_at')
      .eq('username', username)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 设置 cookie
    const response = NextResponse.json({
      user: { id: user.id, username: user.username },
      message: '登录成功',
    });

    response.cookies.set('user_id', String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('username', user.username, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    const token = await createToken(user.id);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('登录异常:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

async function createToken(userId: number): Promise<string> {
  const secret = process.env.COZE_SUPABASE_ANON_KEY || 'fallback-secret';
  const timestamp = Date.now();
  const hash = await bcrypt.hash(`${userId}:${timestamp}:${secret}`, 4);
  return `${userId}:${timestamp}:${hash}`;
}
