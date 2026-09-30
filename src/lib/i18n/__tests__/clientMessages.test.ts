import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AbstractIntlMessages } from "next-intl";

import { CLIENT_MESSAGE_NAMESPACES, pickClientMessages } from "../clientMessages";

const SRC = path.resolve(__dirname, "../../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(tsx?|mjs|js)$/.test(p) && !/__tests__|\.test\./.test(p) ? [p] : [];
  });
}

/** Every module reachable from a "use client" file: that is the code the provider serves. */
function clientModuleGraph(): Map<string, string> {
  const sources = new Map(walk(SRC).map((f) => [f, readFileSync(f, "utf8")] as const));
  const extensions = ["", ".tsx", ".ts", "/index.tsx", "/index.ts", ".js", ".mjs"];
  const resolve = (from: string, spec: string): string | null => {
    const base = spec.startsWith("@/")
      ? path.join(SRC, spec.slice(2))
      : spec.startsWith(".")
        ? path.resolve(path.dirname(from), spec)
        : null;
    if (!base) return null;
    for (const ext of extensions) if (sources.has(base + ext)) return base + ext;
    return null;
  };
  const importRe =
    /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g;
  const reached = new Map<string, string>();
  const stack = [...sources].filter(([, text]) => /^\s*(['"])use client\1/.test(text)).map(([f]) => f);
  while (stack.length) {
    const file = stack.pop()!;
    if (reached.has(file)) continue;
    const text = sources.get(file)!;
    reached.set(file, text);
    for (const m of text.matchAll(importRe)) {
      const target = resolve(file, m[1] ?? m[2] ?? m[3]);
      if (target && !reached.has(target)) stack.push(target);
    }
  }
  return reached;
}

describe("client message namespaces", () => {
  const graph = clientModuleGraph();

  it("lists every namespace a client module reads", () => {
    const used = new Set<string>();
    const unscoped: string[] = [];
    for (const [file, text] of graph) {
      for (const m of text.matchAll(/useTranslations\(\s*(?:(['"])([A-Za-z0-9_.]+)\1)?\s*\)/g)) {
        if (m[2]) used.add(m[2].split(".")[0]);
        else unscoped.push(path.relative(SRC, file));
      }
      if (/useMessages\(/.test(text)) unscoped.push(path.relative(SRC, file));
    }
    const listed = new Set<string>(CLIENT_MESSAGE_NAMESPACES);
    expect([...used].filter((ns) => !listed.has(ns))).toEqual([]);
    // An unscoped hook or useMessages() would need the whole catalogue.
    expect(unscoped).toEqual([]);
  });

  it("names namespaces that exist in the catalogue", () => {
    const en = JSON.parse(readFileSync(path.resolve(SRC, "../messages/en.json"), "utf8")) as AbstractIntlMessages;
    expect(CLIENT_MESSAGE_NAMESPACES.filter((ns) => !(ns in en))).toEqual([]);
    expect(Object.keys(pickClientMessages(en))).toEqual([...CLIENT_MESSAGE_NAMESPACES]);
  });
});
