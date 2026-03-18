import * as React from "react";
import BlogSmall from "@/components/shared/Blog";

export async function ArticlesSection(
  props: React.ComponentProps<typeof BlogSmall>,
) {
  return <BlogSmall {...props} />;
}

