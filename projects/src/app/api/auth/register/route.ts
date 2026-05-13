import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    if (username.length < 2 || username.length > 50) {
      return NextResponse.json({ error: '用户名长度需在2-50个字符之间' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 检查用户名是否已存在
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
    }

    // 密码哈希加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const { data, error } = await supabase
      .from('users')
      .insert({ username, password: hashedPassword })
      .select('id, username, created_at')
      .single();

    if (error) {
      console.error('注册失败:', error);
      return NextResponse.json({ error: '注册失败，请稍后再试' }, { status: 500 });
    }

    // 设置 cookie
    const response = NextResponse.json({
      user: { id: data.id, username: data.username },
      message: '注册成功',
    });

    response.cookies.set('user_id', String(data.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
    });

    response.cookies.set('username', data.username, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // 简易签名 token: userId:timestamp:hmac
    const token = await createToken(data.id);
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('注册异常:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

async function createToken(userId: number): Promise<string> {
  const secret = process.env.COZE_SUPABASE_ANON_KEY || 'fallback-secret';
  const timestamp = Date.now();
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(`${userId}:${timestamp}:${secret}`, 4);
  return `${userId}:${timestamp}:${hash}`;
}
