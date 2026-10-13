/**
 * Google service-account auth for the Search Console API, without the
 * `googleapis` package: a signed JWT exchanged for an access token (the
 * "two-legged OAuth" flow, RFC 7523). Thirty lines of `node:crypto` instead of
 * a dependency of several megabytes in a serverless function.
 */

import { createSign } from 'node:crypto'

export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token'

export type ServiceAccountKey = {
  client_email: string
  private_key: string
  private_key_id?: string
  token_uri: string
}

/**
 * Parses the JSON key file pasted into `GSC_SERVICE_ACCOUNT_JSON`. Returns
 * `null` when it is missing or is not a service-account key, so callers can
 * say "not configured" instead of failing.
 */
export function parseServiceAccount(raw: string | undefined | null): ServiceAccountKey | null {
  if (!raw?.trim()) return null
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof json !== 'object' || json === null) return null
  const k = json as Record<string, unknown>
  if (typeof k.client_email !== 'string' || typeof k.private_key !== 'string') return null
  // A key that went through a shell or a UI that escaped it twice arrives with
  // literal "\n" sequences instead of line breaks; PEM needs the real ones.
  const privateKey = k.private_key.includes('\\n') ? k.private_key.replace(/\\n/g, '\n') : k.private_key
  if (!privateKey.includes('PRIVATE KEY')) return null
  const tokenUri = typeof k.token_uri === 'string' && /^https:\/\//.test(k.token_uri) ? k.token_uri : DEFAULT_TOKEN_URI
  return {
    client_email: k.client_email,
    private_key: privateKey,
    ...(typeof k.private_key_id === 'string' ? { private_key_id: k.private_key_id } : {}),
    token_uri: tokenUri,
  }
}

function base64url(input: string | Buffer): string {
  return (typeof input === 'string' ? Buffer.from(input, 'utf8') : input).toString('base64url')
}

/**
 * The signed assertion: `base64url(header).base64url(claims).base64url(sig)`,
 * RS256 over the first two parts. Valid for an hour, which is Google's maximum.
 */
export function buildJwtAssertion(key: ServiceAccountKey, scope: string, now: Date): string {
  const iat = Math.floor(now.getTime() / 1000)
  const header = { alg: 'RS256', typ: 'JWT', ...(key.private_key_id ? { kid: key.private_key_id } : {}) }
  const claims = { iss: key.client_email, scope, aud: key.token_uri, iat, exp: iat + 3600 }
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  const signature = createSign('RSA-SHA256').update(signingInput).sign(key.private_key)
  return `${signingInput}.${base64url(signature)}`
}

/** Exchanges the assertion for a bearer token. Throws with Google's reason on failure. */
export async function fetchAccessToken(
  key: ServiceAccountKey,
  opts: { fetch?: typeof fetch; now?: Date; scope?: string } = {}
): Promise<string> {
  const doFetch = opts.fetch ?? fetch
  const assertion = buildJwtAssertion(key, opts.scope ?? GSC_SCOPE, opts.now ?? new Date())
  const res = await doFetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string }
  if (!res.ok || !json.access_token) {
    throw new Error(`token exchange failed (${res.status}): ${json.error_description ?? json.error ?? 'no token'}`)
  }
  return json.access_token
}
