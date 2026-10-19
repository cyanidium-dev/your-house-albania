import { describe, expect, it } from "vitest";
import {
  TRIMMED_LOCALES,
  indexablePropertyLocales,
  isPropertyLocaleIndexable,
  propertyExperimentArm,
} from "../propertyLocaleExperiment";

const LOCALES = ["en", "uk", "ru", "sq", "it", "pl", "de"] as const;
// The cut of the 2026-09 experiment; the live constant is empty since it closed.
const CUT = ["uk", "pl", "sq"] as const;

describe("propertyExperimentArm", () => {
  it("is stable for a key and blind to case and whitespace", () => {
    const arm = propertyExperimentArm("apartment-2-1-golem-durres-69m2", CUT);
    expect(propertyExperimentArm("apartment-2-1-golem-durres-69m2", CUT)).toBe(arm);
    expect(propertyExperimentArm("  Apartment-2-1-Golem-Durres-69m2 ", CUT)).toBe(arm);
  });

  it("splits a list of keys roughly in half", () => {
    const keys = Array.from({ length: 400 }, (_, i) => `listing-${i}-${(i * 7919) % 1000}`);
    const trimmed = keys.filter((k) => propertyExperimentArm(k, CUT) === "trimmed").length;
    expect(trimmed).toBeGreaterThan(150);
    expect(trimmed).toBeLessThan(250);
  });
});

describe("isPropertyLocaleIndexable", () => {
  const trimmedKey = Array.from({ length: 50 }, (_, i) => `k-${i}`).find((k) => propertyExperimentArm(k, CUT) === "trimmed")!;
  const fullKey = Array.from({ length: 50 }, (_, i) => `k-${i}`).find((k) => propertyExperimentArm(k, CUT) === "full")!;

  it("keeps every locale for the full arm", () => {
    expect(indexablePropertyLocales(fullKey, LOCALES, CUT)).toEqual([...LOCALES]);
  });

  it("drops only the trimmed locales for the trimmed arm", () => {
    const kept = indexablePropertyLocales(trimmedKey, LOCALES, CUT);
    expect(kept).toEqual(LOCALES.filter((l) => !(CUT as readonly string[]).includes(l)));
    for (const l of CUT) expect(isPropertyLocaleIndexable(trimmedKey, l, CUT)).toBe(false);
    expect(isPropertyLocaleIndexable(trimmedKey, "en", CUT)).toBe(true);
  });

  it("is closed: with no trimmed locales every listing is indexed everywhere", () => {
    expect(TRIMMED_LOCALES).toEqual([]);
    expect(propertyExperimentArm(trimmedKey)).toBe("full");
    expect(indexablePropertyLocales(trimmedKey, LOCALES)).toEqual([...LOCALES]);
  });
});
