import { describe, expect, it } from "vitest";
import { bulkTouchTimestamps, contentLastmod, latestDate, parseDateOrUndefined } from "../contentLastmod";

describe("bulkTouchTimestamps", () => {
  it("flags a second that two or more documents share, to the second", () => {
    const bulk = bulkTouchTimestamps([
      { _updatedAt: "2026-09-18T14:29:35Z" },
      { _updatedAt: "2026-09-18T14:29:35.000Z" },
      { _updatedAt: "2026-09-18T15:19:21Z" },
      { _updatedAt: undefined },
    ]);
    expect([...bulk]).toEqual(["2026-09-18T14:29:35"]);
  });
});

describe("contentLastmod", () => {
  const bulk = new Set(["2026-09-18T14:29:35"]);

  it("keeps an individual save", () => {
    expect(contentLastmod({ _updatedAt: "2026-09-20T10:00:00Z" }, bulk, "2026-05-04T10:31:58Z")?.toISOString()).toBe(
      "2026-09-20T10:00:00.000Z",
    );
  });

  it("replaces a script run's stamp with the document's own date", () => {
    expect(contentLastmod({ _updatedAt: "2026-09-18T14:29:35Z" }, bulk, "2026-05-04T10:31:58Z")?.toISOString()).toBe(
      "2026-05-04T10:31:58.000Z",
    );
  });

  it("walks the fallbacks in order and never invents a date", () => {
    expect(contentLastmod({ _updatedAt: "2026-09-18T14:29:35Z" }, bulk, undefined, "not a date", "2026-06-01")?.toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
    expect(contentLastmod({ _updatedAt: "2026-09-18T14:29:35Z" }, bulk)).toBeUndefined();
    expect(contentLastmod({}, bulk)).toBeUndefined();
  });
});

describe("latestDate / parseDateOrUndefined", () => {
  it("picks the newest known date and ignores the rest", () => {
    expect(latestDate(undefined, new Date("2026-01-01"), null, new Date("2026-03-01"))?.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(latestDate(undefined, null)).toBeUndefined();
    expect(parseDateOrUndefined("")).toBeUndefined();
    expect(parseDateOrUndefined(new Date(NaN))).toBeUndefined();
  });
});
