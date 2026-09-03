import { describe, expect, it } from "vitest";
import { mapSanityAgentToContactPage } from "../agentAdapter";

const raw = {
  _id: "agent-1",
  slug: { current: "olga-dervishi" },
  name: "Olga Dervishi",
  email: "olga@example.com",
};

describe("mapSanityAgentToContactPage — isPublished", () => {
  // The flag was added to the agent schema after every current agent document
  // existed, so all of them carry it undefined. Reading undefined as "hidden"
  // would drop all eight agent pages out of the sitemap at once.
  it("treats a missing flag as published", () => {
    expect(mapSanityAgentToContactPage(raw, "en")?.isPublished).toBe(true);
  });

  it("treats an explicit false as unpublished", () => {
    expect(mapSanityAgentToContactPage({ ...raw, isPublished: false }, "en")?.isPublished).toBe(
      false
    );
  });

  it("keeps an explicit true published", () => {
    expect(mapSanityAgentToContactPage({ ...raw, isPublished: true }, "en")?.isPublished).toBe(true);
  });

  it("still returns null for a document with no id or slug", () => {
    expect(mapSanityAgentToContactPage({ ...raw, _id: undefined }, "en")).toBeNull();
    expect(mapSanityAgentToContactPage({ ...raw, slug: { current: "" } }, "en")).toBeNull();
  });
});
