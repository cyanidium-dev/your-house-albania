/**
 * Whether a blog byline stands for the team rather than for a person.
 *
 * "Domlivo Editorial" is a `blogAuthor` document in the CMS because every post
 * needs an author reference, but it is not a human being, so structured data
 * types it as an Organization. Matched on the slug the CMS gives it and, for
 * the legacy posts that carry only an inline author name, on the brand prefix.
 */
const EDITORIAL_SLUGS = new Set(["domlivo-editorial", "domlivo"]);

export function isEditorialTeamAuthor(author: {
  name?: string | null;
  slug?: string | null;
}): boolean {
  const slug = (author.slug ?? "").trim().toLowerCase();
  if (slug && EDITORIAL_SLUGS.has(slug)) return true;
  const name = (author.name ?? "").trim().toLowerCase();
  return /^domlivo(\s|$)/.test(name);
}
