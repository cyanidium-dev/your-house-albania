import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FlatBreadcrumb } from "@/components/shared/FlatBreadcrumb";
import { Icon } from "@/components/shared/Icon";
import { TEAM_MEMBERS, teamMemberId, type TeamMemberLink } from "@/lib/about/team";
import {
  BUSINESS_TELEGRAM_URL,
  BUSINESS_WHATSAPP_URL,
} from "@/lib/contacts/businessContacts";
import { BUSINESS_EMAIL } from "@/lib/contacts/businessEmail";
import { buildAboutJsonLd } from "@/lib/seo/aboutJsonLd";
import { buildSimplePageMetadata } from "@/lib/seo/simplePageMetadata";
import { getSiteBaseUrl } from "@/lib/siteUrl";

type Props = { params: Promise<{ locale: string }> };

/**
 * `/about` — who runs Domlivo and how listings reach it.
 *
 * Everything on this page is either a fact about a named person (supplied by
 * that person) or a description of what the codebase actually does. There is
 * deliberately no founding year, office, licence or customer count: none of
 * those exists in a form we could point to, and the crawl audit of 2026-09-10
 * removed the old footer link for exactly that reason — "inventing a company
 * history is out of place".
 *
 * Static: the copy lives in `messages/*.json`, the people in
 * `src/lib/about/team.ts`. No CMS fetch of its own, no `headers()`/`cookies()`,
 * so the locale layout's `generateStaticParams` prerenders all seven URLs.
 */
export const revalidate = 3600;

/** Rendered size of a founder photo, in CSS px. The smallest source is 256px. */
const AVATAR_PX = 160;

const LINK_ICONS: Record<TeamMemberLink["labelKey"], string | null> = {
  codeSite: null,
  codeSiteProfile: null,
  agency: null,
  telegram: "ph:telegram-logo",
  instagram: "ph:instagram-logo",
  youtube: "ph:youtube-logo",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return buildSimplePageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    pathAfterLocale: "about",
    robots: { index: true, follow: true },
  });
}

const h2Class = "text-2xl md:text-3xl font-display font-semibold text-dark dark:text-white";
const bodyClass = "text-base md:text-lg leading-relaxed text-dark/70 dark:text-white/70";
const textLinkClass =
  "underline underline-offset-4 decoration-dark/30 hover:text-primary hover:decoration-primary dark:decoration-white/30 transition-colors";
const pillClass =
  "inline-flex items-center gap-2 rounded-full border border-dark/15 dark:border-white/20 px-5 py-2.5 text-base font-medium text-dark dark:text-white transition-colors hover:border-primary hover:text-primary";

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");
  const baseUrl = getSiteBaseUrl().replace(/\/$/, "");

  const jsonLd = buildAboutJsonLd({
    baseUrl,
    locale,
    title: t("h1"),
    // The mission, in the page's language: what the organisation is for.
    description: t("mission.body1"),
    people: TEAM_MEMBERS.map((m) => ({
      id: teamMemberId(baseUrl, m.slug),
      name: m.name,
      image: m.photo,
      jobTitle: t(`team.members.${m.key}.role`),
      description: t(`team.members.${m.key}.bio`),
      sameAs: m.links.map((l) => l.href),
      knowsAbout: m.knowsAbout,
    })),
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="pt-32 md:pt-44 pb-16 md:pb-24">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <FlatBreadcrumb locale={locale} labelKey="about" path="about" />

          <header className="mt-6 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-display font-semibold text-dark dark:text-white">
              {t("h1")}
            </h1>
            <p className={`mt-5 ${bodyClass}`}>{t("intro1")}</p>
            <p className={`mt-4 ${bodyClass}`}>{t("intro2")}</p>
          </header>

          <section className="mt-14 max-w-3xl" aria-labelledby="about-mission">
            <h2 id="about-mission" className={h2Class}>
              {t("mission.title")}
            </h2>
            <p className={`mt-4 ${bodyClass}`}>{t("mission.body1")}</p>
            <p className={`mt-4 ${bodyClass}`}>{t("mission.body2")}</p>
            {/* Only things the site does today; each line was checked against
                the code when it was written. No link to /ai-search: that page
                is `noindex`, and the header already carries the entry point. */}
            <h3 className="mt-8 text-lg md:text-xl font-display font-semibold text-dark dark:text-white">
              {t("mission.uspTitle")}
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {(["item1", "item2", "item3", "item4", "item5", "item6", "item7"] as const).map((key) => (
                <li key={key} className={`flex items-start gap-3 ${bodyClass}`}>
                  <span className="mt-2.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`mission.usp.${key}`)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14 max-w-3xl" aria-labelledby="about-research">
            <h2 id="about-research" className={h2Class}>
              {t("research.title")}
            </h2>
            <p className={`mt-4 ${bodyClass}`}>{t("research.body")}</p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-base md:text-lg text-dark dark:text-white">
              <li>
                <Link href={`/${locale}/guides`} className={textLinkClass}>
                  {t("research.guides")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className={textLinkClass}>
                  {t("research.blog")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/cities`} className={textLinkClass}>
                  {t("research.cities")}
                </Link>
              </li>
            </ul>
          </section>

          <section className="mt-16" aria-labelledby="about-team">
            <h2 id="about-team" className={h2Class}>
              {t("team.title")}
            </h2>
            <p className={`mt-4 max-w-3xl ${bodyClass}`}>{t("team.intro")}</p>

            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {TEAM_MEMBERS.map((member) => (
                <li
                  key={member.key}
                  className="flex flex-col rounded-2xl border border-dark/10 dark:border-white/15 p-6 md:p-7"
                >
                  {/* Fixed box at AVATAR_PX: the smallest source is 256px, so
                      the photo is never drawn larger than its own pixels. */}
                  <Image
                    src={member.photo}
                    alt={member.localName?.[locale] ?? member.name}
                    width={AVATAR_PX}
                    height={AVATAR_PX}
                    sizes={`${AVATAR_PX}px`}
                    className="rounded-2xl object-cover bg-dark/5 dark:bg-white/5"
                    style={{ width: AVATAR_PX, height: AVATAR_PX }}
                  />
                  <h3 className="mt-5 text-xl md:text-2xl font-display font-semibold text-dark dark:text-white">
                    {member.localName?.[locale] ?? member.name}
                  </h3>
                  <p className="mt-1 text-sm md:text-base font-medium text-primary">
                    {t(`team.members.${member.key}.role`)}
                  </p>
                  <p className="mt-4 text-base leading-relaxed text-dark/70 dark:text-white/70">
                    {t(`team.members.${member.key}.bio`)}
                  </p>
                  {/* Personal and studio profiles, not Domlivo's sales channels. */}
                  <ul
                    data-lead-ignore
                    aria-label={t("team.linksLabel")}
                    className="mt-5 flex flex-wrap gap-x-5 gap-y-2 pt-1 text-base text-dark dark:text-white"
                  >
                    {member.links.map((link) => {
                      const icon = LINK_ICONS[link.labelKey];
                      return (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 ${textLinkClass}`}
                          >
                            {icon ? (
                              <Icon icon={icon} width={18} height={18} className="shrink-0" aria-hidden />
                            ) : null}
                            {t(`team.links.${link.labelKey}`)}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-16 max-w-3xl" aria-labelledby="about-listings">
            <h2 id="about-listings" className={h2Class}>
              {t("listings.title")}
            </h2>
            <p className={`mt-4 ${bodyClass}`}>{t("listings.intro")}</p>
            <ul className="mt-5 flex flex-col gap-3">
              {(["item1", "item2", "item3", "item4"] as const).map((key) => (
                <li key={key} className={`flex items-start gap-3 ${bodyClass}`}>
                  <span className="mt-2.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t(`listings.${key}`)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="mt-16 max-w-3xl"
            aria-labelledby="about-contact"
            data-lead-placement="page"
          >
            <h2 id="about-contact" className={h2Class}>
              {t("contact.title")}
            </h2>
            <p className={`mt-4 ${bodyClass}`}>{t("contact.body")}</p>
            <ul className="mt-6 flex flex-wrap gap-3">
              <li>
                <Link
                  href={`/${locale}/contacts`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-dark dark:hover:bg-white dark:hover:text-dark"
                >
                  <Icon icon="ph:paper-plane-tilt" width={20} height={20} className="shrink-0" aria-hidden />
                  {t("contact.form")}
                </Link>
              </li>
              <li>
                <a href={BUSINESS_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={pillClass}>
                  <Icon icon="ph:whatsapp-logo" width={20} height={20} className="shrink-0" aria-hidden />
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={BUSINESS_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={pillClass}>
                  <Icon icon="ph:telegram-logo" width={20} height={20} className="shrink-0" aria-hidden />
                  Telegram
                </a>
              </li>
              <li>
                <a href={`mailto:${BUSINESS_EMAIL}`} className={pillClass}>
                  <Icon icon="ph:envelope-simple" width={20} height={20} className="shrink-0" aria-hidden />
                  {BUSINESS_EMAIL}
                </a>
              </li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
