import { NextRequest } from "next/server";
import { fetchPropertiesBySlugs } from "@/lib/sanity/client";
import { mapCatalogPropertyToCard } from "@/lib/sanity/propertyAdapter";

export async function GET(request: NextRequest) {
  const slugsParam = request.nextUrl.searchParams.get("slugs");
  const locale = request.nextUrl.searchParams.get("locale") || "en";

  if (!slugsParam) {
    return Response.json({ items: [] });
  }

  const slugs = slugsParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (slugs.length === 0) {
    return Response.json({ items: [] });
  }

  const sanityItems = await fetchPropertiesBySlugs(slugs);
  const items = sanityItems.map((p) => mapCatalogPropertyToCard(p, locale));

  return Response.json({ items });
}
