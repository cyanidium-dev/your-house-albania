import { useTranslations } from "next-intl";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = {
  keyFacts?: unknown[];
  locale: string;
};

/**
 * The "In short" box, directly under the intro.
 *
 * This is the block AI assistants quote: three to six direct answers, each
 * standing on its own without the paragraph around it. Renders nothing when
 * the article has none, which is every article that predates ТЗ-13.
 */
export function BlogKeyFacts({ keyFacts, locale }: Props) {
  const t = useTranslations("Blog");
  const facts = (Array.isArray(keyFacts) ? keyFacts : [])
    .map((f) => resolveLocalizedString(f as never, locale))
    .filter((f): f is string => Boolean(f && f.trim()));

  if (facts.length === 0) return null;

  return (
    <aside className="border border-primary/30 bg-primary/5 rounded-lg p-5 my-8">
      <p className="text-dark dark:text-white font-semibold mb-3">{t("keyFacts")}</p>
      <ul className="flex flex-col gap-2 list-disc ps-5">
        {facts.map((fact, i) => (
          <li key={i} className="text-dark/85 dark:text-white/85 text-base leading-relaxed">
            {fact}
          </li>
        ))}
      </ul>
    </aside>
  );
}
