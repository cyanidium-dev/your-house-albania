import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import {
  fetchImageCredits,
  LICENCE_LABELS,
  requiresAttribution,
} from "@/lib/sanity/client";
import { buildFlatCrumbs, toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { getBaseUrl } from "@/lib/seo/baseUrl";
import { buildHreflangAlternates } from "@/lib/seo/hreflang";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ImageCredits");
  return {
    title: t("title"),
    description: t("description"),
    alternates: await buildHreflangAlternates("image-credits"),
  };
}

/**
 * `/image-credits` — attribution for every photograph on the site.
 *
 * This page is what makes CC BY / CC BY-SA imagery usable here. Those licences
 * require the credit to reach the reader, and Creative Commons accepts
 * attribution "in any reasonable manner based on the medium"; for a site whose
 * pages are dense with market data, a single credits page linked from the
 * footer is the accepted form and keeps a byline off every hero.
 *
 * It is deliberately indexable. A credits page nobody can reach is not
 * attribution.
 */
export default async function ImageCreditsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("ImageCredits");
  const credits = await fetchImageCredits();

  const items = buildFlatCrumbs({
    locale,
    homeLabel: t("breadcrumbHome"),
    label: t("title"),
  });
  const baseUrl = await getBaseUrl();
  const jsonLdItems = toBreadcrumbJsonLdItems(items, `/${locale}/image-credits`);

  const attributed = credits.filter((c) => requiresAttribution(c.licence));
  const free = credits.filter((c) => !requiresAttribution(c.licence));

  return (
    <main>
      <section className="pt-32 md:pt-44 pb-16 md:pb-24">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <BreadcrumbJsonLd items={jsonLdItems} baseUrl={baseUrl} />
          <Breadcrumb items={items} />

          <h1 className="mt-6 text-3xl md:text-5xl font-display font-semibold">{t("title")}</h1>
          <p className="mt-4 max-w-3xl text-base md:text-lg text-black/70 dark:text-white/70">
            {t("intro")}
          </p>

          {credits.length === 0 ? (
            <p className="mt-10 text-black/60 dark:text-white/60">{t("empty")}</p>
          ) : (
            <>
              {attributed.length > 0 && (
                <CreditGroup
                  heading={t("attributedHeading")}
                  note={t("attributedNote")}
                  credits={attributed}
                  standInLabel={t("standIn")}
                  sourceLabel={t("source")}
                />
              )}
              {free.length > 0 && (
                <CreditGroup
                  heading={t("freeHeading")}
                  note={t("freeNote")}
                  credits={free}
                  standInLabel={t("standIn")}
                  sourceLabel={t("source")}
                />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

type CreditGroupProps = {
  heading: string;
  note: string;
  standInLabel: string;
  sourceLabel: string;
  credits: Awaited<ReturnType<typeof fetchImageCredits>>;
};

function CreditGroup({ heading, note, credits, standInLabel, sourceLabel }: CreditGroupProps) {
  return (
    <section className="mt-12">
      <h2 className="text-xl md:text-2xl font-display font-semibold">{heading}</h2>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">{note}</p>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {credits.map((credit) => (
          <li
            key={credit._id}
            className="rounded-2xl border border-black/10 dark:border-white/15 overflow-hidden"
          >
            {credit.imageUrl && (
              <div className="relative aspect-[3/2] bg-black/5 dark:bg-white/5">
                {/*
                  `unoptimized` for remote Sanity URLs, matching the rest of the
                  site — there is no `images.remotePatterns` entry for
                  cdn.sanity.io, so the optimizer would throw.
                */}
                <Image
                  src={credit.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                  unoptimized={credit.imageUrl.startsWith("http")}
                />
              </div>
            )}
            <div className="p-4">
              <p className="font-medium">{credit.title}</p>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">{credit.author}</p>
              <p className="mt-1 text-sm">
                {credit.licenceUrl ? (
                  <a
                    href={credit.licenceUrl}
                    rel="noopener noreferrer license"
                    target="_blank"
                    className="underline underline-offset-2"
                  >
                    {LICENCE_LABELS[credit.licence ?? ""] ?? credit.licence}
                  </a>
                ) : (
                  (LICENCE_LABELS[credit.licence ?? ""] ?? credit.licence)
                )}
              </p>
              {credit.sourceUrl && (
                <p className="mt-1 text-sm">
                  <a
                    href={credit.sourceUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="underline underline-offset-2 text-black/60 dark:text-white/60"
                  >
                    {sourceLabel}
                  </a>
                </p>
              )}
              {credit.isStandIn && (
                <p className="mt-2 text-xs text-black/55 dark:text-white/55">
                  <span className="font-medium">{standInLabel}</span>
                  {credit.standInNote ? ` — ${credit.standInNote}` : null}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
