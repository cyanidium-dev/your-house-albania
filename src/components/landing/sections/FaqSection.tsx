import * as React from "react";
import FAQ from "@/components/landing/sections/impl/FaqSectionImpl";

export async function FaqSection(props: React.ComponentProps<typeof FAQ>) {
  return <FAQ {...props} />;
}

