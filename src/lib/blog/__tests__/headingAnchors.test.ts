import { describe, it, expect } from "vitest";
import { anchorSlug, collectHeadings } from "../headingAnchors";

describe("anchorSlug", () => {
  it("lowercases and hyphenates Latin text", () => {
    expect(anchorSlug("Best Areas to Buy")).toBe("best-areas-to-buy");
  });

  // An ASCII slugifier returns "" here, so every Russian heading would
  // collide on the same empty anchor. Four of five locales are affected.
  it("keeps Cyrillic", () => {
    expect(anchorSlug("Цены на квартиры")).toBe("цены-на-квартиры");
  });

  it("keeps Albanian diacritics", () => {
    expect(anchorSlug("Çmimet në Vlorë")).toBe("çmimet-në-vlorë");
  });

  it("collapses punctuation runs and trims hyphens", () => {
    expect(anchorSlug("  What — really?! ")).toBe("what-really");
  });

  it("keeps digits", () => {
    expect(anchorSlug("Prices in 2026")).toBe("prices-in-2026");
  });

  it("returns an empty string for text with no letters or digits", () => {
    expect(anchorSlug("—?!")).toBe("");
  });
});

describe("collectHeadings", () => {
  const h = (style: string, text: string) => ({
    _type: "block",
    _key: text,
    style,
    children: [{ _type: "span", text, marks: [] }],
  });

  it("collects h2 and h3 in order and ignores everything else", () => {
    const out = collectHeadings([
      h("h2", "One"),
      h("normal", "body"),
      h("h3", "Two"),
      h("h4", "Skip"),
      h("h1", "Also skip"),
    ]);
    expect(out).toEqual([
      { id: "one", text: "One", level: 2 },
      { id: "two", text: "Two", level: 3 },
    ]);
  });

  it("disambiguates repeated headings in document order", () => {
    const out = collectHeadings([h("h2", "Prices"), h("h2", "Prices"), h("h2", "Prices")]);
    expect(out.map((x) => x.id)).toEqual(["prices", "prices-2", "prices-3"]);
  });

  it("drops a heading with no sluggable text", () => {
    expect(collectHeadings([h("h2", "—")])).toEqual([]);
  });

  it("joins multi-span heading text", () => {
    const block = {
      _type: "block",
      _key: "k",
      style: "h2",
      children: [
        { _type: "span", text: "Two ", marks: [] },
        { _type: "span", text: "spans", marks: [] },
      ],
    };
    expect(collectHeadings([block])[0]).toEqual({ id: "two-spans", text: "Two spans", level: 2 });
  });

  it("survives an empty or malformed list", () => {
    expect(collectHeadings([])).toEqual([]);
    expect(collectHeadings([{ _type: "image" }, null as unknown as object])).toEqual([]);
  });
});
