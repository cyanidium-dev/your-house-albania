/**
 * The knowledge base in `/llms.txt` and `/llms-full.txt`.
 *
 * `/llms.txt` gets "Reference facts": one line per question page — the
 * question, the answer in a sentence or two, the URL — grouped like the
 * /knowledge index. `/llms-full.txt` gets every page in full as markdown:
 * answer, sections, tables, FAQ, sources and known gaps, so an assistant can
 * quote a figure with its source and date without rendering the page.
 *
 * Pure: the routes fetch the pages (English, price-index tokens already
 * filled) and pass them in.
 */
import type { KnowledgeArticle } from "@/lib/sanity/queries/knowledge";

const GROUP_TITLES: Record<string, string> = {
  buying: "Buying as a foreigner",
  money: "Taxes and fees",
  ownership: "Owning and renting out",
  process: "Process and risks",
  geography: "Where to buy",
};
const GROUP_ORDER = Object.keys(GROUP_TITLES);

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

/**
 * The answer as one line: the first sentence, or the first two when the first
 * is a bare "Yes." or "Not on an apartment." that says nothing on its own.
 */
export function shortAnswer(summary: string | undefined): string {
  const text = oneLine(summary ?? "");
  if (!text) return "";
  // A capital after the stop, so "Art. 4" and "No. 169" stay in their sentence.
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
  const first = sentences[0] ?? "";
  return first.length < 60 && sentences[1] ? `${first} ${sentences[1]}` : first;
}

function grouped(pages: KnowledgeArticle[]): [string, KnowledgeArticle[]][] {
  return GROUP_ORDER.map((g) => [g, pages.filter((p) => p.topicGroup === g)] as [string, KnowledgeArticle[]]).filter(
    ([, list]) => list.length > 0,
  );
}

const pageUrl = (base: string, slug: string) => `${base.replace(/\/$/, "")}/en/knowledge/${slug}`;

export function referenceFactsMarkdown(pages: KnowledgeArticle[], base: string): string {
  if (pages.length === 0) return "";
  const lines = [
    "## Reference facts",
    "",
    `Answers from the Domlivo knowledge base (${pageUrl(base, "").replace(/\/$/, "")}): one line each, with the page that carries the table, the sources and the known gaps. Figures are dated on each page.`,
  ];
  for (const [group, list] of grouped(pages)) {
    lines.push("", `### ${GROUP_TITLES[group]}`, "");
    for (const page of list) lines.push(`- ${oneLine(page.title)} ${shortAnswer(page.summary)} ${pageUrl(base, page.slug)}`);
  }
  return lines.join("\n");
}

type Block = { children?: { text?: string }[]; listItem?: string };

function blocksToText(body: unknown[] | undefined): string {
  const out: string[] = [];
  for (const block of (body ?? []) as Block[]) {
    const text = oneLine((block.children ?? []).map((c) => c.text ?? "").join(""));
    if (!text) continue;
    out.push(block.listItem ? `- ${text}` : `\n${text}\n`);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const cell = (value: string) => oneLine(value).replace(/\|/g, "\\|");

export function knowledgeFullText(pages: KnowledgeArticle[], base: string): string {
  if (pages.length === 0) return "";
  const parts: string[] = ["# Domlivo knowledge base", ""];
  for (const [group, list] of grouped(pages)) {
    parts.push(`## ${GROUP_TITLES[group]}`, "");
    for (const page of list) {
      parts.push(`### ${oneLine(page.title)}`, "", `URL: ${pageUrl(base, page.slug)}`);
      const meta = [
        page.lastUpdated ? `Updated ${page.lastUpdated}` : "",
        page.author?.name ? `data compiled by ${page.author.name}` : "",
        page.reviewer?.name ? `checked by ${page.reviewer.name}` : "",
        page.confidence ? `confidence ${page.confidence}` : "",
      ].filter(Boolean);
      if (meta.length) parts.push(`${meta.join("; ")}.`);
      parts.push("", oneLine(page.summary ?? ""), "");
      for (const section of page.sections ?? []) {
        parts.push(`#### ${oneLine(section.heading)}`, "");
        const body = section.bodyText?.trim() || blocksToText(section.body);
        if (body) parts.push(body, "");
        for (const table of section.tables ?? []) {
          if (table.title) parts.push(`${oneLine(table.title)}:`, "");
          parts.push(`| ${(table.columns ?? []).map(cell).join(" | ")} |`);
          parts.push(`|${(table.columns ?? []).map(() => "---").join("|")}|`);
          for (const row of table.rows ?? []) parts.push(`| ${(row.cells ?? []).map(cell).join(" | ")} |`);
          if (table.methodology) parts.push("", `Method: ${oneLine(table.methodology)}`);
          parts.push("");
        }
      }
      if ((page.faq ?? []).length) {
        parts.push("#### FAQ", "");
        for (const item of page.faq) parts.push(`Q: ${oneLine(item.question)}`, `A: ${oneLine(item.answer)}`, "");
      }
      if ((page.sources ?? []).length) {
        parts.push("#### Sources", "");
        for (const s of page.sources)
          parts.push(`- ${[s.name, s.publisher, s.publishedAt].filter(Boolean).join(", ")}${s.url ? ` ${s.url}` : ""}`);
        parts.push("");
      }
      if ((page.gaps ?? []).length) {
        parts.push("#### Known gaps", "");
        for (const gap of page.gaps) if (gap.description) parts.push(`- ${oneLine(gap.description)}`);
        parts.push("");
      }
    }
  }
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
