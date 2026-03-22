'use client'

import { useState } from 'react'

export type HeaderMobileControllerProps = {
  open: boolean
  onClose: () => void
  onToggle: () => void
}

type HeaderMobileControllerComponentProps = {
  children: (props: HeaderMobileControllerProps) => React.ReactNode
}

export default function HeaderMobileController({ children }: HeaderMobileControllerComponentProps) {
  const [open, setOpen] = useState(false)

  const onClose = () => setOpen(false)
  const onToggle = () => setOpen((prev) => !prev)

  return <>{children({ open, onClose, onToggle })}</>
}
