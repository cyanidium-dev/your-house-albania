import { describe, expect, it } from "vitest";
import {
  KNOWLEDGE_LINKS_BY_BLOG_POST,
  KNOWLEDGE_LINKS_BY_CITY,
  KNOWLEDGE_LINKS_ON_METHODOLOGY,
  KNOWLEDGE_SLUGS,
} from "./links";

describe("knowledge links", () => {
  const all = [
    ...Object.values(KNOWLEDGE_LINKS_BY_BLOG_POST).flat(),
    ...Object.values(KNOWLEDGE_LINKS_BY_CITY).flat(),
    ...KNOWLEDGE_LINKS_ON_METHODOLOGY,
  ];

  it("gives every question page at least two incoming links", () => {
    for (const slug of Object.values(KNOWLEDGE_SLUGS)) {
      expect(all.filter((s) => s === slug).length, slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("links only to known question pages, at most three per page, without repeats", () => {
    const known = new Set<string>(Object.values(KNOWLEDGE_SLUGS));
    for (const list of [...Object.values(KNOWLEDGE_LINKS_BY_BLOG_POST), ...Object.values(KNOWLEDGE_LINKS_BY_CITY)]) {
      expect(list.length).toBeLessThanOrEqual(3);
      expect(new Set(list).size).toBe(list.length);
      for (const slug of list) expect(known.has(slug), slug).toBe(true);
    }
  });
});
