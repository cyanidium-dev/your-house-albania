import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Minimal HMAC-signed session cookie for the landing editor.
 * Keeps the editor self-contained and replaceable by NextAuth later.
 *
 * Cookie format: `<issuedAtMs>.<hex-hmac>`
 */

export const EDITOR_COOKIE_NAME = 'domlivo_editor_session';
export const EDITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

function getSecret(): string {
  const secret =
    process.env.EDITOR_SESSION_SECRET ??
    process.env.SANITY_WRITE_TOKEN ??
    '';
  return secret;
}

export function getEditorPassword(): string {
  return process.env.EDITOR_PASSWORD ?? '';
}

export function editorAuthConfigured(): boolean {
  return Boolean(getSecret()) && Boolean(getEditorPassword());
}

export function signEditorSession(issuedAtMs: number = Date.now()): string {
  const secret = getSecret();
  if (!secret) throw new Error('Editor session secret not configured');
  const payload = String(issuedAtMs);
  const mac = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${mac}`;
}

export function verifyEditorSession(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return false;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt)) return false;
  const ageMs = Date.now() - issuedAt;
  if (ageMs < 0 || ageMs > EDITOR_COOKIE_MAX_AGE_SECONDS * 1000) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(mac, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
