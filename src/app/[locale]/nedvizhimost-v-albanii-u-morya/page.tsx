import type { Metadata } from "next";
import { SeaFlatsPage, seaFlatsMetadata, seaFlatsStaticParams } from "@/components/seaFlats/SeaFlatsPage";

type Props = { params: Promise<{ locale: string }> };

/** `/ru/nedvizhimost-v-albanii-u-morya`: flats by the sea for Russian-speaking buyers (lib/seaFlats). */
export const revalidate = 86400;

export function generateStaticParams() {
  return seaFlatsStaticParams("ru");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return seaFlatsMetadata("ru", locale);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <SeaFlatsPage locale="ru" requested={locale} />;
}
