/**
 * The Person node for a founder who signs or checks an article.
 *
 * Articles are bylined by the founders listed on /about. The layout already
 * emits each of them as a Person with a stable `@id`; an article that names
 * one of them repeats that `@id` so the two nodes are one entity, and carries
 * the same profile links. Returns `null` for any other author slug.
 */
import { TEAM_MEMBERS, teamMemberId } from "@/lib/about/team";

export function teamPersonNode(
  baseUrl: string,
  authorSlug: string,
  locale?: string
): Record<string, unknown> | null {
  const member = TEAM_MEMBERS.find((m) => m.slug === authorSlug.trim().toLowerCase());
  if (!member) return null;
  const base = baseUrl.replace(/\/$/, "");
  const node: Record<string, unknown> = {
    "@type": "Person",
    "@id": teamMemberId(base, member.slug),
    name: member.name,
    image: `${base}${member.photo}`,
  };
  if (locale) node.url = `${base}/${locale}/about`;
  if (member.links.length) node.sameAs = member.links.map((l) => l.href);
  return node;
}
