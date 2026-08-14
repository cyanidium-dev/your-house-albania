"use client";

import Link from "next/link";
import type { ConsentCopy } from "../locales";
import {
  bannerActionsClass,
  bannerBodyClass,
  bannerChoiceRowClass,
  bannerClass,
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
        <div>
          <p className={bannerTitleClass}>{copy.banner.title}</p>
          <p className={bannerBodyClass}>
            {copy.banner.body}{" "}
            {policyHref ? (
              /* Policy sentence: inline continuation on mobile, own line on desktop. */
              <span className="lg:block">
                {copy.banner.policyLead}{" "}
                <Link href={policyHref} prefetch={false}>{copy.banner.policyLinkLabel}</Link>.
              </span>
            ) : null}
          </p>
        </div>
        <div className={bannerActionsClass}>
          <ConsentButton variant="ghost" onClick={onCustomise} className="self-start lg:self-auto">
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
