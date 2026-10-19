import { describe, expect, it } from "vitest";
import { buildKnowledgeArticleJsonLd, buildKnowledgeFaqJsonLd } from "../knowledgeArticleJsonLd";

const base = {
  headline: "Is there a 2% transfer tax when you buy property in Albania?",
  url: "https://www.domlivo.com/en/knowledge/is-there-a-transfer-tax-when-buying-property-in-albania",
  locale: "en",
  lastUpdated: "2026-10-19",
  baseUrl: "https://www.domlivo.com",
};

type Node = Record<string, unknown>;

describe("buildKnowledgeArticleJsonLd", () => {
  it("names the founder who compiled the data as the author Person", () => {
    const a = buildKnowledgeArticleJsonLd({ ...base, authorSlug: "fedir-alpatov" }) as Node;
    expect(a["@type"]).toBe("Article");
    const author = a.author as Node;
    expect(author["@type"]).toBe("Person");
    expect(author.name).toBe("Fedir Alpatov");
    expect(String(author["@id"])).toContain("fedir-alpatov");
  });

  it("uses the visible update date for both dates", () => {
    const a = buildKnowledgeArticleJsonLd(base) as Node;
    expect(a.datePublished).toBe("2026-10-19");
    expect(a.dateModified).toBe("2026-10-19");
  });

  it("adds a contributor only when a reviewer is set", () => {
    expect((buildKnowledgeArticleJsonLd({ ...base, authorSlug: "fedir-alpatov" }) as Node).contributor).toBeUndefined();
    const reviewed = buildKnowledgeArticleJsonLd({ ...base, authorSlug: "fedir-alpatov", reviewerSlug: "viktor-grinchenko" }) as Node;
    expect((reviewed.contributor as Node).name).toBe("Viktor Grinchenko");
  });

  it("falls back to the Organization for an unknown author", () => {
    const a = buildKnowledgeArticleJsonLd({ ...base, authorSlug: "someone-else" }) as Node;
    expect((a.author as Node)["@type"]).toBe("Organization");
  });

  it("lists the sources as citations", () => {
    const a = buildKnowledgeArticleJsonLd({
      ...base,
      sources: [{ name: "VKM 462/2025", url: "https://www.ashk.gov.al/x.pdf", publisher: "ASHK", publishedAt: "2025-07-31" }],
    }) as Node;
    expect(a.citation).toEqual([
      {
        "@type": "CreativeWork",
        name: "VKM 462/2025",
        url: "https://www.ashk.gov.al/x.pdf",
        publisher: { "@type": "Organization", name: "ASHK" },
        datePublished: "2025-07-31",
      },
    ]);
  });

  it("returns null without a date rather than inventing one", () => {
    expect(buildKnowledgeArticleJsonLd({ ...base, lastUpdated: null })).toBeNull();
  });
});

describe("buildKnowledgeFaqJsonLd", () => {
  const qa = (n: number) => Array.from({ length: n }, (_, i) => ({ question: `Q${i}?`, answer: `A${i}.` }));

  it("needs three complete pairs", () => {
    expect(buildKnowledgeFaqJsonLd(qa(2))).toBeNull();
    expect(buildKnowledgeFaqJsonLd([...qa(2), { question: "Q?", answer: "" }])).toBeNull();
    const faq = buildKnowledgeFaqJsonLd(qa(3)) as Node;
    expect(faq["@type"]).toBe("FAQPage");
    expect((faq.mainEntity as unknown[]).length).toBe(3);
  });
});
