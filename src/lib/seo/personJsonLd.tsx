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
};

export function buildPersonJsonLd(input: PersonJsonLdInput): object {
  const { name, url, imageUrl, jobTitle, sameAs, description } = input;
  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: name || "Author",
    url,
  };
  if (imageUrl) person.image = imageUrl;
  if (jobTitle && jobTitle.trim()) person.jobTitle = jobTitle.trim();
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
