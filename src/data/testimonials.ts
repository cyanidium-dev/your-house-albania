import type { Testimonial } from '@/types/domain';
import { testimonials } from '@/app/api/testimonial';

/**
 * Returns all testimonials. Later: replace with Sanity query.
 */
export function getTestimonials(): Testimonial[] {
  return testimonials;
}
