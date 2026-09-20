import { describe, expect, it } from "vitest";
import {
  buildOrganizationNode,
  buildSiteJsonLd,
  organizationId,
  publishablePhone,
  websiteId,
  type SiteJsonLdInput,
} from "../siteJsonLd";

type Node = Record<string, unknown>;

const BASE: SiteJsonLdInput = {
  baseUrl: "https://www.domlivo.com",
  logoUrl: "https://cdn.sanity.io/images/x/production/logo.svg",
  email: "hello@domlivo.com",
  languages: ["en", "uk", "ru", "sq", "it", "pl", "de"],
  messengers: [
    { name: "WhatsApp", url: "https://wa.me/message/KPXIGD5DJISGO1" },
    { name: "Telegram", url: "https://t.me/real_estate_al" },
  ],
  founders: [
    { id: "https://www.domlivo.com/#person-fedir-alpatov", name: "Fedir Alpatov" },
    { id: "https://www.domlivo.com/#person-viktor-grinchenko", name: "Viktor Grinchenko" },
    { id: "https://www.domlivo.com/#person-diana-merkotun", name: "Diana Merkotun" },
  ],
};

function graph(input: SiteJsonLdInput): Node[] {
  return (buildSiteJsonLd(input) as { "@graph": Node[] })["@graph"];
}

describe("site JSON-LD ids", () => {
  it("are the same with and without a trailing slash on the origin", () => {
    expect(organizationId("https://www.domlivo.com")).toBe("https://www.domlivo.com/#organization");
    expect(organizationId("https://www.domlivo.com/")).toBe("https://www.domlivo.com/#organization");
    expect(websiteId("https://www.domlivo.com/")).toBe("https://www.domlivo.com/#website");
  });
});

describe("buildSiteJsonLd", () => {
  it("emits one Organization and one WebSite that publishes through it", () => {
    const [org, site] = graph(BASE);
    expect(org["@type"]).toBe("Organization");
    expect(org["@id"]).toBe("https://www.domlivo.com/#organization");
    expect(site["@type"]).toBe("WebSite");
    expect(site["@id"]).toBe("https://www.domlivo.com/#website");
    expect(site.publisher).toEqual({ "@id": org["@id"] });
  });

  // The layout renders this on every URL of every locale. Anything that varied
  // by locale would make seven disagreeing copies of one entity.
  it("builds an Organization that does not depend on the locale", () => {
    const en = graph({ ...BASE, searchUrlTemplate: "/en/catalog?q={search_term_string}" });
    const sq = graph({ ...BASE, searchUrlTemplate: "/sq/catalog?q={search_term_string}" });
    expect(en[0]).toEqual(sq[0]);
    expect(en[1]["@id"]).toBe(sq[1]["@id"]);
    expect(en[1].url).toBe(sq[1].url);
  });

  it("states who founded it, where it works and which languages it speaks", () => {
    const org = buildOrganizationNode(BASE);
    expect(org.areaServed).toEqual({ "@type": "Country", name: "Albania" });
    expect(org.knowsLanguage).toEqual(BASE.languages);
    expect(org.founder).toEqual(
      BASE.founders!.map((f) => ({ "@type": "Person", "@id": f.id, name: f.name }))
    );
  });

  it("keeps the email and lists the messengers as contact points by url", () => {
    const org = buildOrganizationNode(BASE);
    expect(org.email).toBe("hello@domlivo.com");
    const points = org.contactPoint as Node[];
    expect(points).toHaveLength(3);
    expect(points[0].email).toBe("hello@domlivo.com");
    expect(points.map((p) => p.url).filter(Boolean)).toEqual([
      "https://wa.me/message/KPXIGD5DJISGO1",
      "https://t.me/real_estate_al",
    ]);
  });

  it("publishes a real CMS phone number", () => {
    const org = buildOrganizationNode({ ...BASE, telephone: " +355 68 123 4567 " });
    expect(org.telephone).toBe("+355 68 123 4567");
    expect((org.contactPoint as Node[])[0].telephone).toBe("+355 68 123 4567");
  });

  // The CMS was seeded with a number that reaches nobody.
  it("never publishes the placeholder phone number, however it is spaced", () => {
    for (const telephone of ["+355 69 000 0000", "+355690000000", "355 69 000 00 00", "", undefined]) {
      const org = buildOrganizationNode({ ...BASE, telephone });
      expect(org.telephone).toBeUndefined();
      expect(JSON.stringify(org)).not.toContain("telephone");
    }
  });

  it("omits what it was not given rather than emitting empty values", () => {
    const org = buildOrganizationNode({ baseUrl: "https://www.domlivo.com" });
    for (const key of ["logo", "email", "telephone", "founder", "contactPoint", "sameAs", "knowsLanguage"]) {
      expect(org).not.toHaveProperty(key);
    }
  });
});

describe("publishablePhone", () => {
  it("returns the trimmed number, or undefined for a blank or placeholder", () => {
    expect(publishablePhone(" +355 68 123 4567")).toBe("+355 68 123 4567");
    expect(publishablePhone("+355 69 000 0000")).toBeUndefined();
    expect(publishablePhone(null)).toBeUndefined();
  });
});
