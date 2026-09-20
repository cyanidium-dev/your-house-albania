import { describe, expect, it } from "vitest";
import { resolveListingFaqItems } from "../listingFaq";

const block = (text: string) => [{ _type: "block", children: [{ _type: "span", text }] }];

describe("resolveListingFaqItems", () => {
  const items = [
    { _key: "a", question: { en: "Q1", pl: "P1" }, answer: { en: block("A1"), pl: block("O1") } },
    { _key: "b", question: { en: "Q2" }, answer: { en: "Plain answer" } },
    { question: { en: "Q3", pl: "P3" }, answer: { en: block("A3"), pl: [] } },
  ];

  it("keeps rich and plain answers written in the locale", () => {
    const en = resolveListingFaqItems(items, "en");
    expect(en.map((i) => i.question)).toEqual(["Q1", "Q2", "Q3"]);
    expect(en[1].answer).toBe("Plain answer");
    expect(Array.isArray(en[0].answer)).toBe(true);
    expect(en[2].key).toBe("faq-2");
  });

  it("drops an item rather than fall back to English", () => {
    expect(resolveListingFaqItems(items, "pl").map((i) => i.question)).toEqual(["P1"]);
    expect(resolveListingFaqItems(items, "de")).toEqual([]);
  });
});
