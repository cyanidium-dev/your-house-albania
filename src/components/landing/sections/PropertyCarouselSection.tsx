import * as React from "react";
import Properties from "@/components/landing/sections/impl/PropertyCarouselSectionImpl";

export async function PropertyCarouselSection(
  props: React.ComponentProps<typeof Properties>,
) {
  return <Properties {...props} />;
}
