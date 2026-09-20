import { describe, expect, it } from "vitest";
import { buildAboutJsonLd } from "../aboutJsonLd";
import { buildOrganizationNode } from "../siteJsonLd";
import { TEAM_MEMBERS, teamMemberId } from "@/lib/about/team";

type Node = Record<string, unknown>;

const BASE_URL = "https://www.domlivo.com";

function build(locale: string): Node[] {
  const json = buildAboutJsonLd({
    baseUrl: BASE_URL,
    locale,
    title: "About Domlivo",
    description: "Who builds Domlivo.",
    people: TEAM_MEMBERS.map((m) => ({
      id: teamMemberId(BASE_URL, m.slug),
      name: m.name,
      image: m.photo,
      jobTitle: `role-${m.key}-${locale}`,
      sameAs: m.links.map((l) => l.href),
      knowsAbout: m.knowsAbout,
    })),
  }) as { "@graph": Node[] };
  return json["@graph"];
}

describe("buildAboutJsonLd", () => {
  it("emits an AboutPage about the sitewide Organization", () => {
    const [page] = build("en");
    expect(page["@type"]).toBe("AboutPage");
    expect(page.url).toBe("https://www.domlivo.com/en/about");
    expect(page.about).toEqual({ "@id": "https://www.domlivo.com/#organization" });
    expect(page.isPartOf).toEqual({ "@id": "https://www.domlivo.com/#website" });
    expect(page.inLanguage).toBe("en");
  });

  it("emits three Person nodes with an absolute photo, employer, profiles and topics", () => {
    const persons = build("en").slice(1);
    expect(persons).toHaveLength(3);
    for (const person of persons) {
      expect(person["@type"]).toBe("Person");
      expect(String(person.image)).toMatch(/^https:\/\/www\.domlivo\.com\/images\/team\/.+\.jpg$/);
      expect(person.worksFor).toEqual({ "@id": "https://www.domlivo.com/#organization" });
      expect((person.sameAs as string[]).length).toBeGreaterThan(0);
      expect((person.knowsAbout as string[]).length).toBeGreaterThan(0);
      expect(person.jobTitle).toBeTruthy();
    }
    const viktor = persons.find((p) => p.name === "Viktor Grinchenko")!;
    expect(viktor.sameAs).toEqual([
      "https://www.grinchenko-realestate.com",
      "https://t.me/real_estate_al",
      "https://www.instagram.com/grinchenko.realestate",
      "https://www.youtube.com/@grinchenko.realestate",
    ]);
  });

  // The Organization names its founders by @id on every page; those ids have
  // to be the ones this page defines, in every locale.
  it("uses the same Person ids as Organization.founder, whatever the locale", () => {
    const founders = (
      buildOrganizationNode({
        baseUrl: BASE_URL,
        founders: TEAM_MEMBERS.map((m) => ({ id: teamMemberId(BASE_URL, m.slug), name: m.name })),
      }).founder as Node[]
    ).map((f) => f["@id"]);
    for (const locale of ["en", "sq", "de"]) {
      expect(build(locale).slice(1).map((p) => p["@id"])).toEqual(founders);
    }
  });
});
