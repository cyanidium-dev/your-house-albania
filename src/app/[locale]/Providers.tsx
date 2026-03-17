"use client"

import React from 'react'
import { CurrencyProvider } from '@/contexts/CurrencyContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>
}

