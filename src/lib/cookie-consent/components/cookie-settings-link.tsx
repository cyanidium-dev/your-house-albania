"use client";

import { useConsent } from "../hooks/use-consent";
import { settingsLinkClass } from "../styles/classes";

/** Footer trigger that reopens the preferences dialog (GDPR: consent must be
 *  as easy to withdraw as it was to give). */
export function CookieSettingsLink() {
  const { openPreferences, copy } = useConsent();
  return (
    <button type="button" className={settingsLinkClass} onClick={openPreferences}>
      {copy.settingsLink}
    </button>
  );
}
