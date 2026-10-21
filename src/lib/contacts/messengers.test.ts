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

describe("resolveMessengers with the listing agent's contacts", () => {
  const context = { whatsappText: "Hello, I'm interested in https://www.domlivo.com/en/property/x" };

  it("sends both messengers to the agent and marks them", () => {
    const links = resolveMessengers(undefined, "en", context, {
      phone: "+355 69 430 7494",
      telegramUrl: "https://t.me/domlivo_paul",
    });
    const wa = links.find((l) => l.key === "whatsapp")!;
    const tg = links.find((l) => l.key === "telegram")!;
    expect(wa.agent).toBe(true);
    expect(wa.url.startsWith("https://wa.me/355694307494?text=")).toBe(true);
    expect(tg).toEqual({ key: "telegram", url: "https://t.me/domlivo_paul", agent: true });
  });

  it("falls back to the platform for a contact the agent lacks", () => {
    const links = resolveMessengers(undefined, "en", undefined, { phone: null, telegramUrl: "https://t.me/domlivo_paul" });
    expect(links.find((l) => l.key === "whatsapp")).toEqual({ key: "whatsapp", url: BUSINESS_WHATSAPP_URL });
  });

  it("ignores contacts that are not a phone or a t.me profile", () => {
    const links = resolveMessengers(undefined, "en", undefined, { phone: "call us", telegramUrl: "https://example.com/x" });
    expect(links.every((l) => !l.agent)).toBe(true);
  });
});
