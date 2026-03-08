import BlogList from "@/components/Blog";
import HeroSub from "@/components/shared/HeroSub";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Blog Grids | Domlivo ",
};

type Props = { params: Promise<{ locale: string }> };

export default async function Blog({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("Listing.blogs");
  return (
    <>
      <HeroSub
        title={t("title")}
        description={t("description")}
        badge={t("badge")}
      />
      <BlogList locale={locale} />
    </>
  );
}
