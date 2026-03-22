import { NextRequest } from "next/server";
import { fetchPropertiesBySlugs } from "@/lib/sanity/client";
import { mapCatalogPropertyToCard } from "@/lib/sanity/propertyAdapter";

const MAX_SLUGS = 50;

export async function GET(request: NextRequest) {
  const slugsParam = request.nextUrl.searchParams.get("slugs");
  const locale = request.nextUrl.searchParams.get("locale") || "en";

  if (!slugsParam) {
    return Response.json({ items: [] });
  }

  let slugs: string[];
  try {
    slugs = slugsParam.split(",").map((s) => s.trim()).filter(Boolean);
  } catch {
    return Response.json({ error: "Invalid slugs parameter" }, { status: 400 });
  }

  if (slugs.length === 0) {
    return Response.json({ items: [] });
  }

  if (slugs.length > MAX_SLUGS) {
    return Response.json({ error: "Too many slugs" }, { status: 400 });
  }

  const sanityItems = await fetchPropertiesBySlugs(slugs);
  const items = sanityItems.map((p) => mapCatalogPropertyToCard(p, locale));

  return Response.json({ items });
}
