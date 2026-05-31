import * as React from "react";
import type { MarketingContentData } from "./marketing/types";
import { SplitVariant } from "./marketing/SplitVariant";
import { SplitDarkVariant } from "./marketing/SplitDarkVariant";
import { GroupedVariant } from "./marketing/GroupedVariant";

export type {
  MarketingVariant,
  MarketingHighlightCard,
  MarketingBenefitItem,
  MarketingContentGroup,
  MarketingContentData,
} from "./marketing/types";

const MarketingContentSectionImpl: React.FC<{
  locale: string;
  data: MarketingContentData;
}> = ({ locale, data }) => {
  if (data.variant === "grouped") {
    return <GroupedVariant locale={locale} data={data} />;
  }
  if (data.variant === "splitDark") {
    return <SplitDarkVariant locale={locale} data={data} />;
  }
  return <SplitVariant locale={locale} data={data} />;
};

export default MarketingContentSectionImpl;
