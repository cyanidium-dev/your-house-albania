'use client'

import { useEffect } from 'react'

/**
 * Marks the document while a contact form dialog is open, so the phone contact
 * bar can step aside (`[[data-contact-modal]_&]:invisible` on the bar). The
 * dialog's backdrop is translucent; without this the bar's buttons show through
 * it, dimmed but still looking tappable. Counted, because two dialogs never
 * overlap today but nothing forbids it.
 */
export function useContactModalFlag(open: boolean): void {
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const count = Number(root.dataset.contactModal ?? '0') + 1
    root.dataset.contactModal = String(count)
    return () => {
      const next = Number(root.dataset.contactModal ?? '1') - 1
      if (next > 0) root.dataset.contactModal = String(next)
      else delete root.dataset.contactModal
    }
  }, [open])
}
