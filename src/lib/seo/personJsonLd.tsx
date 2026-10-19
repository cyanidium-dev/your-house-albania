/**
 * Person JSON-LD for a blog author page.
 *
 * Element 6 of the AEO formula is an identifiable author. A Person node that
 * carries only a name says nothing an assistant can weigh, so this emits the
 * page url, the photo and the social profiles when they exist — and omits
 * each cleanly when they do not, rather than shipping empty strings.
 */
export type PersonJsonLdInput = {
  name: string;
  url: string;
  imageUrl?: string;
  jobTitle?: string;
  sameAs?: string[];
  description?: string;
  /**
   * `Organization` for a byline that stands for the team ("Domlivo
   * Editorial"): the author page still exists, but it must not claim a human.
   */
  entityType?: "Person" | "Organization";
  /** `@id` of the employer (Person) or parent (Organization) node. */
  organizationId?: string;
};

export function buildPersonJsonLd(input: PersonJsonLdInput): object {
  const { name, url, imageUrl, jobTitle, sameAs, description, organizationId } = input;
  const isOrganization = input.entityType === "Organization";
  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": isOrganization ? "Organization" : "Person",
    name: name || "Author",
    url,
  };
  if (imageUrl) person[isOrganization ? "logo" : "image"] = imageUrl;
  // `jobTitle` is a Person property; an Organization has none.
  if (!isOrganization && jobTitle && jobTitle.trim()) person.jobTitle = jobTitle.trim();
  if (organizationId) {
    person[isOrganization ? "parentOrganization" : "worksFor"] = { "@id": organizationId };
  }
  if (description && description.trim()) person.description = description.trim();
  const links = (sameAs ?? []).filter((s) => typeof s === "string" && s.trim() && isProfileUrl(s));
  if (links.length > 0) person.sameAs = links;
  return person;
}

/** Messenger, mail and phone links open a chat; they are not another page about the entity. */
const NOT_A_PROFILE = /^(mailto:|tel:|viber:|https?:\/\/(www\.)?(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|t\.me|telegram\.me)\/)/i;

/**
 * `sameAs` is for pages that identify the same entity elsewhere (a LinkedIn
 * profile, Wikidata, a verified social account). The CMS "social links" of an
 * author also hold the WhatsApp and Telegram contacts, which told a crawler
 * that a founder "is" the company's chat line (brand-entity review 2026-10-19).
 */
export function isProfileUrl(url: string): boolean {
  return !NOT_A_PROFILE.test(url.trim());
}

export function PersonJsonLd(props: PersonJsonLdInput) {
  const jsonLd = buildPersonJsonLd(props);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
