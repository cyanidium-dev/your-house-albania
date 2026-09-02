import { describe, it, expect } from "vitest";
import { buildBlogArticleJsonLd } from "../blogArticleJsonLd";

const BASE = {
  headline: "Rental investment in Durres",
  datePublished: "2026-03-10T00:00:00.000Z",
  articleUrl: "https://www.domlivo.com/en/blog/x",
  authorName: "Domlivo Editorial",
  publisherName: "Domlivo",
  publisherUrl: "https://www.domlivo.com",
};

describe("buildBlogArticleJsonLd", () => {
  it("carries dateModified when the document has been updated", () => {
    const a = buildBlogArticleJsonLd({ ...BASE, dateModified: "2026-08-23T10:00:00.000Z" }) as Record<string, unknown>;
    expect(a.dateModified).toBe("2026-08-23T10:00:00.000Z");
  });

  // A page with no recorded edit still needs the property; falling back to the
  // publish date is truthful and keeps the node complete.
  it("falls back to datePublished when there is no update stamp", () => {
    const a = buildBlogArticleJsonLd(BASE) as Record<string, unknown>;
    expect(a.dateModified).toBe(BASE.datePublished);
  });

  it("gives the author a url when the post links a blogAuthor", () => {
    const a = buildBlogArticleJsonLd({ ...BASE, authorSlug: "domlivo-editorial", locale: "en" }) as Record<string, unknown>;
    expect((a.author as Record<string, unknown>).url).toBe(
      "https://www.domlivo.com/en/blog/author/domlivo-editorial"
    );
  });

  // 12 of 17 posts carry only the legacy inline author fields. There is no
  // page to point at, so the Person node stays a bare name.
  it("omits author.url for a legacy inline author", () => {
    const a = buildBlogArticleJsonLd(BASE) as Record<string, unknown>;
    expect((a.author as Record<string, unknown>).url).toBeUndefined();
    expect((a.author as Record<string, unknown>).name).toBe("Domlivo Editorial");
  });

  it("keeps the existing shape otherwise", () => {
    const a = buildBlogArticleJsonLd(BASE) as Record<string, unknown>;
    expect(a["@type"]).toBe("Article");
    expect(a.url).toBe(BASE.articleUrl);
    expect((a.publisher as Record<string, unknown>).name).toBe("Domlivo");
  });
  // Six locales publish the same article at six URLs, so the language has to be
  // stated rather than inferred from the prose. The guide builder already did
  // this; blog posts were the inconsistent half.
  it("states the language when a locale is given", () => {
    const a = buildBlogArticleJsonLd({ ...BASE, locale: "pl" }) as Record<string, unknown>;
    expect(a.inLanguage).toBe("pl");
  });

  it("omits inLanguage rather than guessing when no locale is given", () => {
    const a = buildBlogArticleJsonLd(BASE) as Record<string, unknown>;
    expect(a.inLanguage).toBeUndefined();
  });

  it("anchors the article to its page via mainEntityOfPage", () => {
    const a = buildBlogArticleJsonLd(BASE) as Record<string, unknown>;
    expect(a.mainEntityOfPage).toEqual({ "@type": "WebPage", "@id": BASE.articleUrl });
  });
});
