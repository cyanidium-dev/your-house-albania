/**
 * schema.org FAQPage JSON-LD for a landing `faqSection`.
 * Answers must already be plain text (rich Portable Text serialized by the caller).
 * A page must contain at most ONE FAQPage — the caller emits this only for the
 * first faqSection on the page.
 */

export type FaqJsonLdItem = { question: string; answer: string };

export function buildFaqJsonLd(items: FaqJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function FaqJsonLd({ items }: { items: FaqJsonLdItem[] }) {
  const valid = items.filter((i) => i.question.trim() && i.answer.trim());
  if (valid.length === 0) return null;

  const jsonLd = buildFaqJsonLd(valid);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
