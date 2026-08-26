import { permanentRedirect } from "next/navigation";

/** ТЗ-17: legacy mock page retired — 308 to the sale deal landing (no office guide exists; zero office inventory). The folder stays so the slug stays filesystem-reserved (ROUTING.md). */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/sale`);
}
