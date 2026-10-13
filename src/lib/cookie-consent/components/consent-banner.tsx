"use client";

import Link from "@/components/shared/Link";
import type { ConsentCopy } from "../locales";
import {
  bannerActionsClass,
  bannerBodyClass,
  bannerChoiceRowClass,
  bannerClass,
  bannerInlineButtonClass,
  bannerInnerClass,
  bannerTitleClass,
} from "../styles/classes";
import { ConsentEntryCss, consentBannerInClass } from "../styles/entry-animations";
import { ConsentButton } from "./primitives/consent-button";

type Props = {
  copy: ConsentCopy;
  /** Localized privacy/cookie-policy URL (from CMS siteSettings); the policy sentence is omitted when absent. */
  policyHref?: string;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomise: () => void;
};

export function ConsentBanner({ copy, policyHref, onAcceptAll, onRejectAll, onCustomise }: Props) {
  return (
    <section
      className={`${bannerClass} ${consentBannerInClass}`}
      role="region"
      aria-label={copy.banner.title}
    >
      <ConsentEntryCss />
      <div className={bannerInnerClass}>
        <div className="min-w-0 flex-1 lg:flex-none">
          <p className={bannerTitleClass}>{copy.banner.title}</p>
          {/* Phones: one short sentence, the policy link and "Customise" as
              text, beside the two equal buttons — a strip of about 75px
              instead of a fifth of the screen (audit 2026-10-13). */}
          <p className={`${bannerBodyClass} sm:hidden`}>
            {copy.banner.bodyShort}{" "}
            {policyHref ? (
              <>
                <Link href={policyHref} prefetch={false}>{copy.banner.policyShort}</Link>
                {" · "}
              </>
            ) : null}
            <button type="button" onClick={onCustomise} className={bannerInlineButtonClass}>
              {copy.banner.customise}
            </button>
          </p>
          <p className={`${bannerBodyClass} hidden sm:block`}>
            {copy.banner.body}{" "}
            {policyHref ? (
              /* Policy sentence: inline continuation on tablets, own line on desktop. */
              <span className="lg:block">
                {copy.banner.policyLead}{" "}
                <Link href={policyHref} prefetch={false}>{copy.banner.policyLinkLabel}</Link>.
              </span>
            ) : null}
          </p>
        </div>
        <div className={bannerActionsClass}>
          <ConsentButton variant="ghost" className="hidden sm:inline-flex" onClick={onCustomise}>
            {copy.banner.customise}
          </ConsentButton>
          <div className={bannerChoiceRowClass}>
            <ConsentButton variant="secondary" onClick={onRejectAll}>
              {copy.banner.reject}
            </ConsentButton>
            <ConsentButton variant="primary" onClick={onAcceptAll}>
              {copy.banner.accept}
            </ConsentButton>
          </div>
        </div>
      </div>
    </section>
  );
}
