/** Consent categories shown in the preferences UI. */
export type ConsentCategory = "necessary" | "functional" | "analytics" | "marketing";

/** Categories the visitor can toggle — "necessary" is always granted and not stored. */
export type TogglableCategory = Exclude<ConsentCategory, "necessary">;

export type ConsentChoices = Record<TogglableCategory, boolean>;

/** JSON payload persisted in the first-party consent cookie — the consent record. */
export type StoredConsent = {
  /** Schema/consent version; bump CONSENT_VERSION in config.ts to force re-consent. */
  v: number;
  /** ISO-8601 timestamp of the choice. */
  ts: string;
  choices: ConsentChoices;
};

/** Google Consent Mode v2 signal names. */
export type GcmSignal =
  | "ad_storage"
  | "ad_user_data"
  | "ad_personalization"
  | "analytics_storage"
  | "functionality_storage"
  | "personalization_storage"
  | "security_storage";

export type GcmState = Record<GcmSignal, "granted" | "denied">;
