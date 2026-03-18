import * as React from "react";
import Properties from "@/components/Home/Properties";

export async function PropertyCarouselSection(
  props: React.ComponentProps<typeof Properties>,
) {
  return <Properties {...props} />;
}

