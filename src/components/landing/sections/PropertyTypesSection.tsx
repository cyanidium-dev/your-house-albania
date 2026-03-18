import * as React from "react";
import PropertyTypes from "@/components/landing/sections/impl/PropertyTypesSectionImpl";

export async function PropertyTypesSection(
  props: React.ComponentProps<typeof PropertyTypes>,
) {
  return <PropertyTypes {...props} />;
}

