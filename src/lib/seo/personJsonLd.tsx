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
  const links = (sameAs ?? []).filter((s) => typeof s === "string" && s.trim());
  if (links.length > 0) person.sameAs = links;
  return person;
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
