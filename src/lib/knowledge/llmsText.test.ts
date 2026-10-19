import { describe, expect, it } from "vitest";
import type { KnowledgeArticle } from "@/lib/sanity/queries/knowledge";
import { knowledgeFullText, referenceFactsMarkdown, shortAnswer } from "./llmsText";

const page = (over: Partial<KnowledgeArticle> = {}): KnowledgeArticle => ({
  documentId: "KB-TRANSFER-TAX",
  slug: "is-there-a-transfer-tax-when-buying-property-in-albania",
  title: "Is there a 2% transfer tax when you buy property in Albania?",
  summary: "Not on an apartment. The 2% local tax applies to land and plots, and the seller pays it. The buyer pays the notary.",
  category: "taxes",
  topicGroup: "money",
  lastUpdated: "2026-10-19",
  questionCount: 4,
  questions: [],
  faq: [{ question: "Does the buyer pay it?", answer: "No." }],
  sources: [{ sourceId: "KB-ALB-2026-003", name: "VKM 462/2025", publisher: "ASHK", url: "https://www.ashk.gov.al/x.pdf" }],
  author: { name: "Fedir Alpatov", slug: "fedir-alpatov" },
  reviewer: null,
  gaps: [{ gapId: "G1", description: "Official text of Art. 28 not opened.", priority: "HIGH" }],
  relatedArticles: [],
  sections: [
    {
      sectionKey: "WHO_PAYS",
      heading: "Who pays what",
      body: [{ children: [{ text: "The 2% figure exists." }] }, { listItem: "bullet", children: [{ text: "Seller pays 15%." }] }],
      tables: [{ tableId: "T", columns: ["Item", "Rate"], rows: [{ rowId: "01", cells: ["Transfer tax", "2%"], facts: [] }] }],
    },
  ],
  ...over,
});

describe("knowledge in llms text", () => {
  it("keeps a bare first sentence together with the next", () => {
    expect(shortAnswer(page().summary)).toBe("Not on an apartment. The 2% local tax applies to land and plots, and the seller pays it.");
    expect(shortAnswer("Electricity costs the same everywhere in Albania at 10.2 ALL per kWh. Water varies.")).toBe(
      "Electricity costs the same everywhere in Albania at 10.2 ALL per kWh.",
    );
    expect(shortAnswer("Only some land. Foreigners may lease it for 99 years (Law 8337/1998, Art. 4); plots need 3×. Rest.")).toBe(
      "Only some land. Foreigners may lease it for 99 years (Law 8337/1998, Art. 4); plots need 3×.",
    );
  });

  it("writes one reference line per page: question, answer, URL", () => {
    const md = referenceFactsMarkdown([page()], "https://www.domlivo.com");
    expect(md).toContain("## Reference facts");
    expect(md).toContain("### Taxes and fees");
    expect(md).toContain(
      "- Is there a 2% transfer tax when you buy property in Albania? Not on an apartment. The 2% local tax applies to land and plots, and the seller pays it. https://www.domlivo.com/en/knowledge/is-there-a-transfer-tax-when-buying-property-in-albania",
    );
    expect(referenceFactsMarkdown([], "https://www.domlivo.com")).toBe("");
  });

  it("writes the full page with table, FAQ, sources and gaps, and no reviewer until one is set", () => {
    const text = knowledgeFullText([page()], "https://www.domlivo.com");
    expect(text).toContain("data compiled by Fedir Alpatov");
    expect(text).not.toContain("checked by");
    expect(text).toContain("- Seller pays 15%.");
    expect(text).toContain("| Transfer tax | 2% |");
    expect(text).toContain("Q: Does the buyer pay it?");
    expect(text).toContain("- VKM 462/2025, ASHK https://www.ashk.gov.al/x.pdf");
    expect(text).toContain("- Official text of Art. 28 not opened.");
    const reviewed = knowledgeFullText([page({ reviewer: { name: "Viktor Grinchenko", slug: "viktor-grinchenko" } })], "https://www.domlivo.com");
    expect(reviewed).toContain("checked by Viktor Grinchenko");
  });
});
