'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DepositStepper from '@/components/deposit/DepositStepper'
import { CATEGORIES } from '@/lib/types'
import { useDeposit } from '../DepositProvider'

const FREE_FEATURES = [
  { label: 'Apparition dans les résultats', included: true },
  { label: 'Messagerie intégrée', included: true },
  { label: 'Profil annonceur visible', included: true },
  { label: 'Mise en avant en tête de liste', included: false },
  { label: 'Badge "Annonce premium"', included: false },
  { label: 'Alerte email aux membres ciblés', included: false },
  { label: 'Statistiques de vues', included: false },
]

const PREMIUM_FEATURES = [
  { label: 'Apparition dans les résultats', included: true },
  { label: 'Messagerie intégrée', included: true },
  { label: 'Profil annonceur visible', included: true },
  { label: 'Mise en avant en tête de liste', included: true },
  { label: 'Badge "Annonce premium"', included: true },
  { label: 'Alerte email aux membres ciblés', included: true },
  { label: 'Statistiques de vues détaillées', included: true },
]

export default function DeposeStep3() {
  const router = useRouter()
  const { state, patch, reset, ready } = useDeposit()
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState<string | null>(null)
  const plan = state.plan

  useEffect(() => {
    if (!ready) return
    // Bounce the user back to the right step if state is incomplete.
    if (!state.category) { router.replace('/deposer'); return }
    if (!state.title || !state.description || !state.sector || !state.location) {
      router.replace('/deposer/details')
    }
  }, [ready, state, router])

  async function handlePublish() {
    setBusy(true); setError(null)
    const res = await fetch('/api/annonces', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        category:    state.category,
        title:       state.title,
        description: state.description,
        sector:      state.sector,
        location:    state.location,
        price:       state.price,
        tags:        state.tags,
        plan:        state.plan,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setBusy(false)
      setError(data.error ?? 'Erreur inattendue')
      return
    }
    const { annonce } = await res.json()
    reset()
    router.push(`/deposer/confirmation?ref=${encodeURIComponent(annonce.reference)}`)
  }

  if (!ready || !state.category) return null
  const cat = CATEGORIES[state.category]

  return (
    <>
      <div className="bg-hero-gradient text-white px-8 py-9 text-center">
        <h1 className="text-2xl font-extrabold mb-2">📝 Publier une opportunité</h1>
        <p className="text-sm text-white/60">Rejoignez 1 200+ entrepreneurs actifs sur Les Pépites Tech</p>
      </div>

      <DepositStepper currentStep={3} />

      <div className="max-w-[1000px] mx-auto px-6 py-8 grid grid-cols-[1fr_320px] gap-7">

        <div>
          <div className="grid grid-cols-2 gap-5 mb-6">

            {/* Free plan */}
            <button
              type="button"
              onClick={() => patch({ plan: 'FREE' })}
              className={`relative bg-white rounded-2xl border-2 p-7 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                ${plan === 'FREE' ? 'border-teal bg-teal-light shadow-lg -translate-y-0.5' : 'border-border'}`}
            >
              <div className="text-4xl mb-3">📋</div>
              <div className="text-lg font-extrabold text-navy mb-1">Gratuit</div>
              <div className="text-[32px] font-extrabold text-green-600 leading-none my-4">
                0 € <span className="text-sm font-medium text-muted">/ annonce</span>
              </div>
              <div className="text-xs text-muted mb-5">Visible 30 jours</div>
              <ul className="space-y-0 mb-6">
                {FREE_FEATURES.map(f => (
                  <li key={f.label}
                    className={`text-[13px] py-1.5 border-b border-surface last:border-0 pl-5 relative
                      ${f.included ? 'text-navy/75' : 'text-muted/60'}`}>
                    <span className={`absolute left-0 font-bold ${f.included ? 'text-teal' : 'text-border'}`}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>
              <div className={`w-full text-center py-3 rounded-xl text-sm font-bold transition-colors
                ${plan === 'FREE' ? 'bg-teal text-white' : 'bg-surface text-navy/60'}`}>
                Choisir Gratuit
              </div>
            </button>

            {/* Premium plan */}
            <button
              type="button"
              onClick={() => patch({ plan: 'PREMIUM' })}
              className={`relative bg-white rounded-2xl border-2 p-7 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                ${plan === 'PREMIUM' ? 'border-gold bg-gold-light shadow-lg -translate-y-0.5' : 'border-border'}`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap uppercase tracking-wider">
                ⭐ Recommandé
              </div>
              <div className="text-4xl mb-3">⭐</div>
              <div className="text-lg font-extrabold text-navy mb-1">Premium</div>
              <div className="text-[32px] font-extrabold text-gold leading-none my-4">
                49 € <span className="text-sm font-medium text-muted">/ annonce</span>
              </div>
              <div className="text-xs text-muted mb-5">Visible 90 jours · 3× plus de contacts</div>
              <ul className="space-y-0 mb-6">
                {PREMIUM_FEATURES.map(f => (
                  <li key={f.label} className="text-[13px] text-navy/75 py-1.5 border-b border-surface last:border-0 pl-5 relative">
                    <span className="absolute left-0 text-teal font-bold">✓</span>
                    {f.label}
                  </li>
                ))}
              </ul>
              <div className={`w-full text-center py-3 rounded-xl text-sm font-bold transition-colors
                ${plan === 'PREMIUM' ? 'bg-gold text-white' : 'bg-gold/80 text-white'}`}>
                Choisir Premium — 49 €
              </div>
            </button>
          </div>

          {/* Stats comparison */}
          <div className="card">
            <p className="section-label">Comparaison de visibilité (moyenne observée)</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-navy/70 mb-1.5">
                  <span>Annonce Gratuite</span>
                  <span className="text-muted">~12 vues / semaine</span>
                </div>
                <div className="bg-surface rounded-full h-2">
                  <div className="bg-muted/40 h-2 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-gold">Annonce Premium ⭐</span>
                  <span className="text-gold">~38 vues / semaine</span>
                </div>
                <div className="bg-surface rounded-full h-2">
                  <div className="bg-gold h-2 rounded-full" style={{ width: '90%' }} />
                </div>
              </div>
            </div>
          </div>

          {plan === 'PREMIUM' && (
            <div className="mt-5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              ⚠️ Stripe Checkout est en cours de branchement — pour l'instant, choisir Premium publie sans paiement en mode test.
            </div>
          )}

          {error && (
            <div role="alert" className="mt-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">

          {/* Recap */}
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

          {/* Total + CTA */}
          <div className="rounded-xl p-5 bg-hero-gradient text-white">
            <p className="text-xs text-white/50 mb-1">Total à régler</p>
            <div className="text-[30px] font-extrabold text-white mb-1">
              {plan === 'FREE' ? '0 €' : '49 €'}
            </div>
            <p className="text-[11px] text-white/40 mb-5">
              {plan === 'FREE' ? 'Publication gratuite, sans CB' : 'Paiement sécurisé par Stripe (à brancher)'}
            </p>
            <button
              onClick={handlePublish}
              disabled={busy}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-colors mb-2.5 disabled:opacity-60
                ${plan === 'PREMIUM' ? 'bg-gold hover:opacity-90 text-white' : 'bg-teal hover:bg-teal-dark text-white'}`}
            >
              {busy ? 'Publication…' : (plan === 'PREMIUM' ? '⭐ Publier en Premium' : '🚀 Publier gratuitement')}
            </button>
            <Link href="/deposer/details" className="block w-full text-center py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
              ← Retour aux détails
            </Link>
            <p className="text-[10px] text-white/30 text-center mt-3">🔒 Paiement 100% sécurisé · Annulable à tout moment</p>
          </div>
        </aside>
      </div>
    </>
  )
}
