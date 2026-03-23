'use client'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

interface NavLinkItem {
  label: string
  href: string
}

interface NavLinkProps {
  item: NavLinkItem;
  onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ item, onClick }) => {
  const path = usePathname()
  const locale = useLocale()
  const href = item.href === "/" ? `/${locale}` : `/${locale}${item.href}`
  const isHomepage = item.href === "/"
  const baseMatch = path === href || path.startsWith(href + "/")
  const propertiesDetailMatch =
    item.href === "/properties" && path.startsWith(`/${locale}/property/`)
  const isActive = isHomepage
    ? path === href
    : baseMatch || propertiesDetailMatch

  const linkclasses = clsx(
    'py-3 text-3xl sm:text-5xl font-medium text-white/40 rounded-full group-hover:text-primary',
    {
      '!text-primary': isActive,
      'text-primary': isActive,
    }
  )

  const liststyle = clsx(
    'w-0 h-0.5 bg-primary transition-all duration-300',
    {
      '!block w-6 mr-4': isActive,
      'block w-6': isActive,
      'group-hover:block group-hover:w-6 group-hover:mr-4': true,
    }
  )

  return (
    <li className='flex items-center group w-fit'>
      <div className={liststyle} />
      <Link href={href} className={linkclasses} onClick={onClick}>
        {item.label}
      </Link>
    </li>
  )
}

export default NavLink
