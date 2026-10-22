import { fetchPriceIndexSnapshot } from "@/lib/sanity/client";
import { buildCityCsv } from "@/lib/priceIndex/publish";
import { priceIndexFileHeaders } from "@/lib/priceIndex/httpHeaders";
import { findIndexCity } from "@/lib/priceIndex/snapshot";

/**
 * `/data/prices/{city}.csv`: one city of the Domlivo Price Index, the whole
 * city first and then its districts, CC BY 4.0. Regenerated at most hourly
 * from the same snapshot as the city's `/info` page.
 */
export const revalidate = 86400;

type Params = { params: Promise<{ file: string }> };

export async function generateStaticParams(): Promise<Array<{ file: string }>> {
  const snapshot = await fetchPriceIndexSnapshot();
  return (snapshot?.cities ?? []).map((c) => ({ file: `${c.slug}.csv` }));
}

export async function GET(_request: Request, { params }: Params) {
  const { file } = await params;
  const match = /^([a-z0-9-]+)\.csv$/.exec(decodeURIComponent(file).toLowerCase());
  if (!match) return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const snapshot = await fetchPriceIndexSnapshot();
  const city = findIndexCity(snapshot, match[1]);
  if (!snapshot || !city) {
    return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return new Response(buildCityCsv(city, snapshot.asOf), {
    headers: priceIndexFileHeaders("text/csv; charset=utf-8; header=present"),
  });
}
