import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { isCrawlerUserAgent } from "../crawlerClient";

const GOOGLEBOT_DESKTOP =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/128.0.0.0 Safari/537.36";
const GOOGLEBOT_SMARTPHONE =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BINGBOT =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36";
const CHROME_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const LIGHTHOUSE =
  "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse";

describe("crawler detection", () => {
  it("recognises the crawlers that render JavaScript", () => {
    expect(isCrawlerUserAgent(GOOGLEBOT_DESKTOP)).toBe(true);
    expect(isCrawlerUserAgent(GOOGLEBOT_SMARTPHONE)).toBe(true);
    expect(isCrawlerUserAgent(BINGBOT)).toBe(true);
    expect(isCrawlerUserAgent("Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)")).toBe(true);
  });

  it("leaves visitors and lab tools alone", () => {
    expect(isCrawlerUserAgent(CHROME_DESKTOP)).toBe(false);
    expect(isCrawlerUserAgent(SAFARI_IPHONE)).toBe(false);
    expect(isCrawlerUserAgent(LIGHTHOUSE)).toBe(false);
    expect(isCrawlerUserAgent("")).toBe(false);
  });
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.tsx?$/.test(p) ? [p] : [];
  });
}

describe("the site's Link", () => {
  it("is the only module that imports next/link", () => {
    const src = path.resolve(__dirname, "../../..");
    const offenders = walk(src)
      .filter((f) => /from ['"]next\/link['"]/.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(src, f).split(path.sep).join("/"));
    expect(offenders).toEqual(["components/shared/Link.tsx"]);
    // Reads every source file; under a full parallel run that took over the
    // default 5 s on Windows (2026-10-09).
  }, 30_000);
});
