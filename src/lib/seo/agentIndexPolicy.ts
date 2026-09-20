/**
 * Whether an agent's page (`/[locale]/agent/{slug}`) may be indexed.
 *
 * Without a profile the page is a title ("Properties by X") over a list of
 * cards that every city and district page already shows: nothing on it is
 * about the agent, so it is `noindex, follow` and stays out of the sitemap.
 * An agent whose CMS document carries both a bio and a photograph has a page
 * that says who they are, and the page renders both — that one is indexable.
 *
 * One predicate, read by the page's robots tag and by `sitemap-static.xml`, so
 * the two cannot disagree.
 */
export type AgentProfileFields = {
  bio?: string | null;
  photo?: { url?: string | null } | null;
  /** False only when an editor has explicitly unpublished the agent. */
  isPublished?: boolean | null;
};

export function hasAgentProfile(agent: AgentProfileFields | null | undefined): boolean {
  if (!agent) return false;
  const bio = typeof agent.bio === "string" ? agent.bio.trim() : "";
  const photoUrl = typeof agent.photo?.url === "string" ? agent.photo.url.trim() : "";
  return bio.length > 0 && photoUrl.length > 0;
}

export function isAgentPageIndexable(agent: AgentProfileFields | null | undefined): boolean {
  return hasAgentProfile(agent) && agent?.isPublished !== false;
}

export const AGENT_PAGE_NOINDEX = { index: false, follow: true } as const;

/** The robots value for an agent page; `undefined` means "indexable, inherit". */
export function agentPageRobots(
  agent: AgentProfileFields | null | undefined,
  otherwiseNoindex = false,
): typeof AGENT_PAGE_NOINDEX | undefined {
  return otherwiseNoindex || !isAgentPageIndexable(agent) ? AGENT_PAGE_NOINDEX : undefined;
}

/** `bio` is a plain string on older agent documents and a localized object on newer ones. */
export function agentBioText(bio: unknown): string {
  if (typeof bio === "string") return bio;
  if (bio && typeof bio === "object") {
    // `_type` / `_key` are Sanity bookkeeping, not copy.
    return Object.entries(bio as Record<string, unknown>)
      .filter(([key, v]) => !key.startsWith("_") && typeof v === "string")
      .map(([, v]) => (v as string).trim())
      .filter(Boolean)
      .join(" ");
  }
  return "";
}
