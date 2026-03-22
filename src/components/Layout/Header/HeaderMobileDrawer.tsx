'use client'

import { useEffect, useRef } from 'react'

type HeaderMobileDrawerProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function HeaderMobileDrawer({
  open,
  onClose,
  children,
}: HeaderMobileDrawerProps) {
  const sideMenuRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (sideMenuRef.current && !sideMenuRef.current.contains(event.target as Node)) {
      onClose()
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <>
      {open && (
        <div className='fixed inset-0 bg-black/50 z-40' aria-hidden />
      )}
      <div
        ref={sideMenuRef}
        className={`fixed top-0 right-0 h-full w-full bg-dark shadow-lg transition-transform duration-300 max-w-2xl ${open ? 'translate-x-0' : 'translate-x-full'} z-50 px-20 overflow-auto no-scrollbar`}
      >
        {children}
      </div>
    </>
  )
}
