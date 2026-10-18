import { describe, expect, it } from "vitest";
import { searchWithoutFirstPageParam } from "../pageParam";

const clean = (search: string) => searchWithoutFirstPageParam(new URLSearchParams(search));

describe("searchWithoutFirstPageParam", () => {
  it("drops page=1, page=0 and non-numbers", () => {
    expect(clean("page=1")).toBe("");
    expect(clean("page=0")).toBe("");
    expect(clean("page=abc")).toBe("");
    expect(clean("page=")).toBe("");
    expect(clean("page=-2")).toBe("");
    expect(clean("page=01")).toBe("");
  });

  it("keeps the other parameters", () => {
    expect(clean("types=apartment&page=1&sort=newest")).toBe("?types=apartment&sort=newest");
  });

  it("leaves a later page and a URL without page alone", () => {
    expect(clean("page=2")).toBeNull();
    expect(clean("page=31&sort=newest")).toBeNull();
    expect(clean("")).toBeNull();
    expect(clean("sort=newest")).toBeNull();
  });

  it("collapses repeated page values to the first later page", () => {
    expect(clean("page=1&page=3")).toBe("?page=3");
    expect(clean("page=a&page=b")).toBe("");
  });
});
