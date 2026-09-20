import { describe, expect, it } from "vitest";
import {
  agentBioText,
  agentPageRobots,
  hasAgentProfile,
  isAgentPageIndexable,
} from "../agentIndexPolicy";

const PHOTO = { url: "https://cdn.sanity.io/images/x/production/a.jpg" };
const BIO = "Ten years selling on the coast.";

describe("agent page indexability", () => {
  // "Properties by X" over the same cards the city pages show is a thin page.
  it("noindexes an agent with no bio, no photo, or only one of them", () => {
    for (const agent of [
      null,
      {},
      { bio: "", photo: null },
      { bio: BIO, photo: null },
      { bio: "   ", photo: PHOTO },
      { bio: "", photo: PHOTO },
      { bio: BIO, photo: { url: " " } },
    ]) {
      expect(hasAgentProfile(agent)).toBe(false);
      expect(agentPageRobots(agent)).toEqual({ index: false, follow: true });
    }
  });

  it("lets an agent with both a bio and a photo be indexed", () => {
    const agent = { bio: BIO, photo: PHOTO };
    expect(isAgentPageIndexable(agent)).toBe(true);
    expect(agentPageRobots(agent)).toBeUndefined();
    expect(isAgentPageIndexable({ ...agent, isPublished: undefined })).toBe(true);
  });

  it("still noindexes a complete profile that is unpublished or filtered by query", () => {
    const agent = { bio: BIO, photo: PHOTO };
    expect(isAgentPageIndexable({ ...agent, isPublished: false })).toBe(false);
    expect(agentPageRobots(agent, true)).toEqual({ index: false, follow: true });
  });

  it("reads a bio whether it is a string or a localized object", () => {
    expect(agentBioText(BIO)).toBe(BIO);
    expect(agentBioText({ _type: "localizedText", en: BIO })).toBe(BIO);
    expect(agentBioText({ _type: "localizedText", en: "  " })).toBe("");
    expect(agentBioText(null)).toBe("");
  });
});
