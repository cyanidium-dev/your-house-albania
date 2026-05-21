import 'server-only';
import { cookies } from 'next/headers';
import { EDITOR_COOKIE_NAME, verifyEditorSession } from './signCookie';

export type EditorSession = { authenticated: true } | { authenticated: false };

export async function getEditorSession(): Promise<EditorSession> {
  const store = await cookies();
  const token = store.get(EDITOR_COOKIE_NAME)?.value;
  return verifyEditorSession(token) ? { authenticated: true } : { authenticated: false };
}

export async function requireEditorSession(): Promise<boolean> {
  const s = await getEditorSession();
  return s.authenticated;
}
