import * as React from "react";
import type { PropertiesDealParam } from "@/lib/catalog/propertiesDealFromLanding";
import PropertyTypes from "@/components/landing/sections/impl/PropertyTypesSectionImpl";
import type { PropertyTypesData } from "@/components/landing/sections/impl/PropertyTypesSectionImpl";

export async function PropertyTypesSection(props: {
  locale: string;
  propertyTypesData?: PropertyTypesData;
  propertiesDeal?: PropertiesDealParam;
}) {
  return <PropertyTypes {...props} />;
}

