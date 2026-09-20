import { describe, expect, it } from "vitest";
import { isRealPhone, realPhoneOrEmpty } from "./phone";

describe("isRealPhone", () => {
  it.each([
    [undefined, false],
    [null, false],
    ["", false],
    ["   ", false],
    ["+355 69 000 0000", false],
    ["+355690000000", false],
    ["+355 (69) 000-0000", false],
    ["+1 555 000 0000", false],
    ["0000000", false],
    ["1111111", false],
    ["12345", false],
    ["call us", false],
    ["+355 68 928 6136", true],
    ["+355 4 450 0012", true],
    ["+39 06 1000 0001", true],
  ])("%s → %s", (value, expected) => {
    expect(isRealPhone(value)).toBe(expected);
  });
});

describe("realPhoneOrEmpty", () => {
  it("trims a real number and blanks a placeholder", () => {
    expect(realPhoneOrEmpty("  +355 68 928 6136 ")).toBe("+355 68 928 6136");
    expect(realPhoneOrEmpty("+355 69 000 0000")).toBe("");
    expect(realPhoneOrEmpty(undefined)).toBe("");
  });
});
