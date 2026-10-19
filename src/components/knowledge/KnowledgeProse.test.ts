import { describe, expect, it } from "vitest";
import { parseProse } from "./KnowledgeProse";

describe("parseProse", () => {
  it("reads paragraphs, bullets, and a paragraph right after bullets", () => {
    expect(parseProse("First para.\n\n- one\n- two\nAfter the list.\n\nLast\nline joined.")).toEqual([
      { kind: "p", text: "First para." },
      { kind: "ul", items: ["one", "two"] },
      { kind: "p", text: "After the list." },
      { kind: "p", text: "Last line joined." },
    ]);
  });
});
