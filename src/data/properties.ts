import type { Property } from '@/types/domain';
import { propertyHomes } from '@/app/api/propertyhomes';

/**
 * Returns all properties. Later: replace with Sanity query.
 */
export function getProperties(): Property[] {
  return propertyHomes;
}

/**
 * Returns a property by slug, or undefined if not found. Later: replace with Sanity query.
 */
export function getPropertyBySlug(slug: string): Property | undefined {
  return propertyHomes.find((p) => p.slug === slug);
}
