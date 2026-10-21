import { describe, expect, it } from "vitest";
import { localizePurchaseSection, localizeRoiSection, type CmsTranslate } from "../localize";

const purchase = {
  enabled: true,
  disclaimer: { en: "Indicative amounts." },
  items: [
    { _key: "cost0", kind: "percent", value: 0.35, label: { en: "Notary (≈0.35%)" }, note: { en: "Official scale." } },
    { _key: "cost1", kind: "fixed", value: 38, label: { en: "ASHK registration", uk: "Реєстрація (Sanity)" } },
    { _key: "cost9", kind: "fixed", value: 10, label: { en: "New line" } },
    { _key: "bad", kind: "other", value: 5, label: { en: "Skipped" } },
  ],
};

const messages: Record<string, string> = {
  "cms.purchaseDisclaimer": "Орієнтовні суми.",
  "cms.items.cost0.label": "Нотаріус (≈{pct})",
  "cms.items.cost0.note": "Офіційна шкала.",
  "cms.items.cost1.label": "Реєстрація в ASHK",
  "cms.presets.strm": "Подобова з управителем ({pct})",
};
const tr: CmsTranslate = (key, values) => {
  const m = messages[key];
  if (!m) return null;
  return m.replace(/\{(\w+)\}/g, (_, k) => String(values?.[k] ?? ""));
};

describe("calculator page localization", () => {
  it("keeps the Sanity English text on English pages", () => {
    const out = localizePurchaseSection(purchase, "en", tr)!;
    expect(out.items.map((i) => i.label)).toEqual(["Notary (≈0.35%)", "ASHK registration", "New line"]);
    expect(out.disclaimer).toBe("Indicative amounts.");
  });

  it("prefers the field's own locale, then the messages with the Sanity figure, then English", () => {
    const out = localizePurchaseSection(purchase, "uk", tr)!;
    expect(out.items[0].label).toBe(`Нотаріус (≈${new Intl.NumberFormat("uk", { style: "percent", maximumFractionDigits: 2 }).format(0.0035)})`);
    expect(out.items[0].note).toBe("Офіційна шкала.");
    expect(out.items[1].label).toBe("Реєстрація (Sanity)");
    expect(out.items[2].label).toBe("New line");
    expect(out.disclaimer).toBe("Орієнтовні суми.");
    // The section component reads the resolved text under every locale key.
    expect(out.section.items[0].label.uk).toBe(out.items[0].label);
    expect(out.section.items[0].value).toBe(0.35);
  });

  it("drops unknown kinds and renders nothing without a disclaimer", () => {
    expect(localizePurchaseSection(purchase, "en", tr)!.items).toHaveLength(3);
    expect(localizePurchaseSection({ ...purchase, disclaimer: undefined }, "en", tr)).toBeNull();
    expect(localizePurchaseSection({ ...purchase, enabled: false }, "en", tr)).toBeNull();
  });

  it("labels ROI presets with their management fee and keeps the tax rate", () => {
    const out = localizeRoiSection(
      {
        enabled: true,
        disclaimer: { en: "Estimate." },
        taxRatePct: 15,
        presets: [{ _key: "strm", rentalType: "str", adrEur: 68, occupancyPct: 47, mgmtFeePct: 25, label: { en: "With a manager (25%)" } }],
      },
      "uk",
      tr,
    )!;
    expect(out.taxRatePct).toBe(15);
    expect(out.presets[0].label).toMatch(/^Подобова з управителем \(25/);
    expect(out.presets[0].adrEur).toBe(68);
  });
});
