import { NextResponse } from 'next/server';
import { EDITOR_COOKIE_NAME } from '@/features/editor/auth/signCookie';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: EDITOR_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
