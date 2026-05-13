import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: '已退出登录' });

  response.cookies.set('user_id', '', { maxAge: 0, path: '/' });
  response.cookies.set('username', '', { maxAge: 0, path: '/' });
  response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });

  return response;
}
