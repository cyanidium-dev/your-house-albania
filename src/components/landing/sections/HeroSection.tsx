import * as React from "react";
import Hero from "@/components/landing/sections/impl/HeroSectionImpl";

export async function HeroSection(props: React.ComponentProps<typeof Hero>) {
  return <Hero {...props} />;
}
