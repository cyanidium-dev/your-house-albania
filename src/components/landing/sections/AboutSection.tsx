import * as React from "react";
import About from "@/components/landing/sections/impl/AboutSectionImpl";

export async function AboutSection(props: React.ComponentProps<typeof About>) {
  return <About {...props} />;
}

