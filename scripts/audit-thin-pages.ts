/**
 * Thin geo and facet pages (growth plan B4, audit L-6): for every city,
 * district, city + type and facet listing page that has inventory, per locale,
 * prints the listing count, the words of copy written for that page in that
 * locale, and the index status the SEO registry gives it.
 *
 * "Unique text" is the page's own `catalogSeoPage` intro + bottom text in the
 * locale (strict: an English fallback on a Polish page counts as 0). The
 * generated blocks under the grid (price table, districts, FAQ) and the
 * templated facet sentence are the same on every page of the family, so they
 * do not count. Copy under STUB_WORDS is the 2026 seed stub ("Property catalog
 * in X. Domlivo aggregates…") and is flagged as a stub.
 *
 * Run (read-only, public dataset):
 *   npx tsx scripts/audit-thin-pages.ts                # table of indexable + thin pages
 *   npx tsx scripts/audit-thin-pages.ts --all          # every page and locale
 *   npx tsx scripts/audit-thin-pages.ts --out docs/seo/thin-pages-audit.md
 */
import { writeFileSync } from "node:fs";
import { createClient } from "@sanity/client";
import { PUBLISHED_PROPERTY_FILTER } from "../src/lib/sanity/groq/propertyFilters";
import { decideSeoPages, isSeoPageIndexableIn, seoPagePath, type SeoDecisionSourceRows } from "../src/lib/seo/pages";
import { THIN_COPY_MIN_WORDS } from "../src/lib/seo/pages/policy";

const LOCALES = ["en", "uk", "ru", "sq", "it", "pl", "de"] as const;
const STUB_WORDS = 40;

const args = process.argv.slice(2);
const showAll = args.includes("--all");
const outIdx = args.indexOf("--out");
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;

type CopyDoc = {
  pageScope?: string;
  citySlug?: string;
  districtSlug?: string;
  facet?: string;
  intro?: Record<string, unknown>;
  bottomText?: Record<string, unknown>;
};

function words(value: unknown): number {
  if (typeof value === "string") return (value.match(/[\p{L}\p{N}€{}][\p{L}\p{N}€{}:.,'’-]*/gu) ?? []).length;
  if (Array.isArray(value)) return value.reduce((n: number, v) => n + words(v), 0);
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.text === "string") return words(o.text);
    if (Array.isArray(o.children)) return words(o.children);
  }
  return 0;
}

async function main() {
  const client = createClient({ projectId: "g4aqp6ex", dataset: "production", apiVersion: "2024-01-01", useCdn: false });
  const source = await client.fetch<SeoDecisionSourceRows & { copy: CopyDoc[] }>(`{
    "cities": *[_type == "city" && isPublished != false && defined(slug.current)]{
      "citySlug": slug.current, "countrySlug": country->slug.current, "noIndex": seo.noIndex == true
    },
    "districts": *[_type == "district" && isPublished != false && defined(slug.current)]{
      "citySlug": city->slug.current, "districtSlug": slug.current
    },
    "catalogNoIndex": *[_type == "catalogSeoPage" && active == true && pageScope in ["city", "district"] && seo.noIndex == true]{
      pageScope, "citySlug": city->slug.current, "districtSlug": district->slug.current
    },
    "properties": *[_type == "property" && ${PUBLISHED_PROPERTY_FILTER} && defined(city->slug.current)]{
      "citySlug": city->slug.current, "districtSlug": district->slug.current, "deal": status,
      "typeSlug": type->slug.current, bedrooms, price, priceUnit, constructionStage, seaDistanceMeters, beachfront
    },
    "copy": *[_type == "catalogSeoPage" && active == true]{
      pageScope, facet, "citySlug": city->slug.current, "districtSlug": district->slug.current, intro, bottomText
    }
  }`);
  const rows = decideSeoPages(source);
  const copyFor = (family: string, city: string, district?: string, facet?: string) =>
    source.copy.find((d) => {
      if (d.citySlug !== city) return false;
      if (family === "facet") return d.pageScope === "facet" && d.facet === facet && (d.districtSlug ?? undefined) === district;
      if (family === "district") return d.pageScope === "district" && d.districtSlug === district;
      if (family === "city") return d.pageScope === "city";
      return false;
    });

  type Line = { path: string; family: string; locale: string; count: number; words: number; status: string; reason: string };
  const lines: Line[] = [];
  for (const row of rows) {
    const key = row.decision.key;
    if (key.family === "cityType") continue; // typed pages carry generated copy only (fillTypeCityCopy → landingPage)
    const doc = copyFor(
      key.family,
      key.city,
      "district" in key ? key.district : undefined,
      key.family === "facet" ? key.facet : undefined,
    );
    for (const locale of LOCALES) {
      const w = doc ? words(doc.intro?.[locale]) + words(doc.bottomText?.[locale]) : 0;
      const indexed = isSeoPageIndexableIn(row.decision, locale);
      lines.push({
        path: seoPagePath(key, locale),
        family: key.family,
        locale,
        count: row.count,
        words: w,
        status: indexed ? row.decision.status : "noindex",
        reason: indexed ? "" : row.decision.reasons.join("; ") || "locale without demand",
      });
    }
  }
  lines.sort((a, b) => a.path.localeCompare(b.path));

  const thin = lines.filter((l) => l.status !== "noindex" && l.words < THIN_COPY_MIN_WORDS);
  const shown = showAll ? lines : lines.filter((l) => l.status !== "noindex" || l.count >= 10);
  const table = [
    "| page | locale | listings | words | status | note |",
    "|---|---|---:|---:|---|---|",
    ...shown.map(
      (l) =>
        `| ${l.path} | ${l.locale} | ${l.count} | ${l.words}${l.words > 0 && l.words < STUB_WORDS ? " (stub)" : ""} | ${l.status} | ${
          l.status !== "noindex" && l.words < THIN_COPY_MIN_WORDS ? "**thin: indexable, no unique copy**" : l.reason
        } |`,
    ),
  ].join("\n");
  const summary = [
    `Pages with inventory: ${rows.filter((r) => r.decision.key.family !== "cityType").length} (city, district, facet); page × locale rows: ${lines.length}`,
    `Indexable rows: ${lines.filter((l) => l.status !== "noindex").length}; of them thin (< ${THIN_COPY_MIN_WORDS} words of own copy): ${thin.length}`,
  ].join("\n");
  console.log(summary);
  console.log(table);
  if (outPath) {
    writeFileSync(outPath, `# Thin geo and facet pages — ${new Date().toISOString().slice(0, 10)}\n\n${summary}\n\n${table}\n`);
    console.log(`\nwritten ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
