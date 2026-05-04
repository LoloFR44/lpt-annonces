'use client'
import { useState } from 'react'

interface Props {
  annonceReference: string
  variant?: 'banner' | 'inline'
}

export default function RetryCheckoutButton({ annonceReference, variant = 'banner' }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function retry() {
    setBusy(true); setError(null)
    const res = await fetch('/api/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ annonceReference }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setBusy(false)
      setError(data.error ?? 'Erreur')
      return
    }
    const { url } = await res.json()
    window.location.href = url
  }

  const cls = variant === 'banner'
    ? 'bg-white text-red-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-60'
    : 'bg-gold text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60'

  return (
    <div>
      <button onClick={retry} disabled={busy} className={cls}>
        {busy ? 'Redirection…' : variant === 'banner' ? 'Relancer le paiement' : '💳 Payer 49€'}
      </button>
      {error && <p className={`text-xs ${variant === 'banner' ? 'text-white/80' : 'text-red-500'} mt-1`}>{error}</p>}
    </div>
  )
}
