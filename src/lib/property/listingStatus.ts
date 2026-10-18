import { INACTIVE_LISTING_STATUSES, type InactiveListingStatus } from '@/lib/sanity/groq/propertyFilters';

/**
 * The lifecycle state a listing page labels itself with instead of a 404:
 * `sold`, `archived` (withdrawn by the partner import), `reserved`, `rented`.
 * `null` for an active listing (or a legacy one without a status).
 */
export function inactiveListingStatus(lifecycleStatus: string | null | undefined): InactiveListingStatus | null {
  return (INACTIVE_LISTING_STATUSES as readonly string[]).includes(lifecycleStatus ?? '')
    ? (lifecycleStatus as InactiveListingStatus)
    : null;
}
