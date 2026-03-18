import * as React from "react";
import Hero from "@/components/Home/Hero";

export async function HeroSection(props: React.ComponentProps<typeof Hero>) {
  return <Hero {...props} />;
}

