/**
 * One source for footer social/contact links.
 *
 * Direct-contact channels (Telegram, WhatsApp) used to live in their own
 * `siteSettings` string fields while everything else lived in `socialLinks[]`.
 * They are now entries in `socialLinks[]` carrying `channel: 'contact'`.
 *
 * The legacy fields are still read as a fallback so the footer renders
 * identically before the data migration runs; once it has, they can be deleted
 * from the schema and this fallback removed.
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

export type LegacyContactUrls = {
  telegramUrl?: string;
  whatsappUrl?: string;
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
 * `channel === 'contact'` → Contacts column; anything else (including a missing
 * channel, which is the pre-migration state) → Social column.
 *
 * When no entry is marked as a contact channel, the legacy Telegram/WhatsApp
 * URLs are synthesised into the contacts list so the rendered output is
 * unchanged for a dataset that has not been migrated yet.
 */
export function partitionSocialLinks(
  links: SocialLinkInput[] | undefined,
  legacy: LegacyContactUrls = {},
): { contact: FooterSocialLink[]; social: FooterSocialLink[] } {
  const all = clean(links);

  const contact: FooterSocialLink[] = all
    .filter((l) => l.channel === CONTACT)
    .map((l) => ({ platform: l.platform.trim(), url: l.url.trim() }));

  const social: FooterSocialLink[] = all
    .filter((l) => l.channel !== CONTACT)
    .map((l) => ({ platform: l.platform.trim(), url: l.url.trim() }));

  if (contact.length === 0) {
    const telegram = legacy.telegramUrl?.trim();
    const whatsapp = legacy.whatsappUrl?.trim();
    if (telegram) contact.push({ platform: "Telegram", url: telegram });
    if (whatsapp) contact.push({ platform: "WhatsApp", url: whatsapp });
  }

  return { contact, social };
}

/** Translation key for a contact-channel row, e.g. `Telegram` → `contacts.telegram`. */
export function contactLabelKey(platform: string): string {
  return `contacts.${platform.trim().toLowerCase()}`;
}
