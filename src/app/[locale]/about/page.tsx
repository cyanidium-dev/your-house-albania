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
import { ALBANIA_PHOTOS } from "@/lib/media/albaniaPhotos";
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
 * those exists in a form we could point to.
 *
 * Design (2026-09-25): a dark gallery. The coast photograph the site already
 * owns opens the page full-bleed, the mission sits as a large statement next
 * to the list of what exists today, and the founders are three tall portraits
 * rather than avatars in boxes. The site's green is spent on the roles, the
 * icon discs and the contact band only.
 *
 * Static: the copy lives in `messages/*.json`, the people in
 * `src/lib/about/team.ts`. No CMS fetch of its own, no `headers()`/`cookies()`,
 * so the locale layout's `generateStaticParams` prerenders all seven URLs.
 */
export const revalidate = 3600;

const LINK_ICONS: Record<TeamMemberLink["labelKey"], string> = {
  codeSite: "ph:code",
  codeSiteProfile: "ph:code",
  agency: "ph:buildings",
  telegram: "ph:telegram-logo",
  instagram: "ph:instagram-logo",
  youtube: "ph:youtube-logo",
};

type UspKey = `mission.usp.item${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

/** One drawn icon per "what exists today" line, in the order of the copy. */
const USP_ITEMS: ReadonlyArray<{ key: UspKey; icon: string }> = [
  { key: "mission.usp.item1", icon: "ph:sparkle" },
  { key: "mission.usp.item2", icon: "ph:books" },
  { key: "mission.usp.item3", icon: "ph:chart-line-up" },
  { key: "mission.usp.item4", icon: "ph:calculator" },
  { key: "mission.usp.item5", icon: "ph:translate" },
  { key: "mission.usp.item6", icon: "ph:columns" },
  { key: "mission.usp.item7", icon: "ph:handshake" },
];

const RESEARCH_TILES = [
  { key: "guides", href: "guides", photo: ALBANIA_PHOTOS.coast },
  { key: "blog", href: "blog", photo: ALBANIA_PHOTOS.tirana },
  { key: "cities", href: "cities", photo: ALBANIA_PHOTOS.sarande },
] as const;

const LISTING_STEPS = ["item1", "item2", "item3", "item4"] as const;

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

const h2Class =
  "font-display text-3xl md:text-40 lg:text-52 font-semibold leading-[1.05] tracking-[-0.02em] text-balance text-dark dark:text-white";
const bodyClass = "text-base md:text-lg leading-relaxed text-dark/70 dark:text-white/70 text-pretty";
const ghostOnGreen =
  "inline-flex min-h-12 items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-base font-medium text-white transition-[border-color,background-color] duration-200 ease-out hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40";

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");
  const tPhoto = await getTranslations("AlbaniaPhotos");
  const baseUrl = getSiteBaseUrl().replace(/\/$/, "");
  const hero = ALBANIA_PHOTOS.durres;

  const jsonLd = buildAboutJsonLd({
    baseUrl,
    locale,
    title: t("h1"),
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
    <main className="bg-white dark:bg-dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero: the coast, full-bleed, darkening towards the copy. Height comes
          from the text, not the viewport, so the page starts under the fold. */}
      <section className="relative isolate overflow-hidden text-white">
        <Image
          src={hero.src}
          alt={tPhoto(hero.key)}
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[50%_60%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(23,32,35,0.55)_0%,rgba(23,32,35,0.35)_45%,rgba(23,32,35,0.94)_100%)]"
        />
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0 pt-32 md:pt-44 pb-16 md:pb-24">
          <FlatBreadcrumb locale={locale} labelKey="about" path="about" overHero />
          <h1 className="mt-8 max-w-4xl font-display text-[2.75rem] md:text-7xl lg:text-8xl font-bold leading-[0.98] tracking-[-0.03em] text-balance">
            {t("h1")}
          </h1>
          <div className="mt-8 grid max-w-5xl gap-6 md:mt-10 md:grid-cols-2 md:gap-10">
            <p className="text-lg md:text-xl leading-relaxed text-white/90 text-pretty">{t("intro1")}</p>
            <p className="text-base md:text-lg leading-relaxed text-white/75 text-pretty">{t("intro2")}</p>
          </div>
        </div>
      </section>

      {/* Mission: the statement large on the left, what exists today as one
          list on the right. */}
      <section className="py-16 md:py-24 lg:py-28" aria-labelledby="about-mission">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0 grid items-start gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div>
            <h2 id="about-mission" className={h2Class}>
              {t("mission.title")}
            </h2>
            <p className="mt-6 font-display text-xl md:text-2xl lg:text-[1.75rem] leading-snug tracking-[-0.01em] text-dark dark:text-white text-pretty">
              {t("mission.body1")}
            </p>
            <p className={`mt-6 ${bodyClass}`}>{t("mission.body2")}</p>
          </div>

          <div className="rounded-3xl bg-dark/[0.04] p-6 md:p-8 dark:bg-white/[0.05]">
            <h3 className="font-display text-lg md:text-xl font-semibold text-dark dark:text-white">
              {t("mission.uspTitle")}
            </h3>
            <ul className="mt-2 divide-y divide-dark/10 dark:divide-white/10">
              {USP_ITEMS.map(({ key, icon }) => (
                <li key={key} className="flex items-start gap-4 py-4">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#5fd3a9]">
                    <Icon icon={icon} width={20} height={20} aria-hidden />
                  </span>
                  <span className="text-base leading-relaxed text-dark/80 dark:text-white/80">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Team: three tall portraits. The photo is the card. */}
      <section className="bg-dark py-16 text-white md:py-24 lg:py-28 dark:bg-[#0e1517]" aria-labelledby="about-team">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <div className="max-w-3xl">
            <h2
              id="about-team"
              className="font-display text-3xl md:text-40 lg:text-52 font-semibold leading-[1.05] tracking-[-0.02em] text-balance"
            >
              {t("team.title")}
            </h2>
            <p className="mt-5 text-lg md:text-xl leading-relaxed text-white/70 text-pretty">{t("team.intro")}</p>
          </div>

          <ul className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-8 lg:gap-10">
            {TEAM_MEMBERS.map((member) => {
              const name = member.localName?.[locale] ?? member.name;
              return (
                <li key={member.key} className="group flex flex-col">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-white/5">
                    <Image
                      src={member.photo}
                      alt={name}
                      fill
                      sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,rgba(23,32,35,0)_0%,rgba(23,32,35,0.88)_100%)]"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <h3 className="font-display text-2xl lg:text-3xl font-semibold leading-tight tracking-[-0.02em]">{name}</h3>
                      <p className="mt-1.5 text-sm md:text-base font-medium text-[#5fd3a9]">
                        {t(`team.members.${member.key}.role`)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-base leading-relaxed text-white/75 text-pretty">
                    {t(`team.members.${member.key}.bio`)}
                  </p>
                  {/* Personal and studio profiles, not Domlivo's sales channels. */}
                  <ul data-lead-ignore aria-label={t("team.linksLabel")} className="mt-5 flex flex-wrap gap-2">
                    {member.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-white/85 transition-[border-color,color] duration-200 ease-out hover:border-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        >
                          <Icon icon={LINK_ICONS[link.labelKey]} width={16} height={16} className="shrink-0" aria-hidden />
                          {t(`team.links.${link.labelKey}`)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Research: three photographic tiles into the site's own analysis. */}
      <section className="py-16 md:py-24 lg:py-28" aria-labelledby="about-research">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <h2 id="about-research" className={h2Class}>
              {t("research.title")}
            </h2>
            <p className={bodyClass}>{t("research.body")}</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-3 md:mt-14 md:gap-6">
            {RESEARCH_TILES.map((tile) => (
              <li key={tile.key}>
                <Link
                  href={`/${locale}/${tile.href}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-dark text-white sm:aspect-[3/4] lg:aspect-[4/3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
                >
                  <Image
                    src={tile.photo.src}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 420px, (min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,32,35,0.05)_30%,rgba(23,32,35,0.88)_100%)]"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-6">
                    <span className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
                      {t(`research.${tile.key}`)}
                    </span>
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-dark transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none">
                      <Icon icon="ph:arrow-right" width={20} height={20} aria-hidden />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How a listing reaches the site: a sequence, so it reads as one. */}
      <section className="pb-16 md:pb-24 lg:pb-28" aria-labelledby="about-listings">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <div className="grid gap-10 rounded-[2rem] border border-dark/10 p-6 md:p-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:p-14 dark:border-white/10">
            <div>
              <h2 id="about-listings" className={h2Class}>
                {t("listings.title")}
              </h2>
              <p className={`mt-5 ${bodyClass}`}>{t("listings.intro")}</p>
            </div>
            <ol className="relative flex flex-col gap-7 before:absolute before:bottom-3 before:left-[1.1875rem] before:top-3 before:w-px before:bg-dark/15 dark:before:bg-white/15">
              {LISTING_STEPS.map((key, i) => (
                <li key={key} className="relative flex items-start gap-5">
                  <span className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dark/15 bg-white font-display text-base font-semibold tabular-nums text-dark dark:border-white/20 dark:bg-dark dark:text-white">
                    {i + 1}
                  </span>
                  <p className="pt-1.5 text-base md:text-lg leading-relaxed text-dark/80 dark:text-white/80 text-pretty">
                    {t(`listings.${key}`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Contact: the one green surface on the page. */}
      <section className="pb-20 md:pb-28" aria-labelledby="about-contact" data-lead-placement="page">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-white md:px-12 md:py-16 lg:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
              <div>
                <h2
                  id="about-contact"
                  className="font-display text-3xl md:text-40 lg:text-52 font-semibold leading-[1.05] tracking-[-0.02em] text-balance"
                >
                  {t("contact.title")}
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85 text-pretty">{t("contact.body")}</p>
              </div>
              <ul className="flex flex-wrap gap-3 lg:justify-end">
                <li>
                  <Link
                    href={`/${locale}/contacts`}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-dark transition-colors duration-200 ease-out hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                  >
                    <Icon icon="ph:paper-plane-tilt" width={20} height={20} className="shrink-0" aria-hidden />
                    {t("contact.form")}
                  </Link>
                </li>
                <li>
                  <a href={BUSINESS_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={ghostOnGreen}>
                    <Icon icon="ph:whatsapp-logo" width={20} height={20} className="shrink-0" aria-hidden />
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href={BUSINESS_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={ghostOnGreen}>
                    <Icon icon="ph:telegram-logo" width={20} height={20} className="shrink-0" aria-hidden />
                    Telegram
                  </a>
                </li>
                <li>
                  <a href={`mailto:${BUSINESS_EMAIL}`} className={ghostOnGreen}>
                    <Icon icon="ph:envelope-simple" width={20} height={20} className="shrink-0" aria-hidden />
                    {BUSINESS_EMAIL}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
