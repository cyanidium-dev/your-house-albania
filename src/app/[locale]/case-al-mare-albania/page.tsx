import type { Metadata } from "next";
import { SeaFlatsPage, seaFlatsMetadata, seaFlatsStaticParams } from "@/components/seaFlats/SeaFlatsPage";

type Props = { params: Promise<{ locale: string }> };

/** `/it/case-al-mare-albania`: flats by the sea for Italian buyers (lib/seaFlats). */
export const revalidate = 86400;

export function generateStaticParams() {
  return seaFlatsStaticParams("it");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return seaFlatsMetadata("it", locale);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <SeaFlatsPage locale="it" requested={locale} />;
}
