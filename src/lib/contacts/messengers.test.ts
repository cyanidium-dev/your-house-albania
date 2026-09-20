import { describe, expect, it } from "vitest";
import { BUSINESS_TELEGRAM_URL, BUSINESS_WHATSAPP_URL } from "./businessContacts";
import { messengerKeyOf, messengerOrder, nonMessengerLinks, resolveMessengers } from "./messengers";

describe("messengerOrder", () => {
  it.each(["ru", "uk"])("%s puts Telegram first", (locale) => {
    expect(messengerOrder(locale)).toEqual(["telegram", "whatsapp"]);
  });
  it.each(["sq", "en", "it", "pl", "de", "xx"])("%s puts WhatsApp first", (locale) => {
    expect(messengerOrder(locale)).toEqual(["whatsapp", "telegram"]);
  });
});

describe("messengerKeyOf", () => {
  it("reads the URL before the platform name", () => {
    expect(messengerKeyOf({ platform: "Chat", url: BUSINESS_WHATSAPP_URL })).toBe("whatsapp");
    expect(messengerKeyOf({ platform: "Chat", url: BUSINESS_TELEGRAM_URL })).toBe("telegram");
    expect(messengerKeyOf({ platform: "Telegram", url: "https://example.com/tg" })).toBe("telegram");
    expect(messengerKeyOf({ platform: "Instagram", url: "https://instagram.com/domlivo" })).toBeNull();
    expect(messengerKeyOf({ platform: "WhatsApp", url: "javascript:alert(1)" })).toBeNull();
  });
});

describe("resolveMessengers", () => {
  it("falls back to the business links when the CMS has none", () => {
    expect(resolveMessengers(undefined, "en")).toEqual([
      { key: "whatsapp", url: BUSINESS_WHATSAPP_URL },
      { key: "telegram", url: BUSINESS_TELEGRAM_URL },
    ]);
    expect(resolveMessengers([], "ru").map((m) => m.key)).toEqual(["telegram", "whatsapp"]);
  });

  it("prefers a CMS link, contact channel first", () => {
    const links = [
      { platform: "Telegram", url: "https://t.me/other", channel: "social" },
      { platform: "Telegram", url: "https://t.me/sales_team", channel: "contact" },
      { platform: "Instagram", url: "https://instagram.com/domlivo" },
    ];
    expect(resolveMessengers(links, "en")).toEqual([
      { key: "whatsapp", url: BUSINESS_WHATSAPP_URL },
      { key: "telegram", url: "https://t.me/sales_team" },
    ]);
  });

  it("ignores the CMS entries the owners' links replaced", () => {
    const links = [
      { platform: "WhatsApp", url: "https://wa.me/355689286136", channel: "contact" },
      { platform: "Telegram", url: "https://t.me/domlivobot/", channel: "contact" },
    ];
    expect(resolveMessengers(links, "de")).toEqual([
      { key: "whatsapp", url: BUSINESS_WHATSAPP_URL },
      { key: "telegram", url: BUSINESS_TELEGRAM_URL },
    ]);
  });
});

describe("nonMessengerLinks", () => {
  it("keeps only the social profiles", () => {
    expect(
      nonMessengerLinks([
        { platform: "WhatsApp", url: "https://wa.me/355689286136" },
        { platform: "LinkedIn", url: "https://linkedin.com/company/domlivo" },
      ]),
    ).toEqual([{ platform: "LinkedIn", url: "https://linkedin.com/company/domlivo" }]);
  });
});
