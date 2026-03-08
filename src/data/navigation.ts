import type { NavLink } from '@/types/domain';
import { navLinks } from '@/app/api/navlink';

/**
 * Returns main navigation links. Later: replace with Sanity or config.
 */
export function getNavLinks(): NavLink[] {
  return navLinks;
}
