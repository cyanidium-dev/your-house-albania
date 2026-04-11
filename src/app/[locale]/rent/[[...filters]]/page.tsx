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
    dealQuery: "rent",
    titleFragment: "rent",
  });
}

export default async function RentDealListingPage({ params, searchParams }: Props) {
  const [{ locale, filters = [] }, search] = await Promise.all([params, searchParams]);
  return (
    <NonGeoDealListingPage
      locale={locale}
      dealRouteSegment="rent"
      dealQuery="rent"
      filters={filters}
      searchParams={search}
    />
  );
}
