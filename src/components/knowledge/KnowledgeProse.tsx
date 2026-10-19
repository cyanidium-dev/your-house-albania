import { BODY_TEXT } from "@/components/shared/layout";

/**
 * Plain prose of a knowledge question page (`section.bodyText`): paragraphs
 * separated by a blank line, a line starting with "- " is a bullet. The CMS
 * stores it as plain text rather than Portable Text because rich text in seven
 * languages costs the dataset about eleven attribute paths per language, and
 * the dataset is capped at 2,000. Same type scale as the Portable Text bodies.
 */
export function parseProse(text: string): ({ kind: "p"; text: string } | { kind: "ul"; items: string[] })[] {
  const out: ({ kind: "p"; text: string } | { kind: "ul"; items: string[] })[] = [];
  for (const para of text.split(/\n\s*\n/)) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    let bullets: string[] = [];
    let words: string[] = [];
    const flushWords = () => {
      if (words.length) out.push({ kind: "p", text: words.join(" ") });
      words = [];
    };
    const flushBullets = () => {
      if (bullets.length) out.push({ kind: "ul", items: bullets });
      bullets = [];
    };
    for (const line of lines) {
      if (/^[-•]\s+/.test(line)) {
        flushWords();
        bullets.push(line.replace(/^[-•]\s+/, ""));
      } else {
        flushBullets();
        words.push(line);
      }
    }
    flushWords();
    flushBullets();
  }
  return out;
}

export default function KnowledgeProse({ text }: { text: string }) {
  return (
    <>
      {parseProse(text).map((block, i) =>
        block.kind === "p" ? (
          <p key={i} className={`${BODY_TEXT} mt-4 first:mt-0`}>
            {block.text}
          </p>
        ) : (
          <ul key={i} className="mt-4 first:mt-0 flex flex-col gap-2 pl-0 list-none">
            {block.items.map((item, j) => (
              <li key={j} className={`flex items-start gap-3 ${BODY_TEXT}`}>
                <span aria-hidden className="mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}
