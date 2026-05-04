'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  annonceReference: string
  recipientId:      string
}

export default function Composer({ annonceReference, recipientId }: Props) {
  const router = useRouter()
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [body,  setBody]  = useState('')

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true); setError(null)
    const res = await fetch('/api/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ annonceReference, recipientId, body }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setBusy(false); setError(data.error ?? 'Envoi impossible')
      return
    }
    setBusy(false); setBody('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSend} className="bg-white border-t border-border px-5 py-3.5">
      {error && (
        <div role="alert" className="mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-3 items-end">
        <textarea
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-navy placeholder:text-muted focus:outline-none focus:border-teal transition-colors resize-none"
          placeholder="Écrivez votre message…"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              ;(e.currentTarget.form as HTMLFormElement | null)?.requestSubmit()
            }
          }}
        />
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="bg-teal hover:bg-teal-dark text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors flex-shrink-0 disabled:opacity-60"
        >
          {busy ? 'Envoi…' : 'Envoyer →'}
        </button>
      </div>
    </form>
  )
}
