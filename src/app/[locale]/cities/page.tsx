import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CitiesBreadcrumb } from "@/components/shared/CitiesBreadcrumb";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params;
  const t = await getTranslations("Cities");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CitiesIndexPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("Cities");
  return (
    <section className="pt-44 pb-20">
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <CitiesBreadcrumb locale={locale} />
        <h1 className="text-4xl font-semibold text-dark dark:text-white mt-4">
          {t("title")}
        </h1>
        <p className="mt-4 text-dark/70 dark:text-white/70">{t("description")}</p>
      </div>
    </section>
  );
}
