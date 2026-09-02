import Anthropic from '@anthropic-ai/sdk'

/**
 * Anthropic client for the assistant route.
 *
 * The key type decides whether a workspace header is required. A classic
 * workspace-scoped key carries its workspace implicitly; an identity-linked key
 * does not, and the API rejects the request with
 * "anthropic-workspace-id is required" until the header names one. Supporting
 * both is one optional environment variable, so the feature does not depend on
 * which kind of key someone happened to create.
 */
export function createAnthropicClient(): Anthropic {
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim()
  return new Anthropic({
    ...(workspaceId ? { defaultHeaders: { 'anthropic-workspace-id': workspaceId } } : {}),
  })
}
