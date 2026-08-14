import { CONSENT_COOKIE, CONSENT_TTL_DAYS, CONSENT_VERSION } from "../config";
import type { ConsentChoices, StoredConsent } from "../types";

/** Pure: raw cookie value → validated consent record, or null (→ show banner). */
export function parseStoredConsent(raw: string | null | undefined): StoredConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as {
      v?: unknown;
      ts?: unknown;
      choices?: Record<string, unknown>;
    };
    if (parsed.v !== CONSENT_VERSION) return null;
    const c = parsed.choices;
    if (
      !c ||
      typeof c.functional !== "boolean" ||
      typeof c.analytics !== "boolean" ||
      typeof c.marketing !== "boolean"
    ) {
      return null;
    }
    return {
      v: CONSENT_VERSION,
      ts: typeof parsed.ts === "string" ? parsed.ts : "",
      choices: { functional: c.functional, analytics: c.analytics, marketing: c.marketing },
    };
  } catch {
    return null;
  }
}

/** Pure: choices → URL-encoded cookie value. `now` injected for testability. */
export function serializeStoredConsent(choices: ConsentChoices, now: Date): string {
  const value: StoredConsent = { v: CONSENT_VERSION, ts: now.toISOString(), choices };
  return encodeURIComponent(JSON.stringify(value));
}

/** DOM: read the consent cookie. Returns null outside the browser. */
export function readConsentCookie(): StoredConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return parseStoredConsent(match ? match[1] : null);
}

/**
 * DOM: persist the choice. `Secure` is applied only on HTTPS so the banner
 * remains fully testable on plain-HTTP localhost.
 */
export function writeConsentCookie(choices: ConsentChoices): StoredConsent {
  const now = new Date();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CONSENT_COOKIE}=${serializeStoredConsent(choices, now)}` +
    `; max-age=${CONSENT_TTL_DAYS * 86400}; path=/; SameSite=Lax${secure}`;
  return { v: CONSENT_VERSION, ts: now.toISOString(), choices };
}
