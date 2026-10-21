import * as React from "react";
import Link from "@/components/shared/Link";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import type { BreadcrumbItem } from "@/components/shared/Breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { FaqJsonLd } from "@/components/shared/FaqJsonLd";
import { FaqAccordion } from "@/components/shared/faq/FaqAccordion";
import {
  BODY_TEXT,
  CONTAINER,
  MEASURE,
  PAGE_TOP,
  PANEL,
  Section,
  SECTION_LEAD,
  SECTION_TITLE,
  SPLIT,
  SPLIT_ASIDE,
  SPLIT_MAIN,
} from "@/components/shared/layout";
import { toBreadcrumbJsonLdItems } from "@/lib/routes/breadcrumbs";
import { cn } from "@/lib/utils";
import { LinkSnippet } from "./LinkSnippet";

export type MethodRow = { label: string; rule: string; note?: string };
export type RelatedLink = { href: string; label: string };
export type FaqItem = { question: string; answer: string };

const linkClass = "text-primary underline underline-offset-2 hover:no-underline";

/**
 * One standalone calculator page (`/calculators/*`, `lib/calculatorPages`):
 * breadcrumb, H1 and lead, the landing calculator, how it is calculated,
 * FAQ, related pages, and the link to copy.
 */
export function CalculatorPageView({
  baseUrl,
  path,
  crumbs,
  h1,
  lead,
  calculator,
  method,
  faq,
  related,
  linkBox,
}: {
  baseUrl: string;
  /** Path of the page, `/{locale}/calculators/...`. */
  path: string;
  crumbs: BreadcrumbItem[];
  h1: string;
  lead: string;
  calculator: React.ReactNode;
  method: { title: string; rows: MethodRow[]; footnotes: string[] };
  faq: { title: string; items: FaqItem[] };
  related: { title: string; links: RelatedLink[] };
  linkBox: { title: string; lead: string; snippet: string; copyLabel: string; copiedLabel: string; fieldLabel: string };
}) {
  return (
    <main>
      <BreadcrumbJsonLd items={toBreadcrumbJsonLdItems(crumbs, path)} baseUrl={baseUrl} />
      <FaqJsonLd items={faq.items} />

      <section className={PAGE_TOP}>
        <div className={CONTAINER}>
          <Breadcrumb items={crumbs} />
          <div className={cn(MEASURE, "mt-6")}>
            <h1 className={SECTION_TITLE}>{h1}</h1>
            <p className={cn(SECTION_LEAD, "mt-4")}>{lead}</p>
          </div>
        </div>
      </section>

      {calculator}

      <Section aria-labelledby="calc-method-heading">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="calc-method-heading" className={SECTION_TITLE}>
              {method.title}
            </h2>
          </div>
          <div className={SPLIT_MAIN}>
            <dl className={cn(PANEL, "divide-y divide-dark/10 px-6 md:px-8 dark:divide-white/10")}>
              {method.rows.map((row) => (
                <div key={row.label} className="py-5">
                  <dt className="text-base font-medium text-dark dark:text-white">{row.label}</dt>
                  <dd className={cn(BODY_TEXT, "mt-1")}>{row.rule}</dd>
                  {row.note ? (
                    <dd className="mt-1 text-sm leading-relaxed text-dark/60 dark:text-white/60">{row.note}</dd>
                  ) : null}
                </div>
              ))}
            </dl>
            {method.footnotes.map((note) => (
              <p key={note} className={cn(BODY_TEXT, "mt-4")}>
                {note}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {faq.items.length > 0 ? (
        <Section aria-labelledby="calc-faq-heading">
          <div className={SPLIT}>
            <div className={SPLIT_ASIDE}>
              <h2 id="calc-faq-heading" className={SECTION_TITLE}>
                {faq.title}
              </h2>
            </div>
            <div className={SPLIT_MAIN}>
              <FaqAccordion idPrefix="calc-faq" items={faq.items} />
            </div>
          </div>
        </Section>
      ) : null}

      <Section aria-labelledby="calc-related-heading">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="calc-related-heading" className={SECTION_TITLE}>
              {related.title}
            </h2>
          </div>
          <div className={SPLIT_MAIN}>
            <ul className="grid gap-3 text-[17px]">
              {related.links.map((link) => (
                <li key={link.href} className="flex items-start gap-3">
                  <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="calc-link-heading">
        <div className={SPLIT}>
          <div className={SPLIT_ASIDE}>
            <h2 id="calc-link-heading" className={SECTION_TITLE}>
              {linkBox.title}
            </h2>
            <p className={cn(BODY_TEXT, "mt-4")}>{linkBox.lead}</p>
          </div>
          <div className={SPLIT_MAIN}>
            <LinkSnippet
              snippet={linkBox.snippet}
              copyLabel={linkBox.copyLabel}
              copiedLabel={linkBox.copiedLabel}
              fieldLabel={linkBox.fieldLabel}
            />
          </div>
        </div>
      </Section>
    </main>
  );
}
