import { describe, expect, it } from "vitest";
import { isHeroQuality, sanityImageSize } from "../heroQuality";

const cdn = "https://cdn.sanity.io/images/g4aqp6ex/production/";

describe("hero quality", () => {
  it("reads the size Sanity puts in the URL, even with a vanity filename", () => {
    expect(sanityImageSize(`${cdn}0b1d-590x443.jpg/apartment-1-1-shengjin-1.jpg?w=1600`)).toEqual({ width: 590, height: 443 });
  });

  it("takes wide landscape photos only", () => {
    expect(isHeroQuality(`${cdn}165a-3200x2000.jpg`)).toBe(true);
    expect(isHeroQuality(`${cdn}0b1d-590x443.jpg`)).toBe(false);
    expect(isHeroQuality(`${cdn}09b0-1284x2283.jpg`)).toBe(false);
    expect(isHeroQuality(`${cdn}abcd-2000x2400.jpg`)).toBe(false);
  });

  it("refuses what it cannot measure", () => {
    expect(isHeroQuality("/images/albania/durres.jpg")).toBe(false);
    expect(isHeroQuality(null)).toBe(false);
  });
});
