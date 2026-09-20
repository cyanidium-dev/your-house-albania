/**
 * JSON-LD for `/[locale]/about`: an AboutPage about the Organization, plus one
 * Person node per founder.
 *
 * The Person `@id`s are the ones the sitewide Organization lists under
 * `founder`, and each Person points back with `worksFor`, so the two halves of
 * the relationship resolve on this page. Names, photographs and profile links
 * are the same in every locale; only `jobTitle` and `description` are
 * translated.
 */
import { organizationId, websiteId } from "./siteJsonLd";

export type AboutPersonInput = {
  /** Stable, locale-independent `@id`. */
  id: string;
  name: string;
  /** Site-relative or absolute photograph URL. */
  image: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
  knowsAbout?: string[];
};

export type AboutJsonLdInput = {
  baseUrl: string;
  locale: string;
  title: string;
  description?: string;
  people: AboutPersonInput[];
};

function abs(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = baseUrl.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

export function buildAboutJsonLd(input: AboutJsonLdInput): object {
  const { baseUrl, locale, title, description, people } = input;
  const pageUrl = abs(baseUrl, `/${locale}/about`);
  const orgId = organizationId(baseUrl);

  const persons = people.map((p) => {
    const sameAs = (p.sameAs ?? []).filter((u) => typeof u === "string" && u.trim());
    const knowsAbout = (p.knowsAbout ?? []).filter((k) => typeof k === "string" && k.trim());
    return {
      "@type": "Person",
      "@id": p.id,
      name: p.name,
      url: pageUrl,
      image: abs(baseUrl, p.image),
      ...(p.jobTitle?.trim() ? { jobTitle: p.jobTitle.trim() } : {}),
      ...(p.description?.trim() ? { description: p.description.trim() } : {}),
      worksFor: { "@id": orgId },
      ...(sameAs.length > 0 ? { sameAs } : {}),
      ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
    };
  });

  const page = {
    "@type": "AboutPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    ...(description?.trim() ? { description: description.trim() } : {}),
    inLanguage: locale,
    isPartOf: { "@id": websiteId(baseUrl) },
    about: { "@id": orgId },
    mainEntity: { "@id": orgId },
    mentions: persons.map((p) => ({ "@id": p["@id"] })),
  };

  return { "@context": "https://schema.org", "@graph": [page, ...persons] };
}
