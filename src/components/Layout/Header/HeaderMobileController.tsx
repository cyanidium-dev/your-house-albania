'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export type HeaderMobileControllerProps = {
  open: boolean
  onClose: () => void
  onToggle: () => void
}

type HeaderMobileControllerComponentProps = {
  children: (props: HeaderMobileControllerProps) => React.ReactNode
}

/** Open state of the drawer. It closes on any route change, the language switch included. */
export default function HeaderMobileController({ children }: HeaderMobileControllerComponentProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Stable, so the drawer's key listener is not re-bound on every render.
  const onClose = useCallback(() => setOpen(false), [])
  const onToggle = useCallback(() => setOpen((prev) => !prev), [])

  return <>{children({ open, onClose, onToggle })}</>
}
