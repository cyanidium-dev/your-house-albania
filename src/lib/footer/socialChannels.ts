/**
 * One source for footer social/contact links.
 *
 * Direct-contact channels (Telegram, WhatsApp) used to live in their own
 * `siteSettings` string fields while everything else lived in `socialLinks[]`.
 * They are entries in `socialLinks[]` now, carrying `channel: 'contact'`; the
 * legacy fields were migrated and removed on 2026-08-22
 * (`cms/scripts/migrateAuditRound1.ts`).
 */

export type SocialLinkInput = {
  platform: string;
  url: string;
  channel?: string;
};

export type FooterSocialLink = {
  platform: string;
  url: string;
};

const CONTACT = "contact";

function clean(list: SocialLinkInput[] | undefined): SocialLinkInput[] {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (l) => l && typeof l.platform === "string" && l.platform.trim() && typeof l.url === "string" && l.url.trim(),
  );
}

/**
 * Splits links into the footer's two columns.
 *
 * `channel === 'contact'` → Contacts column; anything else, including a missing
 * channel, → Social column. Treating a missing channel as social matches the
 * schema default, so a link added without touching the field lands where an
 * editor would expect.
 */
export function partitionSocialLinks(
  links: SocialLinkInput[] | undefined,
): { contact: FooterSocialLink[]; social: FooterSocialLink[] } {
  const all = clean(links);
  const map = (l: SocialLinkInput): FooterSocialLink => ({
    platform: l.platform.trim(),
    url: l.url.trim(),
  });
  return {
    contact: all.filter((l) => l.channel === CONTACT).map(map),
    social: all.filter((l) => l.channel !== CONTACT).map(map),
  };
}

/** Translation key for a contact-channel row, e.g. `Telegram` → `contacts.telegram`. */
export function contactLabelKey(platform: string): string {
  return `contacts.${platform.trim().toLowerCase()}`;
}
