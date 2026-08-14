import { routing } from "@/i18n/routing";

import { consentCopyEn, type ConsentCopy } from "./en/consent";
import { consentCopyUk } from "./uk/consent";
import { consentCopyRu } from "./ru/consent";
import { consentCopySq } from "./sq/consent";
import { consentCopyIt } from "./it/consent";

export type { ConsentCopy };

type Locale = (typeof routing.locales)[number];

const COPY: Record<Locale, ConsentCopy> = {
  en: consentCopyEn,
  uk: consentCopyUk,
  ru: consentCopyRu,
  sq: consentCopySq,
  it: consentCopyIt,
};

/** Locale → copy; default-locale copy for unknown locale strings. */
export function getConsentCopy(locale: string): ConsentCopy {
  const l = (routing.locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : routing.defaultLocale;
  return COPY[l];
}
