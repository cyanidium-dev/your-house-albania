import { describe, expect, it } from "vitest";
import { buildPersonJsonLd, isProfileUrl } from "../personJsonLd";

describe("isProfileUrl", () => {
  it("keeps profiles and drops chat, mail and phone links", () => {
    expect(isProfileUrl("https://www.linkedin.com/in/fedir-alpatov")).toBe(true);
    expect(isProfileUrl("https://www.wikidata.org/wiki/Q1")).toBe(true);
    expect(isProfileUrl("https://wa.me/message/KPXIGD5DJISGO1")).toBe(false);
    expect(isProfileUrl("https://t.me/real_estate_al")).toBe(false);
    expect(isProfileUrl("mailto:hello@domlivo.com")).toBe(false);
    expect(isProfileUrl("tel:+355693122813")).toBe(false);
  });
});

describe("buildPersonJsonLd", () => {
  it("emits sameAs with profiles only, and none when only messengers were given", () => {
    const withProfile = buildPersonJsonLd({
      name: "Fedir Alpatov",
      url: "https://www.domlivo.com/en/blog/author/fedir-alpatov",
      sameAs: ["https://t.me/real_estate_al", "https://www.linkedin.com/in/fedir-alpatov"],
    }) as Record<string, unknown>;
    expect(withProfile.sameAs).toEqual(["https://www.linkedin.com/in/fedir-alpatov"]);
    const onlyChat = buildPersonJsonLd({
      name: "Viktor Grinchenko",
      url: "https://www.domlivo.com/en/blog/author/viktor-grinchenko",
      sameAs: ["https://wa.me/message/KPXIGD5DJISGO1"],
    }) as Record<string, unknown>;
    expect(onlyChat.sameAs).toBeUndefined();
  });
});
