import { describe, expect, it } from "vitest";
import { detectUnservedPlaces, unservedPlacesNote } from "./unservedPlaces";

describe("detectUnservedPlaces", () => {
  it("reads the town out of the sentence that started this", () => {
    expect(detectUnservedPlaces("Ищу квартиру 2+1 не менее 70 метров в Корче")).toEqual(["Korçë"]);
  });

  it("matches Latin, Albanian and Ukrainian spellings", () => {
    expect(detectUnservedPlaces("apartament ne Korce")).toEqual(["Korçë"]);
    expect(detectUnservedPlaces("Kërkoj shtëpi në Berat")).toEqual(["Berat"]);
    expect(detectUnservedPlaces("квартира в Ксамілі")).toEqual(["Ksamil"]);
    expect(detectUnservedPlaces("квартира в Ксамиле")).toEqual(["Ksamil"]);
    expect(detectUnservedPlaces("house in Himara")).toEqual(["Himarë"]);
  });

  it("keeps the order the visitor wrote them in", () => {
    expect(detectUnservedPlaces("Berat or Korce, maybe Ksamil")).toEqual(["Berat", "Korçë", "Ksamil"]);
  });

  it("says nothing about cities we do sell in", () => {
    for (const msg of ["квартира в Дурресе", "apartment in Vlore", "2+1 Sarande", "Tirana penthouse", "Shengjin"]) {
      expect(detectUnservedPlaces(msg)).toEqual([]);
    }
  });

  it("does not fire on a longer word that contains a town", () => {
    expect(detectUnservedPlaces("beratene fieriana korcexyz")).toEqual([]);
  });

  it("builds a note only when there is something to say", () => {
    expect(unservedPlacesNote("квартира у моря в Дурресе")).toBeNull();
    expect(unservedPlacesNote("дом в Берате")).toContain("Berat");
  });
});
