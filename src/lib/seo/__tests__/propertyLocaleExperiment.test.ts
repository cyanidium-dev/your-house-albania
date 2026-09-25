import { describe, expect, it } from "vitest";
import {
  TRIMMED_LOCALES,
  indexablePropertyLocales,
  isPropertyLocaleIndexable,
  propertyExperimentArm,
} from "../propertyLocaleExperiment";

const LOCALES = ["en", "uk", "ru", "sq", "it", "pl", "de"] as const;

describe("propertyExperimentArm", () => {
  it("is stable for a key and blind to case and whitespace", () => {
    const arm = propertyExperimentArm("apartment-2-1-golem-durres-69m2");
    expect(propertyExperimentArm("apartment-2-1-golem-durres-69m2")).toBe(arm);
    expect(propertyExperimentArm("  Apartment-2-1-Golem-Durres-69m2 ")).toBe(arm);
  });

  it("splits a list of keys roughly in half", () => {
    const keys = Array.from({ length: 400 }, (_, i) => `listing-${i}-${(i * 7919) % 1000}`);
    const trimmed = keys.filter((k) => propertyExperimentArm(k) === "trimmed").length;
    expect(trimmed).toBeGreaterThan(150);
    expect(trimmed).toBeLessThan(250);
  });
});

describe("isPropertyLocaleIndexable", () => {
  const trimmedKey = Array.from({ length: 50 }, (_, i) => `k-${i}`).find((k) => propertyExperimentArm(k) === "trimmed")!;
  const fullKey = Array.from({ length: 50 }, (_, i) => `k-${i}`).find((k) => propertyExperimentArm(k) === "full")!;

  it("keeps every locale for the full arm", () => {
    expect(indexablePropertyLocales(fullKey, LOCALES)).toEqual([...LOCALES]);
  });

  it("drops only the trimmed locales for the trimmed arm", () => {
    const kept = indexablePropertyLocales(trimmedKey, LOCALES);
    expect(kept).toEqual(LOCALES.filter((l) => !TRIMMED_LOCALES.includes(l)));
    for (const l of TRIMMED_LOCALES) expect(isPropertyLocaleIndexable(trimmedKey, l)).toBe(false);
    expect(isPropertyLocaleIndexable(trimmedKey, "en")).toBe(true);
  });
});
