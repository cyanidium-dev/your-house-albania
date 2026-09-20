/**
 * Render-time preparation of the legal landings (`/privacy`, `/terms`).
 *
 * The copy lives in Sanity (`landing-privacy`, `landing-terms`, written by
 * `create:legal-pages` in domlivo-admin). Three facts could not be read out of
 * code when it was written, and the script marked them in the text itself:
 *
 *   TODO(legal): the registered entity operating this site, its registration
 *                number and registered address belong here.        (privacy)
 *   TODO(legal): state a definite retention period for those messages and
 *                delete on that schedule.                           (privacy)
 *   TODO(legal): confirm the competent forum and name it here.      (terms)
 *
 * Those markers were published verbatim, in English, on all seven locales of a
 * page that is linked from every footer. They are still open — nobody may
 * invent a legal entity, a retention period or a court — but a visitor should
 * not be reading our to-do list inside a privacy policy. So, until the CMS copy
 * is completed:
 *
 *  - the entity marker is replaced by a true sentence: who operates the site
 *    and how to reach them;
 *  - every other marker is removed from the rendered page.
 *
 * Nothing is written back to the CMS. When the owner fills the facts in there,
 * the markers disappear from the source and this module becomes a no-op.
 */

// TODO(legal): the registered entity operating this site, its registration
// number and registered address belong in the privacy policy's "Who we are".
// TODO(legal): state a definite retention period for the lead messages kept in
// Telegram ("Where form submissions go") and delete on that schedule.
// TODO(legal): confirm the competent forum and name it in the terms'
// "Governing law" section.

const TODO_MARKER = /^\s*TODO\s*\(\s*legal\s*\)/i;
/** The marker that asks for the operating entity (English and Russian source copy). */
const ENTITY_MARKER = /registered entity|юридическое лицо/i;

export type OperatorContacts = {
  email: string;
  whatsappUrl: string;
  telegramUrl: string;
};

type Span = { _type?: string; _key?: string; text?: string; marks?: string[] };
type Block = {
  _type?: string;
  _key?: string;
  style?: string;
  children?: Span[];
  markDefs?: Array<{ _key: string; _type: string; href?: string }>;
  [key: string]: unknown;
};

function blockText(block: Block): string {
  return (block.children ?? []).map((c) => (typeof c?.text === "string" ? c.text : "")).join("");
}

export function isLegalTodoBlock(block: unknown): boolean {
  if (!block || typeof block !== "object") return false;
  const b = block as Block;
  if (b._type !== "block") return false;
  return TODO_MARKER.test(blockText(b));
}

/**
 * Portable Text paragraph from a template such as
 * `"Operated by the Domlivo team. Write to {email}, {whatsapp} or {telegram}."`
 * — the three placeholders become links, everything else plain text.
 */
export function buildOperatorBlock(template: string, contacts: OperatorContacts, key: string): Block {
  const links: Record<string, { label: string; href: string }> = {
    email: { label: contacts.email, href: `mailto:${contacts.email}` },
    whatsapp: { label: "WhatsApp", href: contacts.whatsappUrl },
    telegram: { label: "Telegram", href: contacts.telegramUrl },
  };
  const children: Span[] = [];
  const markDefs: NonNullable<Block["markDefs"]> = [];
  const parts = template.split(/(\{(?:email|whatsapp|telegram)\})/g).filter((p) => p !== "");
  parts.forEach((part, i) => {
    const name = /^\{(email|whatsapp|telegram)\}$/.exec(part)?.[1];
    if (name) {
      const markKey = `${key}-link-${name}`;
      if (!markDefs.some((m) => m._key === markKey)) {
        markDefs.push({ _key: markKey, _type: "link", href: links[name].href });
      }
      children.push({ _type: "span", _key: `${key}-s${i}`, text: links[name].label, marks: [markKey] });
    } else {
      children.push({ _type: "span", _key: `${key}-s${i}`, text: part, marks: [] });
    }
  });
  return { _type: "block", _key: key, style: "normal", markDefs, children };
}

function cleanBlocks(blocks: unknown[], operatorBlock: Block | null): unknown[] {
  const out: unknown[] = [];
  for (const block of blocks) {
    if (!isLegalTodoBlock(block)) {
      out.push(block);
      continue;
    }
    if (operatorBlock && ENTITY_MARKER.test(blockText(block as Block))) {
      out.push({ ...operatorBlock, _key: (block as Block)._key ?? operatorBlock._key });
    }
    // Any other marker: dropped from the page, kept in the comment above.
  }
  return out;
}

function cleanContent(content: unknown, operatorBlock: Block | null): unknown {
  if (Array.isArray(content)) return cleanBlocks(content, operatorBlock);
  if (content && typeof content === "object") {
    const out: Record<string, unknown> = {};
    for (const [locale, value] of Object.entries(content as Record<string, unknown>)) {
      out[locale] = Array.isArray(value) ? cleanBlocks(value, operatorBlock) : value;
    }
    return out;
  }
  return content;
}

type Section = { _type?: string; content?: unknown; body?: unknown; [key: string]: unknown };
type Landing = { pageSections?: Section[]; [key: string]: unknown };

/**
 * Returns a copy of the landing with the `TODO(legal)` markers handled and the
 * first text section's title promoted to the page's `<h1>` (the legal pages
 * have no hero, so without this they rendered an `<h2>` and no `<h1>` at all).
 */
export function prepareLegalLanding<T>(
  landing: T,
  options: { operatorTemplate?: string; contacts?: OperatorContacts } = {},
): T {
  const doc = landing as unknown as Landing | null;
  if (!doc || !Array.isArray(doc.pageSections)) return landing;
  const operatorBlock =
    options.operatorTemplate?.trim() && options.contacts
      ? buildOperatorBlock(options.operatorTemplate.trim(), options.contacts, "legal-operator")
      : null;

  let h1Assigned = false;
  const pageSections = doc.pageSections.map((section) => {
    if (section?._type !== "seoTextSection") return section;
    const next: Section = { ...section };
    if ("content" in next) next.content = cleanContent(next.content, operatorBlock);
    if ("body" in next) next.body = cleanContent(next.body, operatorBlock);
    if (!h1Assigned) {
      next.headingLevel = 1;
      h1Assigned = true;
    }
    return next;
  });
  return { ...doc, pageSections } as unknown as T;
}
