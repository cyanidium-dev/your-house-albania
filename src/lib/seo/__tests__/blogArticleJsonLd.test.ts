import { describe, it, expect } from "vitest";
import { buildBlogArticleJsonLd } from "../blogArticleJsonLd";

const BASE = {
  headline: "Rental investment in Durres",
  datePublished: "2026-03-10T00:00:00.000Z",
  articleUrl: "https://www.domlivo.com/en/blog/x",
  authorName: "Anna Example",
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
    const a = buildBlogArticleJsonLd({ ...BASE, authorSlug: "anna-example", locale: "en" }) as Record<string, unknown>;
    expect((a.author as Record<string, unknown>)["@type"]).toBe("Person");
    expect((a.author as Record<string, unknown>).url).toBe(
      "https://www.domlivo.com/en/blog/author/anna-example"
    );
  });

  // The team byline is not a human being. It is typed as a department of the
  // organisation and points at /about, where the actual people are named.
  it("types the Domlivo Editorial byline as an Organization linked to /about", () => {
    for (const input of [
      { ...BASE, authorName: "Domlivo Editorial", authorSlug: "domlivo-editorial", locale: "pl" },
      { ...BASE, authorName: "Domlivo Editorial", locale: "pl" },
    ]) {
      const author = (buildBlogArticleJsonLd(input) as Record<string, unknown>).author as Record<string, unknown>;
      expect(author["@type"]).toBe("Organization");
      expect(author.url).toBe("https://www.domlivo.com/pl/about");
      expect(author.parentOrganization).toEqual({ "@id": "https://www.domlivo.com/#organization" });
    }
  });

  // One Organization per page: the layout emits it, the article points at it.
  it("references the publisher by the sitewide @id instead of redeclaring it", () => {
    const a = buildBlogArticleJsonLd({ ...BASE, publisherUrl: "https://www.domlivo.com/" }) as Record<string, unknown>;
    expect(a.publisher).toEqual({
      "@type": "Organization",
      "@id": "https://www.domlivo.com/#organization",
      name: "Domlivo",
    });
  });

  // 12 of 17 posts carry only the legacy inline author fields. There is no
  // page to point at, so the Person node stays a bare name.
  it("omits author.url for a legacy inline author", () => {
    const a = buildBlogArticleJsonLd(BASE) as Record<string, unknown>;
    expect((a.author as Record<string, unknown>).url).toBeUndefined();
    expect((a.author as Record<string, unknown>).name).toBe("Anna Example");
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
