"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALL_DENIED, ALL_GRANTED } from "../config";
import { readConsentCookie, writeConsentCookie } from "../core/consent-storage";
import { pushConsentUpdate } from "../core/consent-mode";
import { getConsentCopy, type ConsentCopy } from "../locales";
import type { ConsentCategory, ConsentChoices, StoredConsent } from "../types";
import { ConsentBanner } from "./consent-banner";
import { ConsentPreferences } from "./consent-preferences";

export type ConsentContextValue = {
  /** null = no valid stored consent (first visit, expired, or version bump). */
  consent: StoredConsent | null;
  /** True for "necessary" always; otherwise the stored choice (false when unset). */
  isGranted: (category: ConsentCategory) => boolean;
  openPreferences: () => void;
  copy: ConsentCopy;
  locale: string;
};

export const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({
  locale,
  policyHref,
  active = true,
  children,
}: {
  locale: string;
  /** Localized privacy-policy URL from CMS siteSettings; omitted → no policy link in the banner. */
  policyHref?: string;
  /** When false (analytics disabled), context still mounts but no banner is shown. */
  active?: boolean;
  children: ReactNode;
}) {
  const [consent, setConsent] = useState<StoredConsent | null>(null);
  // Nothing renders until the cookie is read on the client — avoids any
  // SSR/hydration mismatch and any banner flash for consented visitors.
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    setConsent(readConsentCookie());
    setReady(true);
  }, []);

  const decide = useCallback((choices: ConsentChoices) => {
    const stored = writeConsentCookie(choices);
    pushConsentUpdate(choices);
    setConsent(stored);
    setPreferencesOpen(false);
  }, []);

  const acceptAll = useCallback(() => decide(ALL_GRANTED), [decide]);
  const rejectAll = useCallback(() => decide(ALL_DENIED), [decide]);
  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  const copy = useMemo(() => getConsentCopy(locale), [locale]);

  const isGranted = useCallback(
    (category: ConsentCategory) =>
      category === "necessary" ? true : (consent?.choices[category] ?? false),
    [consent],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({ consent, isGranted, openPreferences, copy, locale }),
    [consent, isGranted, openPreferences, copy, locale],
  );

  const showBanner = active && ready && consent === null && !preferencesOpen;

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {showBanner && (
        <ConsentBanner
          copy={copy}
          policyHref={policyHref}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCustomise={openPreferences}
        />
      )}
      {active && (
        <ConsentPreferences
          open={preferencesOpen}
          copy={copy}
          initialChoices={consent?.choices ?? ALL_DENIED}
          onSave={decide}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onClose={closePreferences}
        />
      )}
    </ConsentContext.Provider>
  );
}
