import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { Icon } from "@iconify/react/dist/iconify.js";
import { catalogPath } from "@/lib/routes/catalog";

/**
 * 404 inside the localised site.
 *
 * The root `not-found.tsx` renders above the `[locale]` segment, so it has no
 * header, no footer and no dictionary — a visitor who hit a dead link was left
 * on a page with no way out and English copy whatever their language. This
 * boundary sits inside the locale layout, so the chrome and the language come
 * back, and it offers somewhere to go.
 */
export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations("NotFound");

  return (
    <main className="pt-32 md:pt-44 pb-20 md:pb-28">
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Image
            src="/images/404.png"
            alt=""
            width={420}
            height={386}
            unoptimized
            className="h-auto w-full max-w-[320px] md:max-w-[420px]"
          />

          <div className="mt-6 flex items-center justify-center gap-2.5">
            <Icon icon="ph:house-simple-fill" width={20} height={20} className="text-primary" />
            <p className="text-base font-semibold text-dark/75 dark:text-white/75">
              {t("badge")}
            </p>
          </div>

          <h1 className="mt-2 font-display text-3xl md:text-5xl font-bold text-dark dark:text-white text-balance">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-dark/60 dark:text-white/60">{t("description")}</p>

          <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 font-semibold text-white transition-colors duration-200 ease-out hover:bg-dark"
            >
              {t("backHome")}
            </Link>
            <Link
              href={catalogPath(locale)}
              className="inline-flex h-11 items-center justify-center rounded-full border-2 border-dark/15 px-8 font-semibold text-dark transition-colors duration-200 ease-out hover:border-primary hover:text-primary dark:border-white/25 dark:text-white dark:hover:border-primary dark:hover:text-primary"
            >
              {t("browseListings")}
            </Link>
            <Link
              href={`/${locale}/blog`}
              className="inline-flex h-11 items-center justify-center rounded-full px-4 font-semibold text-dark/70 underline-offset-4 transition-colors duration-200 ease-out hover:text-primary hover:underline dark:text-white/70"
            >
              {t("readBlog")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
