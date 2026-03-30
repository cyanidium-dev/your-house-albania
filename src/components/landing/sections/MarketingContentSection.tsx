import * as React from 'react'
import MarketingContentSectionImpl from '@/components/landing/sections/impl/MarketingContentSectionImpl'

export async function MarketingContentSection(props: React.ComponentProps<typeof MarketingContentSectionImpl>) {
  return <MarketingContentSectionImpl {...props} />
}

export type {
  MarketingContentData,
  MarketingContentGroup,
  MarketingHighlightCard,
  MarketingVariant,
} from '@/components/landing/sections/impl/MarketingContentSectionImpl'
