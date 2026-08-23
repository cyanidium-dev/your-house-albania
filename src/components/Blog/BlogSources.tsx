import { useTranslations } from "next-intl";
import { resolveLocalizedString } from "@/lib/sanity/localized";

type Props = {
  sources?: unknown[];
  locale: string;
};

/**
 * "Sources & methodology" list under the article.
 *
 * Element 5 of the AEO formula: an assistant that cannot see where a figure
 * came from has no reason to repeat it. External links are nofollow — these
 * are citations, not endorsements.
 */
export function BlogSources({ sources, locale }: Props) {
  const t = useTranslations("Blog");
  const items = (Array.isArray(sources) ? sources : [])
    .map((s) => {
      const v = s as { label?: unknown; url?: unknown; publisher?: unknown; date?: unknown };
      return {
        label: resolveLocalizedString(v.label as never, locale),
        url: typeof v.url === "string" ? v.url.trim() : "",
        publisher: typeof v.publisher === "string" ? v.publisher : "",
        date: typeof v.date === "string" ? v.date : "",
      };
    })
    .filter((s) => s.label.trim());

  if (items.length === 0) return null;

  return (
    <section className="mt-12 border-t border-dark/10 dark:border-white/20 pt-6">
      <h2 className="text-dark dark:text-white text-xl font-semibold mb-4">
        {t("sourcesTitle")}
      </h2>
      <ol className="flex flex-col gap-2 list-decimal ps-5">
        {items.map((s, i) => (
          <li key={i} className="text-dark/75 dark:text-white/75 text-sm leading-relaxed">
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="hover:text-primary underline underline-offset-2"
              >
                {s.label}
              </a>
            ) : (
              s.label
            )}
            {s.publisher ? ` — ${s.publisher}` : ""}
            {s.date ? `, ${s.date}` : ""}
          </li>
        ))}
      </ol>
    </section>
  );
}
