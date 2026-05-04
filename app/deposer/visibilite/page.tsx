'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DepositStepper from '@/components/deposit/DepositStepper'
import { CATEGORIES, PACKS, type Pack, type Duration } from '@/lib/types'
import { useDeposit } from '../DepositProvider'

const PAID_PACKS: Pack[] = ['boost', 'pro', 'ultra']
const DURATION_LABELS: Record<Duration, string> = { '1m': '1 mois', '4m': '4 mois' }
const DURATION_MONTHS: Record<Duration, number> = { '1m': 1, '4m': 4 }

function formatHT(amount: number | null): string {
  if (amount === null || amount === 0) return '—'
  return `${amount} € HT`
}

export default function DeposeStep3() {
  const router = useRouter()
  const { state, patch, reset, ready } = useDeposit()
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    if (!state.category) { router.replace('/deposer'); return }
    if (!state.title || !state.description || !state.sector || !state.location) {
      router.replace('/deposer/details')
    }
  }, [ready, state, router])

  async function handlePublish() {
    setBusy(true); setError(null)
    const createRes = await fetch('/api/annonces', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        category:       state.category,
        title:          state.title,
        description:    state.description,
        sector:         state.sector,
        location:       state.location,
        price:          state.price,
        tags:           state.tags,
        pack:           state.pack,
        durationMonths: DURATION_MONTHS[state.duration],
      }),
    })
    if (!createRes.ok) {
      const data = await createRes.json().catch(() => ({}))
      setBusy(false); setError(data.error ?? 'Erreur inattendue')
      return
    }
    const { annonce } = await createRes.json()

    // Free → already ACTIVE in DB, jump to confirmation.
    if (state.pack === 'free') {
      reset()
      router.push(`/deposer/confirmation?ref=${encodeURIComponent(annonce.reference)}`)
      return
    }

    // Paid → fire Stripe Checkout. Annonce stays DRAFT until the webhook lands.
    const checkoutRes = await fetch('/api/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ annonceReference: annonce.reference }),
    })
    if (!checkoutRes.ok) {
      const data = await checkoutRes.json().catch(() => ({}))
      setBusy(false)
      setError(`Annonce créée en brouillon (${annonce.reference}) mais échec de la session Stripe : ${data.error ?? 'erreur inconnue'}. Retrouvez-la sur votre tableau de bord.`)
      return
    }
    const { url } = await checkoutRes.json()
    reset()
    window.location.href = url
  }

  if (!ready || !state.category) return null

  const cat = CATEGORIES[state.category]
  const selectedPackInfo = PACKS[state.pack]
  const totalAmount = selectedPackInfo.prices[state.duration] ?? 0
  const totalDays   = selectedPackInfo.durationDays[state.duration]

  return (
    <>
      <div className="bg-hero-gradient text-white px-8 py-9 text-center">
        <h1 className="text-2xl font-extrabold mb-2">📝 Publier une opportunité</h1>
        <p className="text-sm text-white/60">Rejoignez 1 200+ entrepreneurs actifs sur Les Pépites Tech</p>
      </div>

      <DepositStepper currentStep={3} />

      <div className="max-w-[1100px] mx-auto px-6 py-8 grid grid-cols-[1fr_320px] gap-7">

        {/* ── Main column ────────────────────────────── */}
        <div>
          {/* Duration toggle */}
          <div className="bg-white rounded-xl border border-border p-5 mb-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3">Durée de diffusion</p>
            <div className="inline-flex bg-surface rounded-full p-1 gap-1">
              {(['1m', '4m'] as Duration[]).map((d) => {
                const active = state.duration === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => patch({ duration: d })}
                    className={`relative px-6 py-2 rounded-full text-sm font-bold transition-all
                      ${active ? 'bg-teal text-white shadow' : 'text-navy/60 hover:text-navy'}`}
                  >
                    {DURATION_LABELS[d]}
                    {d === '4m' && (
                      <span className="absolute -top-2 -right-3 text-[9px] font-extrabold uppercase tracking-wider bg-gold text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                        Recommandé
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted mt-3 max-w-lg mx-auto leading-relaxed">
              Le format <strong>4 mois</strong> est recommandé pour les annonces stratégiques :
              cession, recherche d'associé, recrutement clé, partenariat ou mission d'expert.
            </p>
          </div>

          {/* Paid packs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {PAID_PACKS.map((p) => {
              const pack = PACKS[p]
              const price = pack.prices[state.duration]
              const active = state.pack === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => patch({ pack: p })}
                  className={`relative bg-white rounded-2xl border-2 p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                    ${active ? 'shadow-lg -translate-y-0.5' : 'border-border'}`}
                  style={active ? { borderColor: pack.color, background: pack.bg } : {}}
                >
                  {pack.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-wider">
                      ⭐ Recommandé
                    </div>
                  )}
                  <div className="text-3xl mb-2">{pack.emoji}</div>
                  <div className="text-base font-extrabold text-navy mb-1" style={active ? { color: pack.color } : {}}>
                    {pack.label}
                  </div>
                  <div className="text-xs text-muted mb-3 leading-snug min-h-[32px]">{pack.tagline}</div>
                  <div className="text-[26px] font-extrabold leading-none my-3" style={{ color: pack.color }}>
                    {formatHT(price)}
                  </div>
                  <div className="text-[11px] text-muted mb-4">
                    {DURATION_LABELS[state.duration]} · visible {pack.durationDays[state.duration]} jours
                  </div>
                  <ul className="space-y-1 mb-4">
                    {pack.features.map((f) => (
                      <li key={f} className="text-[11px] text-navy/70 pl-4 relative leading-snug
                                            before:content-['✓'] before:absolute before:left-0 before:text-teal before:font-bold">
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className={`w-full text-center py-2 rounded-lg text-xs font-bold transition-colors
                    ${active ? 'text-white' : 'bg-surface text-navy/60'}`}
                    style={active ? { background: pack.color } : {}}
                  >
                    {active ? '✓ Sélectionné' : `Choisir ${pack.label}`}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Free option (secondary) */}
          <div className={`bg-white rounded-xl border-2 p-4 mb-6 flex items-center gap-4 cursor-pointer transition-colors
            ${state.pack === 'free' ? 'border-teal bg-teal-light' : 'border-border hover:border-teal/50'}`}
               onClick={() => patch({ pack: 'free' })}>
            <input
              type="radio"
              checked={state.pack === 'free'}
              onChange={() => patch({ pack: 'free' })}
              className="w-4 h-4 accent-teal"
              aria-label="Choisir le pack gratuit"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-lg">{PACKS.free.emoji}</span>
                <span className="text-sm font-bold text-navy">Publier gratuitement</span>
                <span className="text-xs font-semibold text-green-600">— 0 €</span>
              </div>
              <p className="text-xs text-muted">Visible 30 jours dans les résultats standards.</p>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {state.pack !== 'free' && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-teal-light border border-teal/30 text-xs text-navy/70">
              💳 Paiement sécurisé Stripe — votre annonce reste en brouillon tant que le règlement n'est pas validé.
              {' '}En mode test, utilisez la carte <strong>4242 4242 4242 4242</strong> · n'importe quelle date future · CVC 123.
            </div>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────── */}
        <aside className="space-y-5">

          <div className="card">
            <p className="section-label">Récapitulatif de votre annonce</p>
            <div className="space-y-0">
              <div className="flex justify-between items-start py-2.5 border-b border-surface">
                <span className="text-xs text-muted font-semibold">Catégorie</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>
                  {cat.emoji} {cat.label}
                </span>
              </div>
              {[
                { label: 'Titre',         value: state.title },
                { label: 'Secteur',       value: state.sector },
                { label: 'Localisation',  value: state.location },
                { label: 'Prix',          value: state.price || 'À définir' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start py-2.5 border-b border-surface last:border-0">
                  <span className="text-xs text-muted font-semibold">{row.label}</span>
                  <span className="text-xs font-bold text-navy text-right max-w-[60%] line-clamp-2">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="rounded-xl p-5 bg-hero-gradient text-white">
            <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Plan sélectionné</p>
            <p className="text-sm font-extrabold mb-3" style={{ color: selectedPackInfo.color }}>
              {selectedPackInfo.emoji} {selectedPackInfo.label}
              {state.pack !== 'free' && <> · {DURATION_LABELS[state.duration]}</>}
            </p>
            <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1">Total</p>
            <div className="text-[30px] font-extrabold text-white mb-1">
              {state.pack === 'free' ? '0 €' : `${totalAmount} € HT`}
            </div>
            <p className="text-[11px] text-white/40 mb-5">
              {state.pack === 'free'
                ? 'Publication gratuite · sans CB'
                : `Visible ${totalDays} jours · paiement Stripe sécurisé`}
            </p>
            <button
              onClick={handlePublish}
              disabled={busy}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-colors mb-2.5 disabled:opacity-60
                ${state.pack === 'free' ? 'bg-teal hover:bg-teal-dark text-white' : 'bg-gold hover:opacity-90 text-white'}`}
            >
              {busy
                ? 'Publication…'
                : state.pack === 'free'
                  ? '🚀 Publier gratuitement'
                  : `${selectedPackInfo.emoji} Payer ${totalAmount}€ HT et publier`}
            </button>
            <Link href="/deposer/details" className="block w-full text-center py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
              ← Retour aux détails
            </Link>
            <p className="text-[10px] text-white/30 text-center mt-3">🔒 Paiement 100% sécurisé · Stripe</p>
          </div>
        </aside>
      </div>
    </>
  )
}
