import { describe, expect, it } from "vitest";
import { buildGuideArticleJsonLd } from "../guideArticleJsonLd";

const base = {
  headline: "Saranda vs Ksamil",
  articleUrl: "https://www.domlivo.com/en/guides/saranda-vs-ksamil",
  publisherName: "Domlivo",
  publisherUrl: "https://www.domlivo.com",
};

type Article = Record<string, unknown>;

describe("buildGuideArticleJsonLd", () => {
  it("builds an Article with both dates taken from the data", () => {
    const a = buildGuideArticleJsonLd({
      ...base,
      contentUpdatedAt: "2026-07-19",
      documentUpdatedAt: "2026-08-25T10:00:00Z",
    }) as Article;

    expect(a["@type"]).toBe("Article");
    expect(a.headline).toBe("Saranda vs Ksamil");
    expect(a.url).toBe(base.articleUrl);
    // The editor's review date is the published signal; `_updatedAt` is the
    // modification signal.
    expect(a.datePublished).toBe("2026-07-19");
    expect(a.dateModified).toBe("2026-08-25T10:00:00Z");
  });

  it("returns null when the document carries no date at all", () => {
    // Better no block than a fabricated freshness claim.
    expect(
      buildGuideArticleJsonLd({ ...base, contentUpdatedAt: null, documentUpdatedAt: null })
    ).toBeNull();
    expect(buildGuideArticleJsonLd({ ...base })).toBeNull();
  });

  it("ignores an unparseable date instead of passing it through", () => {
    expect(
      buildGuideArticleJsonLd({ ...base, contentUpdatedAt: "not a date", documentUpdatedAt: null })
    ).toBeNull();
  });

  it("falls back to the single date it has, for both fields", () => {
    const a = buildGuideArticleJsonLd({ ...base, contentUpdatedAt: "2026-07-19" }) as Article;
    expect(a.datePublished).toBe("2026-07-19");
    expect(a.dateModified).toBe("2026-07-19");
  });

  it("returns null without a headline", () => {
    expect(
      buildGuideArticleJsonLd({ ...base, headline: "   ", contentUpdatedAt: "2026-07-19" })
    ).toBeNull();
  });

  it("credits the organization, since landingPage has no author field", () => {
    const a = buildGuideArticleJsonLd({ ...base, contentUpdatedAt: "2026-07-19" }) as Article;
    expect(a.author).toEqual({
      "@type": "Organization",
      name: "Domlivo",
      url: "https://www.domlivo.com",
    });
    expect((a.publisher as Article)["@type"]).toBe("Organization");
  });

  it("resolves a relative image against the site origin", () => {
    const a = buildGuideArticleJsonLd({
      ...base,
      contentUpdatedAt: "2026-07-19",
      imageUrl: "/images/guide.jpg",
    }) as Article;
    expect(a.image).toBe("https://www.domlivo.com/images/guide.jpg");
  });

  it("keeps an absolute image URL as-is", () => {
    const a = buildGuideArticleJsonLd({
      ...base,
      contentUpdatedAt: "2026-07-19",
      imageUrl: "https://cdn.sanity.io/images/x.jpg",
    }) as Article;
    expect(a.image).toBe("https://cdn.sanity.io/images/x.jpg");
  });

  it("omits description and inLanguage when they are blank", () => {
    const a = buildGuideArticleJsonLd({
      ...base,
      contentUpdatedAt: "2026-07-19",
      description: "   ",
      locale: "  ",
    }) as Article;
    expect(a).not.toHaveProperty("description");
    expect(a).not.toHaveProperty("inLanguage");
  });

  it("emits description and inLanguage when supplied", () => {
    const a = buildGuideArticleJsonLd({
      ...base,
      contentUpdatedAt: "2026-07-19",
      description: "Which southern resort suits which buyer.",
      locale: "pl",
    }) as Article;
    expect(a.description).toBe("Which southern resort suits which buyer.");
    expect(a.inLanguage).toBe("pl");
  });
});
