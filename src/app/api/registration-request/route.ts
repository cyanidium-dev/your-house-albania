import { NextResponse } from 'next/server';
import { createRegistrationRequest } from '@/lib/sanity/writeClient';

const ALLOWED_LANGUAGES = new Set(['en', 'uk', 'ru', 'sq', 'it']);
const ALLOWED_REALTOR_OR_AGENCY = new Set(['realtor', 'agency']);

const MAX_LEN = 500;

type Body = {
  name?: string;
  phone?: string;
  email?: string;
  language?: string;
  realtorOrAgency?: string;
  /** Honeypot — must stay empty for real users. */
  companyWebsite?: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false as const, error }, { status });
}

function jsonOk() {
  return NextResponse.json({ ok: true as const });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonError(400, 'Invalid JSON');
  }

  const hp =
    typeof body.companyWebsite === 'string' ? body.companyWebsite.trim() : '';
  if (hp.length > 0) {
    console.warn('[registration-request] rejected (honeypot)');
    return jsonError(400, 'Bad request');
  }

  if (!isNonEmptyString(body.name)) {
    return jsonError(400, 'Missing name');
  }
  if (!isNonEmptyString(body.phone)) {
    return jsonError(400, 'Missing phone');
  }
  if (typeof body.language !== 'string' || !ALLOWED_LANGUAGES.has(body.language)) {
    return jsonError(400, 'Invalid language');
  }

  const name = body.name.trim();
  const phone = body.phone.trim();
  if (name.length > MAX_LEN || phone.length > MAX_LEN) {
    return jsonError(400, 'Invalid input');
  }

  let email: string | undefined;
  if (body.email !== undefined && body.email !== null) {
    const raw = typeof body.email === 'string' ? body.email.trim() : '';
    if (raw.length > 0) {
      if (raw.length > MAX_LEN) {
        return jsonError(400, 'Invalid email');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        return jsonError(400, 'Invalid email');
      }
      email = raw;
    }
  }

  let realtorOrAgency: 'realtor' | 'agency' | undefined;
  if (body.realtorOrAgency !== undefined && body.realtorOrAgency !== null) {
    const v =
      typeof body.realtorOrAgency === 'string' ? body.realtorOrAgency.trim() : '';
    if (v.length > 0) {
      if (!ALLOWED_REALTOR_OR_AGENCY.has(v)) {
        return jsonError(400, 'Invalid type');
      }
      realtorOrAgency = v as 'realtor' | 'agency';
    }
  }

  const result = await createRegistrationRequest({
    name,
    phone,
    language: body.language,
    ...(email !== undefined ? { email } : {}),
    ...(realtorOrAgency !== undefined ? { realtorOrAgency } : {}),
  });

  if (!result.ok) {
    console.error('[registration-request] create failed', result.reason);
    return jsonError(500, 'Submission failed');
  }

  return jsonOk();
}
