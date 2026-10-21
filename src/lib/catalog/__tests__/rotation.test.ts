import { describe, expect, it } from "vitest";
import { qualityScore, rotateCatalog, rotationSeed, type RotationRow } from "../rotation";

function rows(spec: Record<string, number>): RotationRow[] {
  const out: RotationRow[] = [];
  for (const [agent, n] of Object.entries(spec)) {
    for (let i = 0; i < n; i += 1) out.push({ _id: `${agent}-${i}`, agent });
  }
  return out;
}

describe("rotateCatalog", () => {
  it("keeps paid slots first, in the order given", () => {
    const input: RotationRow[] = [
      { _id: "premium-1", promotionType: "premium", agent: "adrian" },
      { _id: "top-1", promoted: true, agent: "getal" },
      ...rows({ adrian: 5, getal: 5 }),
    ];
    const out = rotateCatalog(input, "2026-10-19");
    expect(out.slice(0, 2)).toEqual(["premium-1", "top-1"]);
    expect(out).toHaveLength(input.length);
    expect(new Set(out).size).toBe(input.length);
  });

  it("deals the rest round-robin across agencies", () => {
    const out = rotateCatalog(rows({ adrian: 30, getal: 30, findall: 3, own: 1 }), "2026-10-19");
    // The first round holds one listing of every agency.
    const firstRound = out.slice(0, 4).map((id) => id.replace(/-\d+$/, ""));
    expect(new Set(firstRound).size).toBe(4);
    // No agency twice in a row while the others still have stock.
    for (let i = 1; i < 12; i += 1) {
      expect(out[i].replace(/-\d+$/, "")).not.toBe(out[i - 1].replace(/-\d+$/, ""));
    }
    // The small agencies are exhausted first, the big ones fill the tail.
    expect(out.slice(-20).every((id) => /^(adrian|getal)-/.test(id))).toBe(true);
  });

  it("is the same all day and different the next day", () => {
    const input = rows({ adrian: 40, getal: 40 });
    const a = rotateCatalog(input, "2026-10-19");
    const b = rotateCatalog(input, "2026-10-19");
    const c = rotateCatalog(input, "2026-10-20");
    expect(a).toEqual(b);
    expect(c).not.toEqual(a);
    expect([...c].sort()).toEqual([...a].sort());
  });

  it("puts listings without an agent in one lane of their own", () => {
    const out = rotateCatalog([{ _id: "x" }, { _id: "y" }, { _id: "c-1", agent: "adrian" }], "2026-10-19");
    expect(out).toHaveLength(3);
    expect(out.indexOf("c-1")).toBeLessThan(2);
  });

  it("seeds by the UTC day", () => {
    expect(rotationSeed(new Date("2026-10-19T23:59:00Z"))).toBe("2026-10-19");
    expect(rotationSeed(new Date("2026-10-20T00:01:00Z"))).toBe("2026-10-20");
  });

  it("puts Grinchenko and the best quarter of Cactus first, alternating", () => {
    const input: RotationRow[] = [
      { _id: "paid-1", promoted: true, agent: "adrian" },
      ...rows({ "real-estate-al": 4, cactus: 20, adrian: 20 }),
    ];
    // Make two Cactus listings clearly the best.
    input.find((r) => r._id === "cactus-7")!.photos = 15;
    input.find((r) => r._id === "cactus-7")!.views = 500;
    input.find((r) => r._id === "cactus-3")!.photos = 12;
    input.find((r) => r._id === "cactus-3")!.price = 90000;
    const out = rotateCatalog(input, "2026-10-21");
    expect(out[0]).toBe("paid-1");
    const block = out.slice(1, 10);
    // 4 Grinchenko + ceil(20 * 0.25) = 5 Cactus, alternating from Grinchenko.
    expect(block.filter((id) => id.startsWith("real-estate-al-"))).toHaveLength(4);
    expect(block.filter((id) => id.startsWith("cactus-"))).toHaveLength(5);
    expect(block.slice(0, 2).map((id) => id.split("-")[0])).toEqual(["real", "cactus"]);
    expect(block).toContain("cactus-7");
    expect(block).toContain("cactus-3");
    // Everything is still there exactly once, the rest of Cactus in the rotation.
    expect(out).toHaveLength(input.length);
    expect(new Set(out).size).toBe(input.length);
    expect(out.slice(10).some((id) => id.startsWith("cactus-"))).toBe(true);
  });

  it("caps the Cactus share at 40", () => {
    const out = rotateCatalog(rows({ cactus: 400, adrian: 10 }), "2026-10-21");
    expect(out.slice(0, 40).every((id) => id.startsWith("cactus-"))).toBe(true);
    expect(out.slice(40, 42).some((id) => id.startsWith("adrian-"))).toBe(true);
  });

  it("scores photos, interest, price and freshness", () => {
    const seed = "2026-10-21";
    const bare = qualityScore({ _id: "a" }, seed);
    const rich = qualityScore(
      { _id: "a", photos: 15, views: 300, saves: 10, price: 100000, area: 60, createdAt: "2026-10-20T00:00:00Z" },
      seed,
    );
    expect(rich - bare).toBeGreaterThan(7);
    expect(bare).toBeLessThan(0.76);
  });
});
