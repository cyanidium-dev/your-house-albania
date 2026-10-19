import { describe, expect, it } from "vitest";
import { rotateCatalog, rotationSeed, type RotationRow } from "../rotation";

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
      { _id: "premium-1", promotionType: "premium", agent: "cactus" },
      { _id: "top-1", promoted: true, agent: "getal" },
      ...rows({ cactus: 5, getal: 5 }),
    ];
    const out = rotateCatalog(input, "2026-10-19");
    expect(out.slice(0, 2)).toEqual(["premium-1", "top-1"]);
    expect(out).toHaveLength(input.length);
    expect(new Set(out).size).toBe(input.length);
  });

  it("deals the rest round-robin across agencies", () => {
    const out = rotateCatalog(rows({ cactus: 30, getal: 30, findall: 3, own: 1 }), "2026-10-19");
    // The first round holds one listing of every agency.
    const firstRound = out.slice(0, 4).map((id) => id.replace(/-\d+$/, ""));
    expect(new Set(firstRound).size).toBe(4);
    // No agency twice in a row while the others still have stock.
    for (let i = 1; i < 12; i += 1) {
      expect(out[i].replace(/-\d+$/, "")).not.toBe(out[i - 1].replace(/-\d+$/, ""));
    }
    // The small agencies are exhausted first, the big ones fill the tail.
    expect(out.slice(-20).every((id) => /^(cactus|getal)-/.test(id))).toBe(true);
  });

  it("is the same all day and different the next day", () => {
    const input = rows({ cactus: 40, getal: 40 });
    const a = rotateCatalog(input, "2026-10-19");
    const b = rotateCatalog(input, "2026-10-19");
    const c = rotateCatalog(input, "2026-10-20");
    expect(a).toEqual(b);
    expect(c).not.toEqual(a);
    expect([...c].sort()).toEqual([...a].sort());
  });

  it("puts listings without an agent in one lane of their own", () => {
    const out = rotateCatalog([{ _id: "x" }, { _id: "y" }, { _id: "c-1", agent: "cactus" }], "2026-10-19");
    expect(out).toHaveLength(3);
    expect(out.indexOf("c-1")).toBeLessThan(2);
  });

  it("seeds by the UTC day", () => {
    expect(rotationSeed(new Date("2026-10-19T23:59:00Z"))).toBe("2026-10-19");
    expect(rotationSeed(new Date("2026-10-20T00:01:00Z"))).toBe("2026-10-20");
  });
});
