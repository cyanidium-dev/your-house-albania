/**
 * JSON-LD for `/[locale]/contacts`: a ContactPage whose main entity is the
 * sitewide Organization (audit 2026-10-18, S-17).
 *
 * The contact details themselves — email, messengers, a phone once the owner
 * publishes one — live on the Organization node the layout emits on every page,
 * so this page only says what it is and points at it by `@id`.
 */
import { organizationId, websiteId } from "./siteJsonLd";

export type ContactPageJsonLdInput = {
  baseUrl: string;
  locale: string;
  title: string;
  description?: string;
};

export function buildContactPageJsonLd(input: ContactPageJsonLdInput): object {
  const { baseUrl, locale, title, description } = input;
  const pageUrl = `${baseUrl.replace(/\/$/, "")}/${locale}/contacts`;
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    ...(description?.trim() ? { description: description.trim() } : {}),
    inLanguage: locale,
    isPartOf: { "@id": websiteId(baseUrl) },
    about: { "@id": organizationId(baseUrl) },
    mainEntity: { "@id": organizationId(baseUrl) },
  };
}
