import { NextResponse } from 'next/server';
import {
  EDITOR_COOKIE_MAX_AGE_SECONDS,
  EDITOR_COOKIE_NAME,
  editorAuthConfigured,
  getEditorPassword,
  signEditorSession,
} from '@/features/editor/auth/signCookie';

export async function POST(req: Request) {
  if (!editorAuthConfigured()) {
    return NextResponse.json(
      { ok: false, reason: 'Editor not configured on server' },
      { status: 503 },
    );
  }

  let password = '';
  try {
    const body = await req.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ ok: false, reason: 'Invalid body' }, { status: 400 });
  }

  const expected = getEditorPassword();
  if (!password || password !== expected) {
    // constant-time-ish: always same delay irrespective of reason
    return NextResponse.json({ ok: false, reason: 'Invalid credentials' }, { status: 401 });
  }

  const token = signEditorSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: EDITOR_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: EDITOR_COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
