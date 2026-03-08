import type { FeaturedPropertyImage } from '@/types/domain';
import { featuredProprty } from '@/app/api/featuredproperty';

/**
 * Returns featured property carousel images. Later: replace with Sanity query.
 */
export function getFeaturedPropertyImages(): FeaturedPropertyImage[] {
  return featuredProprty.map((item) => ({
    src: item.scr,
    alt: item.alt,
  }));
}
