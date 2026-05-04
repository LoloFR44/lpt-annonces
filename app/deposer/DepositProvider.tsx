'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Category, Pack, Duration } from '@/lib/types'

export interface DepositState {
  category: Category | null
  title: string
  description: string
  sector: string
  location: string
  price: string
  tags: string
  pack: Pack
  duration: Duration
}

const DEFAULT_STATE: DepositState = {
  category: null, title: '', description: '', sector: '',
  location: '', price: '', tags: '',
  // Pro / 4 mois — recommandé par défaut.
  pack: 'pro',
  duration: '4m',
}

const STORAGE_KEY = 'lpt:deposit:v2'

interface DepositContextValue {
  state: DepositState
  patch: (partial: Partial<DepositState>) => void
  reset: () => void
  ready: boolean
}

const DepositContext = createContext<DepositContextValue | null>(null)

export function DepositProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DepositState>(DEFAULT_STATE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) })
    } catch { /* ignore */ }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state, ready])

  const value: DepositContextValue = {
    state,
    patch: (partial) => setState((s) => ({ ...s, ...partial })),
    reset: () => {
      setState(DEFAULT_STATE)
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    },
    ready,
  }

  return <DepositContext.Provider value={value}>{children}</DepositContext.Provider>
}

export function useDeposit(): DepositContextValue {
  const ctx = useContext(DepositContext)
  if (!ctx) throw new Error('useDeposit must be used inside DepositProvider')
  return ctx
}
