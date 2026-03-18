import * as React from "react";
import Cities from "@/components/landing/sections/impl/LocationCarouselSectionImpl";

export async function LocationCarouselSection(
  props: React.ComponentProps<typeof Cities>,
) {
  return <Cities {...props} />;
}

