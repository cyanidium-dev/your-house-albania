import Link from "@/components/shared/Link";
import { getTranslations } from "next-intl/server";
import { SpriteIcon as Icon } from "@/components/shared/SpriteIcon";
import { BODY_TEXT, SECTION_TITLE, SPLIT, SPLIT_ASIDE, SPLIT_MAIN, Section } from "@/components/shared/layout";
import { fetchKnowledgeLinks } from "@/lib/sanity/queries/knowledge";
import { cn } from "@/lib/utils";

/**
 * Links from an existing page to the knowledge-base questions it raises
 * (see lib/knowledge/links.ts for which page links where). Renders nothing
 * when none of the pages is published, so the map can run ahead of the CMS.
 */

async function loadLinks(locale: string, slugs: readonly string[]) {
  if (slugs.length === 0) return [];
  return fetchKnowledgeLinks([...slugs], locale);
}

function LinkList({ locale, links }: { locale: string; links: { slug: string; title: string }[] }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {links.map((link) => (
        <li key={link.slug} className="flex items-start gap-2">
          <Icon icon="ph:question" width={16} height={16} className="mt-1 shrink-0 text-primary" aria-hidden />
          <Link
            href={`/${locale}/knowledge/${link.slug}`}
            className="text-primary hover:underline underline-offset-4"
          >
            {link.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** A panel inside an article column (blog posts) or a block on a page section (methodology). */
export async function KnowledgeLinks({
  locale,
  slugs,
  as: Heading = "h2",
  className,
}: {
  locale: string;
  slugs: readonly string[];
  as?: "h2" | "h3";
  className?: string;
}) {
  const links = await loadLinks(locale, slugs);
  if (links.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Knowledge" });
  return (
    <nav aria-label={t("linksHeading")} className={cn("rounded-2xl border border-dark/10 p-5 md:p-6 dark:border-white/15", className)}>
      <Heading className="text-lg font-semibold text-dark dark:text-white">{t("linksHeading")}</Heading>
      <LinkList locale={locale} links={links} />
      <Link href={`/${locale}/knowledge`} className={cn(BODY_TEXT, "mt-4 inline-block text-sm hover:text-primary")}>
        {t("linksAll")}
      </Link>
    </nav>
  );
}

/** A full-width page section in the split grid (city /info pages). */
export async function KnowledgeLinksSection({ locale, slugs }: { locale: string; slugs: readonly string[] }) {
  const links = await loadLinks(locale, slugs);
  if (links.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Knowledge" });
  return (
    <Section aria-labelledby="knowledge-links-heading">
      <div className={SPLIT}>
        <div className={SPLIT_ASIDE}>
          <h2 id="knowledge-links-heading" className={SECTION_TITLE}>
            {t("linksHeading")}
          </h2>
          <p className={cn(BODY_TEXT, "mt-3")}>{t("linksIntro")}</p>
        </div>
        <div className={SPLIT_MAIN}>
          <LinkList locale={locale} links={links} />
          <Link href={`/${locale}/knowledge`} className={cn(BODY_TEXT, "mt-4 inline-block text-sm hover:text-primary")}>
            {t("linksAll")}
          </Link>
        </div>
      </div>
    </Section>
  );
}
