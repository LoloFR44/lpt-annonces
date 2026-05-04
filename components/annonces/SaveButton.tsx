'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  annonceReference: string
  initialSaved:     boolean
}

export default function SaveButton({ annonceReference, initialSaved }: Props) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    if (pending) return
    const next = !saved
    setSaved(next) // optimistic flip
    setError(null)
    start(async () => {
      const res = await fetch(`/api/annonces/${encodeURIComponent(annonceReference)}/save`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ saved: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaved(!next)
        setError(data.error ?? 'Erreur')
        return
      }
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={toggle}
        disabled={pending}
        className={`w-full border-2 font-bold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60
          ${saved
            ? 'border-teal bg-teal-light text-teal'
            : 'border-border text-navy/70 hover:border-teal hover:text-teal'}`}
      >
        {saved ? '♥ Annonce sauvegardée' : '♡ Sauvegarder l\'annonce'}
      </button>
      {error && (
        <p className="text-[11px] text-red-500 text-center mt-2">{error}</p>
      )}
    </>
  )
}
