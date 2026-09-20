/**
 * The founders, as data.
 *
 * Names, photographs and profile links are facts and live here; everything a
 * reader sees in a sentence (role, bio) is copy and lives in `messages/*.json`
 * under `About.team.members.{key}`.
 *
 * `personId` is locale-independent on purpose: the Organization node that the
 * layout emits on every page lists the founders by `@id`, and /about in each
 * locale describes the same three people under the same ids.
 */
export type TeamMemberKey = "fedir" | "viktor" | "diana";

export type TeamMemberLink = {
  /** Key under `About.team.links`. */
  labelKey: "codeSite" | "codeSiteProfile" | "agency" | "telegram" | "instagram" | "youtube";
  href: string;
};

export type TeamMember = {
  key: TeamMemberKey;
  /** Fragment of the stable `@id`. */
  slug: string;
  name: string;
  /** Path under /public. */
  photo: string;
  /** Intrinsic pixel size of the square photograph; the card never renders larger. */
  photoSize: number;
  links: TeamMemberLink[];
  /** schema.org `knowsAbout`, in English: it names topics, not prose. */
  knowsAbout: string[];
};

export const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    key: "fedir",
    slug: "fedir-alpatov",
    name: "Fedir Alpatov",
    photo: "/images/team/fedir-alpatov.jpg",
    photoSize: 900,
    links: [{ labelKey: "codeSite", href: "https://www.code-site.art" }],
    knowsAbout: ["Real estate market analysis", "Web development", "Digital marketing"],
  },
  {
    key: "viktor",
    slug: "viktor-grinchenko",
    name: "Viktor Grinchenko",
    photo: "/images/team/viktor-grinchenko.jpg",
    photoSize: 900,
    links: [
      { labelKey: "agency", href: "https://www.grinchenko-realestate.com" },
      { labelKey: "telegram", href: "https://t.me/real_estate_al" },
      { labelKey: "instagram", href: "https://www.instagram.com/grinchenko.realestate" },
      { labelKey: "youtube", href: "https://www.youtube.com/@grinchenko.realestate" },
    ],
    knowsAbout: [
      "Real estate in Albania",
      "Buying property in Albania as a foreigner",
      "Property rental in Albania",
    ],
  },
  {
    key: "diana",
    slug: "diana-merkotun",
    name: "Diana Merkotun",
    photo: "/images/team/diana-merkotun.jpg",
    photoSize: 256,
    links: [{ labelKey: "codeSiteProfile", href: "https://www.code-site.art/en/about" }],
    knowsAbout: ["Web design", "User experience", "Conversion rate optimisation"],
  },
] as const;

/** Stable, locale-independent `@id` of a founder's Person node. */
export function teamMemberId(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/$/, "")}/#person-${slug}`;
}
