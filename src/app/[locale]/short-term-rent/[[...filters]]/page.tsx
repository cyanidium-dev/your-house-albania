import { NonGeoDealListingPage } from "@/components/catalog/NonGeoDealListingPage";
import { generateNonGeoDealRouteMetadata } from "@/lib/seo/nonGeoDealRouteMetadata";

type Props = {
  params: Promise<{ locale: string; filters?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ locale, filters = [] }, search] = await Promise.all([params, searchParams]);
  return generateNonGeoDealRouteMetadata({
    locale,
    filters,
    search,
    dealQuery: "short-term",
    titleFragment: "short-term",
  });
}

export default async function ShortTermRentDealListingPage({ params, searchParams }: Props) {
  const [{ locale, filters = [] }, search] = await Promise.all([params, searchParams]);
  return (
    <NonGeoDealListingPage
      locale={locale}
      dealRouteSegment="short-term-rent"
      dealQuery="short-term"
      filters={filters}
      searchParams={search}
    />
  );
}
