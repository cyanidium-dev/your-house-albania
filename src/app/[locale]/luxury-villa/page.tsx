import { permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/** ТЗ-17: legacy mock page retired — 308 to its type×city guide. The folder stays so the slug stays filesystem-reserved (ROUTING.md). */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  permanentRedirect(`/${locale}/guides/villa-sarande`);
}
