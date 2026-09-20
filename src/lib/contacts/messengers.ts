/**
 * Which messenger links the site offers, and in what order.
 *
 * Source of truth is the CMS (`siteSettings.socialLinks[]`); the business links
 * in `businessContacts.ts` fill in for a messenger the CMS does not list, so a
 * page never loses its WhatsApp or Telegram button to an empty field.
 */

import { BUSINESS_TELEGRAM_URL, BUSINESS_WHATSAPP_URL } from "./businessContacts";
import { partitionSocialLinks, type SocialLinkInput } from "@/lib/footer/socialChannels";
import { classifyContactHref } from "@/lib/leads/types";

export type MessengerKey = "whatsapp" | "telegram";

export type MessengerLink = { key: MessengerKey; url: string };

/** Display names; brand names are not translated. */
export const MESSENGER_NAME: Record<MessengerKey, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export const MESSENGER_ICON: Record<MessengerKey, string> = {
  whatsapp: "ph:whatsapp-logo",
  telegram: "ph:telegram-logo",
};

const BUSINESS_URL: Record<MessengerKey, string> = {
  whatsapp: BUSINESS_WHATSAPP_URL,
  telegram: BUSINESS_TELEGRAM_URL,
};

/**
 * CMS values the owners' links replace (2026-09-20): the WhatsApp entry is the
 * site developer's personal number and the Telegram entry is a bot, neither of
 * which a buyer should be sent to. Compared without scheme, `www.` or a
 * trailing slash. Delete an entry here once `socialLinks` is corrected in the
 * Studio — after that the CMS value simply wins, as the rule above says.
 */
const SUPERSEDED_CMS_URLS = new Set(["wa.me/355689286136", "t.me/domlivobot"]);

function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#]+$/, "");
}

/** Which messenger a link opens, judged by its URL first and its platform name second. */
export function messengerKeyOf(link: { platform?: string; url: string }): MessengerKey | null {
  const byUrl = classifyContactHref(link.url);
  if (byUrl === "click_whatsapp") return "whatsapp";
  if (byUrl === "click_telegram") return "telegram";
  if (!/^https?:\/\//i.test(link.url.trim())) return null;
  const platform = (link.platform ?? "").trim().toLowerCase();
  if (platform.includes("whatsapp")) return "whatsapp";
  if (platform.includes("telegram")) return "telegram";
  return null;
}

/**
 * Russian and Ukrainian speakers live in Telegram; everyone else this site
 * serves (Albanian, English, Italian, Polish, German) reaches for WhatsApp.
 */
export function messengerOrder(locale: string): MessengerKey[] {
  return locale === "ru" || locale === "uk" ? ["telegram", "whatsapp"] : ["whatsapp", "telegram"];
}

function cmsMessengerUrl(links: SocialLinkInput[] | undefined, key: MessengerKey): string {
  const { contact, social } = partitionSocialLinks(links);
  const usable = (l: { platform: string; url: string }) =>
    messengerKeyOf(l) === key && !SUPERSEDED_CMS_URLS.has(normalizeUrl(l.url));
  // Contact-channel entries win; a link left on the default channel still counts.
  return (contact.find(usable) ?? social.find(usable))?.url ?? "";
}

/** Both messengers, in the visitor's order: the CMS link when there is one, else the business link. */
export function resolveMessengers(
  links: SocialLinkInput[] | undefined,
  locale: string,
): MessengerLink[] {
  return messengerOrder(locale).map((key) => ({
    key,
    url: cmsMessengerUrl(links, key) || BUSINESS_URL[key],
  }));
}

/** The links that are not messengers (Instagram, LinkedIn, …), for a "follow us" list. */
export function nonMessengerLinks<T extends { platform: string; url: string }>(links: T[]): T[] {
  return links.filter((l) => messengerKeyOf(l) === null);
}
