import Link from "@/components/shared/Link";
import { getTranslations } from "next-intl/server";
import { SpriteIcon as Icon } from "@/components/shared/SpriteIcon";
import { BODY_TEXT, SECTION_TITLE, SPLIT, SPLIT_ASIDE, SPLIT_MAIN, Section } from "@/components/shared/layout";
import { seoLabLinksFor, type SeoLabLink } from "@/lib/seoLab/internalLinks";
import { cn } from "@/lib/utils";

/**
 * Links to listing pages from an article that already earns clicks
 * (SEO lab experiment E02, see lib/seoLab/internalLinks.ts). Renders nothing
 * for pages outside the experiment.
 */

function LinkList({ links }: { links: readonly SeoLabLink[] }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {links.map((link) => (
        <li key={link.href} className="flex items-start gap-2">
          <Icon icon="ph:buildings" width={16} height={16} className="mt-1 shrink-0 text-primary" aria-hidden />
          <Link href={link.href} className="text-primary hover:underline underline-offset-4">
            {link.anchor}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** A panel inside an article column (blog posts). */
export async function SeoLabLinks({
  locale,
  path,
  className,
}: {
  locale: string;
  path: string;
  className?: string;
}) {
  const links = seoLabLinksFor(path);
  if (links.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "SeoLab" });
  return (
    <nav
      aria-label={t("linksHeading")}
      className={cn("rounded-2xl border border-dark/10 p-5 md:p-6 dark:border-white/15", className)}
    >
      <h2 className="text-lg font-semibold text-dark dark:text-white">{t("linksHeading")}</h2>
      <LinkList links={links} />
    </nav>
  );
}

/** A full-width section in the split grid (guides, city /info pages). */
export async function SeoLabLinksSection({ locale, path }: { locale: string; path: string }) {
  const links = seoLabLinksFor(path);
  if (links.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "SeoLab" });
  return (
    <Section aria-labelledby="seo-lab-links-heading">
      <div className={SPLIT}>
        <div className={SPLIT_ASIDE}>
          <h2 id="seo-lab-links-heading" className={SECTION_TITLE}>
            {t("linksHeading")}
          </h2>
        </div>
        <div className={SPLIT_MAIN}>
          <LinkList links={links} />
        </div>
      </div>
    </Section>
  );
}
