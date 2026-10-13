import { createVerify, generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildJwtAssertion, fetchAccessToken, GSC_SCOPE, parseServiceAccount } from './gscAuth'

// A throwaway key generated for the test run; nothing real is ever signed.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()

const keyFile = {
  type: 'service_account',
  project_id: 'domlivo-analytics',
  private_key_id: 'abc123',
  private_key: PEM,
  client_email: 'gsc-reader@domlivo-analytics.iam.gserviceaccount.com',
  token_uri: 'https://oauth2.googleapis.com/token',
}

function decodePart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))
}

describe('parseServiceAccount', () => {
  it('reads a downloaded key file', () => {
    const key = parseServiceAccount(JSON.stringify(keyFile))
    expect(key).toMatchObject({
      client_email: keyFile.client_email,
      private_key_id: 'abc123',
      token_uri: 'https://oauth2.googleapis.com/token',
    })
  })

  it('repairs a key whose line breaks were escaped twice', () => {
    const doubled = JSON.stringify({ ...keyFile, private_key: PEM.replace(/\n/g, '\\n') })
    expect(parseServiceAccount(doubled)?.private_key).toBe(PEM)
  })

  it('says "not configured" for anything else', () => {
    expect(parseServiceAccount(undefined)).toBeNull()
    expect(parseServiceAccount('')).toBeNull()
    expect(parseServiceAccount('{not json')).toBeNull()
    expect(parseServiceAccount(JSON.stringify({ client_email: 'x' }))).toBeNull()
    expect(parseServiceAccount(JSON.stringify({ ...keyFile, private_key: 'hunter2' }))).toBeNull()
  })

  it('falls back to Google\'s token endpoint when the URI is missing or not https', () => {
    const { token_uri: _drop, ...rest } = keyFile
    void _drop
    expect(parseServiceAccount(JSON.stringify(rest))?.token_uri).toBe('https://oauth2.googleapis.com/token')
    expect(parseServiceAccount(JSON.stringify({ ...keyFile, token_uri: 'http://x' }))?.token_uri).toBe(
      'https://oauth2.googleapis.com/token'
    )
  })
})

describe('buildJwtAssertion', () => {
  const key = parseServiceAccount(JSON.stringify(keyFile))!
  const now = new Date('2026-10-13T03:30:00Z')
  const jwt = buildJwtAssertion(key, GSC_SCOPE, now)
  const [h, c, s] = jwt.split('.')

  it('has the header and claims Google expects', () => {
    expect(decodePart(h)).toEqual({ alg: 'RS256', typ: 'JWT', kid: 'abc123' })
    const iat = Math.floor(now.getTime() / 1000)
    expect(decodePart(c)).toEqual({
      iss: keyFile.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat,
      exp: iat + 3600,
    })
  })

  it('is signed with the key (RS256 over header.claims)', () => {
    const ok = createVerify('RSA-SHA256').update(`${h}.${c}`).verify(publicKey, Buffer.from(s, 'base64url'))
    expect(ok).toBe(true)
  })

  it('uses URL-safe base64 without padding', () => {
    expect(jwt).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  })
})

describe('fetchAccessToken', () => {
  const key = parseServiceAccount(JSON.stringify(keyFile))!

  it('posts the assertion as a JWT-bearer grant and returns the token', async () => {
    let seen: { url: string; body: string } | null = null
    const fakeFetch = (async (url: string, init: RequestInit) => {
      seen = { url, body: String(init.body) }
      return new Response(JSON.stringify({ access_token: 'ya29.token', expires_in: 3599 }), { status: 200 })
    }) as unknown as typeof fetch
    await expect(fetchAccessToken(key, { fetch: fakeFetch })).resolves.toBe('ya29.token')
    expect(seen!.url).toBe('https://oauth2.googleapis.com/token')
    const form = new URLSearchParams(seen!.body)
    expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer')
    expect(form.get('assertion')?.split('.')).toHaveLength(3)
  })

  it('throws with Google\'s reason when the exchange is refused', async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid JWT Signature.' }), {
        status: 400,
      })) as unknown as typeof fetch
    await expect(fetchAccessToken(key, { fetch: fakeFetch })).rejects.toThrow('Invalid JWT Signature.')
  })
})
