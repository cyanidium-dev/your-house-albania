import { describe, expect, it } from "vitest";
import {
  complexMentions,
  layoutFacts,
  orderForGrid,
  percentVsPlace,
  pickHeroListing,
  seaFacts,
  selectPartnerListings,
  stageFacts,
  summarizePartnerSelection,
  type PartnerListingRow,
} from "../facts";
import { PARTNER_LANDINGS, findPartnerLanding, partnerLandingForPlace, partnerLandingPath, siblingPartnerLandings } from "../config";

const flat = (over: Partial<PartnerListingRow> & { slug: string }): PartnerListingRow => ({
  price: 80000,
  priceUnit: "total",
  area: 60,
  bedrooms: 1,
  typeSlug: "apartment",
  constructionStage: "completed",
  seaDistanceMeters: 200,
  createdAt: "2026-10-08T00:00:00Z",
  locationLevel: "district",
  galleryCount: 5,
  textEn: "",
  ...over,
});

const plazh = findPartnerLanding("plazh-durres")!;
const tocak = findPartnerLanding("tocak-plazh-durres")!;

describe("config", () => {
  it("every landing has a unique slug and a path under partners/cactus", () => {
    const slugs = PARTNER_LANDINGS.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(partnerLandingPath("ru", plazh)).toBe("/ru/partners/cactus/plazh-durres");
  });

  it("a place resolves to its own landing, never to a complex page", () => {
    expect(partnerLandingForPlace({ city: "durres", district: "plazh" })?.slug).toBe("plazh-durres");
    expect(partnerLandingForPlace({ city: "shengjin" })?.slug).toBe("shengjin");
    expect(partnerLandingForPlace({ city: "durres", district: "currila" })).toBeNull();
    expect(partnerLandingForPlace({ city: "tirana" })).toBeNull();
  });

  it("siblings put the same city first and exclude the page itself", () => {
    const siblings = siblingPartnerLandings(findPartnerLanding("shengjin")!);
    expect(siblings.map((s) => s.slug)).not.toContain("shengjin");
    expect(siblings.length).toBe(PARTNER_LANDINGS.length - 1);
    const fromPlazh = siblingPartnerLandings(plazh).map((s) => s.place.city);
    expect(fromPlazh.at(-1)).toBe("shengjin");
  });
});

describe("selectPartnerListings", () => {
  it("keeps the place's rows on a place page and only the named complex on a complex page", () => {
    const rows = [
      flat({ slug: "a", textEn: "1+1 in the Tocak complex, Plazh" }),
      flat({ slug: "b", textEn: "2+1 near the Florida complex" }),
    ];
    expect(selectPartnerListings(rows, plazh).map((r) => r.slug)).toEqual(["a", "b"]);
    expect(selectPartnerListings(rows, tocak).map((r) => r.slug)).toEqual(["a"]);
  });
});

describe("layoutFacts", () => {
  it("groups by bedrooms, studios by type, and prints a median only over three flats", () => {
    const rows = [
      flat({ slug: "s", typeSlug: "studio", bedrooms: 0, area: 30, price: 45000 }),
      flat({ slug: "a", bedrooms: 1, area: 50, price: 70000 }),
      flat({ slug: "b", bedrooms: 1, area: 60, price: 90000 }),
      flat({ slug: "c", bedrooms: 1, area: 70, price: 98000 }),
      flat({ slug: "d", bedrooms: 2, area: 90, price: 120000 }),
      flat({ slug: "e", bedrooms: 4, area: 140, price: 200000 }),
    ];
    const layouts = layoutFacts(rows);
    expect(layouts.map((l) => l.layout)).toEqual(["studio", "1", "2", "3"]);
    const one = layouts[1];
    expect(one.count).toBe(3);
    expect(one.areaMin).toBe(50);
    expect(one.areaMax).toBe(70);
    expect(one.priceFrom).toBe(70000);
    expect(one.medianPricePerSqm).toBe(1400);
    expect(layouts[2].medianPricePerSqm).toBeNull();
  });

  it("leaves a per-m² rate out of the lowest total and a tiny area out of the ranges", () => {
    const rows = [
      flat({ slug: "a", price: 1300, priceUnit: "per-sqm" }),
      flat({ slug: "b", price: 60000, area: 10 }),
      flat({ slug: "c", price: 65000, area: 55 }),
    ];
    const [one] = layoutFacts(rows);
    expect(one.priceFrom).toBe(60000);
    expect(one.areaMin).toBe(55);
  });
});

describe("stageFacts and seaFacts", () => {
  it("counts stages and collects the handover years once each, ascending", () => {
    const stage = stageFacts([
      flat({ slug: "a" }),
      flat({ slug: "b", constructionStage: "under-construction", handoverYear: 2027 }),
      flat({ slug: "c", constructionStage: "off-plan", handoverYear: 2026 }),
      flat({ slug: "d", constructionStage: "under-construction", handoverYear: 2027 }),
      flat({ slug: "e", constructionStage: null }),
    ]);
    expect(stage).toEqual({ completed: 1, unfinished: 3, unknown: 1, handoverYears: [2026, 2027] });
  });

  it("needs three stated distances, treats beachfront without a figure as 0 m, ignores the rest", () => {
    expect(seaFacts([flat({ slug: "a" }), flat({ slug: "b", seaDistanceMeters: null })])).toBeNull();
    const sea = seaFacts([
      flat({ slug: "a", seaDistanceMeters: 100 }),
      flat({ slug: "b", seaDistanceMeters: 450 }),
      flat({ slug: "c", seaDistanceMeters: null, beachfront: true }),
      flat({ slug: "d", seaDistanceMeters: 1200 }),
      flat({ slug: "e", seaDistanceMeters: null }),
    ]);
    expect(sea).toEqual({ known: 4, within300: 2, within1000: 3, min: 0, median: 275 });
  });
});

describe("complexMentions", () => {
  it("names a complex two listings mention, most mentioned first, without the page's own", () => {
    const rows = [
      flat({ slug: "a", textEn: "in the Tocak complex" }),
      flat({ slug: "b", textEn: "Tocak, Plazh" }),
      flat({ slug: "c", textEn: "near the Florida complex" }),
      flat({ slug: "d", textEn: "near Hotel Florida" }),
      flat({ slug: "e", textEn: "Rotondo complex" }),
    ];
    expect(complexMentions(rows)).toEqual([
      { name: "Florida", count: 2 },
      { name: "Tocak", count: 2 },
    ]);
    expect(complexMentions(rows, tocak.complex)).toEqual([{ name: "Florida", count: 2 }]);
  });
});

describe("summarizePartnerSelection", () => {
  it("holds the medians back under three listings and reports the newest date", () => {
    const two = summarizePartnerSelection([flat({ slug: "a" }), flat({ slug: "b", createdAt: "2026-10-09T00:00:00Z" })], plazh);
    expect(two.count).toBe(2);
    expect(two.medianPricePerSqm).toBeNull();
    expect(two.priceFrom).toBe(80000);
    expect(two.newestAt).toBe("2026-10-09T00:00:00Z");
    const three = summarizePartnerSelection([flat({ slug: "a" }), flat({ slug: "b" }), flat({ slug: "c", price: 90000 })], plazh);
    expect(three.medianPricePerSqm).toBe(1333);
    expect(three.medianPrice).toBe(80000);
  });
});

describe("percentVsPlace, pickHeroListing, orderForGrid", () => {
  it("rounds the gap to the place median to a whole percent and signs it", () => {
    expect(percentVsPlace(1450, 1500)).toBe(-3);
    expect(percentVsPlace(1650, 1500)).toBe(10);
    expect(percentVsPlace(null, 1500)).toBeNull();
    expect(percentVsPlace(1500, 0)).toBeNull();
  });

  it("opens on a building-pinned listing with a wide photo and many pictures", () => {
    const rows = [
      flat({ slug: "narrow", locationLevel: "exact", galleryCount: 20, heroImageUrl: "https://cdn/x", heroImageWidth: 800 }),
      flat({ slug: "district", locationLevel: "district", galleryCount: 20, heroImageUrl: "https://cdn/y", heroImageWidth: 1600 }),
      flat({ slug: "exact", locationLevel: "exact", galleryCount: 3, heroImageUrl: "https://cdn/z", heroImageWidth: 1600 }),
    ];
    expect(pickHeroListing(rows)?.slug).toBe("exact");
    expect(pickHeroListing([flat({ slug: "none" })])).toBeNull();
  });

  it("orders priced building pins first, then by date, and cuts at the limit", () => {
    const rows = [
      flat({ slug: "old-district", createdAt: "2026-10-01T00:00:00Z" }),
      flat({ slug: "new-district", createdAt: "2026-10-09T00:00:00Z" }),
      flat({ slug: "exact-unpriced", locationLevel: "exact", price: 0, createdAt: "2026-10-09T00:00:00Z" }),
      flat({ slug: "exact", locationLevel: "exact", createdAt: "2026-10-02T00:00:00Z" }),
    ];
    expect(orderForGrid(rows, 3).map((r) => r.slug)).toEqual(["exact", "exact-unpriced", "new-district"]);
  });
});
