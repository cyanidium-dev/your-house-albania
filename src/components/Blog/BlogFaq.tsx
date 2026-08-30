import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = {
  faq?: unknown[];
  locale: string;
  /**
   * False when the article body already emitted a FAQPage node. A page may
   * carry only one, and the document-level list is the one that wins.
   */
  emitJsonLd?: boolean;
};

/**
 * `localizedFaqItem.answer` is plain localized text; `localizedFaqItemRich`
 * carries Portable Text. JSON-LD needs a string either way, so rich answers
 * are flattened to their span text rather than skipped.
 */
function answerText(answer: unknown, locale: string): string {
  const direct = resolveLocalizedString(answer as never, locale);
  if (direct) return direct;
  const blocks = (answer as Record<string, unknown> | null)?.[locale] ??
    (answer as Record<string, unknown> | null)?.en;
  if (!Array.isArray(blocks)) return "";
  return blocks
    .map((b) => {
      const children = (b as { children?: unknown })?.children;
      if (!Array.isArray(children)) return "";
      return children
        .map((c) => (typeof (c as { text?: unknown })?.text === "string" ? (c as { text: string }).text : ""))
        .join("");
    })
    .join(" ")
    .trim();
}

export function BlogFaq({ faq, locale, emitJsonLd = true }: Props) {
  const t = useTranslations("Blog");
  const items = (Array.isArray(faq) ? faq : [])
    .map((item) => {
      const v = item as { question?: unknown; answer?: unknown };
      return {
        question: resolveLocalizedString(v.question as never, locale),
        answer: answerText(v.answer, locale),
      };
    })
    .filter((i) => i.question.trim() && i.answer.trim());

  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-dark dark:text-white text-2xl font-semibold mb-6">
        {t("faqTitle")}
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-start">{item.question}</AccordionTrigger>
            <AccordionContent>
              <p className="text-dark/75 dark:text-white/75 leading-relaxed">{item.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {emitJsonLd && <FaqJsonLd items={items} />}
    </section>
  );
}
