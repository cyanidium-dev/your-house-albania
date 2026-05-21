import type { ReactNode } from 'react';

/** Single section entry passed from server to client editor shell. */
export type InitialEditorSection = {
  /** Stable Sanity array `_key` — the only identity used for reorder. */
  key: string;
  /** Section discriminator (`heroSection`, `faqSection`, …). Presentational only. */
  type: string;
  /** Original index before editor mutations. */
  index: number;
  /** Server-rendered section output. Never modified in editor. */
  node: ReactNode;
};

/** Successful reorder API response. */
export type ReorderOk = { ok: true; order: string[] };
/** Failed reorder API response. */
export type ReorderErr = { ok: false; reason: string };
export type ReorderResponse = ReorderOk | ReorderErr;
