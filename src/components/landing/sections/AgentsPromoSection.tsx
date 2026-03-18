import * as React from "react";
import AgentsPromo from "@/components/landing/sections/impl/AgentsPromoSectionImpl";

export async function AgentsPromoSection(
  props: React.ComponentProps<typeof AgentsPromo>,
) {
  return <AgentsPromo {...props} />;
}

