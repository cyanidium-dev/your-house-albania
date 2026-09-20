import { describe, expect, it } from "vitest";
import { indexableRobots, indexingDisabledRobots, robotsFromFlags } from "../envSeo";
import { buildPropertyMetadata } from "@/lib/sanity/propertySeoAdapter";

describe("indexable robots", () => {
  it("asks for large image previews without changing the index decision", () => {
    expect(indexableRobots).toEqual({ index: true, follow: true, "max-image-preview": "large" });
  });

  it("keeps CMS noindex/nofollow decisions and adds the directive only where the page is indexed", () => {
    expect(robotsFromFlags({})).toBe(indexableRobots);
    expect(robotsFromFlags({ noIndex: true })).toEqual({ index: false, follow: true });
    expect(robotsFromFlags({ noIndex: true, noFollow: true })).toEqual({ index: false, follow: false });
    expect(robotsFromFlags({ noFollow: true })).toEqual({ index: true, follow: false, "max-image-preview": "large" });
  });

  it("never reaches a page that is switched off", () => {
    expect(indexingDisabledRobots).toEqual({ index: false, follow: false });
  });
});

describe("property metadata robots", () => {
  const item = { itemTitle: "Flat", propertyPath: { baseUrl: "https://www.domlivo.com", locale: "en", slug: "flat" } };

  it("is indexable with large previews, and noindex stays noindex", () => {
    const prev = process.env.NEXT_PUBLIC_ENABLE_INDEXING;
    process.env.NEXT_PUBLIC_ENABLE_INDEXING = "true";
    try {
      expect(buildPropertyMetadata(null as never, null as never, "en", item as never).robots).toEqual(indexableRobots);
      expect(buildPropertyMetadata({ noIndex: true } as never, null as never, "en", item as never).robots).toEqual({
        index: false,
        follow: true,
      });
      process.env.NEXT_PUBLIC_ENABLE_INDEXING = "false";
      expect(buildPropertyMetadata(null as never, null as never, "en", item as never).robots).toEqual(indexingDisabledRobots);
    } finally {
      process.env.NEXT_PUBLIC_ENABLE_INDEXING = prev;
    }
  });
});
