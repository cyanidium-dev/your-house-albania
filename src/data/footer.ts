import type { FooterLink } from '@/types/domain';
import { FooterLinks } from '@/app/api/footerlinks';

/**
 * Returns footer links. Later: replace with Sanity or config.
 */
export function getFooterLinks(): FooterLink[] {
  return FooterLinks;
}
