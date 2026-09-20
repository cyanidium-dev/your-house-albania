import { describe, expect, it } from "vitest";
import { buildOperatorBlock, isLegalTodoBlock, prepareLegalLanding } from "./legalLanding";
import en from "../../../messages/en.json";
import de from "../../../messages/de.json";
import it_ from "../../../messages/it.json";
import pl from "../../../messages/pl.json";
import ru from "../../../messages/ru.json";
import sq from "../../../messages/sq.json";
import uk from "../../../messages/uk.json";

const CONTACTS = {
  email: "hello@domlivo.com",
  whatsappUrl: "https://wa.me/message/KPXIGD5DJISGO1",
  telegramUrl: "https://t.me/real_estate_al",
};

const p = (key: string, text: string) => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-s`, marks: [], text }],
});

const ENTITY_EN =
  "TODO(legal): the registered entity operating this site, its registration number and registered address belong here.";
const ENTITY_RU =
  "TODO(legal): здесь должны стоять юридическое лицо, эксплуатирующее сайт, его регистрационный номер и юридический адрес.";
const RETENTION =
  "TODO(legal): state a definite retention period for those messages and delete on that schedule.";
const FORUM = "TODO(legal): confirm the competent forum and name it here.";

function landing() {
  return {
    _id: "landing-privacy",
    pageSections: [
      {
        _type: "seoTextSection",
        _key: "legal-body",
        title: { en: "Privacy Policy" },
        content: {
          en: [p("a", "For anything in this policy, write to hello@domlivo.com."), p("b", ENTITY_EN), p("c", "A submitted form is delivered to our team."), p("d", RETENTION), p("e", FORUM)],
          ru: [p("a", "По любому вопросу пишите."), p("b", ENTITY_RU), p("d", RETENTION)],
        },
      },
      { _type: "seoTextSection", _key: "second", title: { en: "Second" }, content: { en: [p("x", "Text")] } },
    ],
  };
}

function text(block: unknown): string {
  return ((block as { children: { text: string }[] }).children ?? []).map((c) => c.text).join("");
}

describe("prepareLegalLanding", () => {
  const out = prepareLegalLanding(landing(), {
    operatorTemplate: "This site is operated by the Domlivo team. You can reach us at {email}, on {whatsapp} or on {telegram}.",
    contacts: CONTACTS,
  });
  const content = out.pageSections[0].content as unknown as Record<string, unknown[]>;

  it("never lets a TODO(legal) marker reach the page, in any locale", () => {
    expect(JSON.stringify(out)).not.toContain("TODO");
    for (const blocks of Object.values(content)) {
      expect(blocks.some(isLegalTodoBlock)).toBe(false);
    }
  });

  it("replaces the entity marker with the operator sentence, links included", () => {
    const block = content.en[1] as { markDefs: { href: string }[] };
    expect(text(block)).toBe(
      "This site is operated by the Domlivo team. You can reach us at hello@domlivo.com, on WhatsApp or on Telegram."
    );
    expect(block.markDefs.map((m) => m.href)).toEqual([
      "mailto:hello@domlivo.com",
      CONTACTS.whatsappUrl,
      CONTACTS.telegramUrl,
    ]);
    // The Russian source marker is recognised too.
    expect(text(content.ru[1])).toContain("Domlivo");
  });

  it("removes the retention and forum markers and keeps everything else", () => {
    expect(content.en.map(text)).toEqual([
      "For anything in this policy, write to hello@domlivo.com.",
      expect.stringContaining("operated by the Domlivo team"),
      "A submitted form is delivered to our team.",
    ]);
    expect(content.ru).toHaveLength(2);
  });

  it("promotes only the first text section's title to the h1", () => {
    expect((out.pageSections[0] as { headingLevel?: number }).headingLevel).toBe(1);
    expect((out.pageSections[1] as { headingLevel?: number }).headingLevel).toBeUndefined();
  });

  it("does not mutate the cached CMS document", () => {
    const source = landing();
    prepareLegalLanding(source, { operatorTemplate: "x {email}", contacts: CONTACTS });
    expect(JSON.stringify(source)).toContain("TODO(legal)");
  });

  it("drops the entity marker rather than showing it when no template is given", () => {
    expect(JSON.stringify(prepareLegalLanding(landing()))).not.toContain("TODO");
  });
});

describe("Legal.operatorNotice", () => {
  it("exists in every locale with all three contact placeholders", () => {
    for (const messages of [en, de, it_, pl, ru, sq, uk]) {
      const template = (messages as { Legal: { operatorNotice: string } }).Legal.operatorNotice;
      for (const placeholder of ["{email}", "{whatsapp}", "{telegram}"]) {
        expect(template).toContain(placeholder);
      }
      expect(template).toContain("Domlivo");
      const block = buildOperatorBlock(template, CONTACTS, "k");
      expect(block.markDefs).toHaveLength(3);
    }
  });
});
