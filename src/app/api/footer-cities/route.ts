import { NextResponse } from "next/server";
import { fetchFooterCitiesByCountry } from "@/lib/sanity/client";

const LIMIT = 6;

/**
 * JSON list of cities for footer (catalog links built client-side). `country` must be a lowercase slug.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale")?.trim() || "en";
  const rawCountry = searchParams.get("country")?.trim().toLowerCase() || "albania";
  if (!/^[a-z0-9-]{1,64}$/.test(rawCountry)) {
    return NextResponse.json([], { status: 400 });
  }
  const cities = await fetchFooterCitiesByCountry(locale, rawCountry, LIMIT);
  return NextResponse.json(cities);
}
