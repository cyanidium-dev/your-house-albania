import * as React from "react";
import Investment from "@/components/landing/sections/impl/InvestmentSectionImpl";

export async function InvestmentSection(
  props: React.ComponentProps<typeof Investment>,
) {
  return <Investment {...props} />;
}

