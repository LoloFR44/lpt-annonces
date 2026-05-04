'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DepositStepper from '@/components/deposit/DepositStepper'
import { CATEGORIES, Category } from '@/lib/types'
import { useDeposit } from '../DepositProvider'

const SECTORS = [
  'SaaS / Logiciel', 'RH / Recrutement', 'FinTech', 'ClimateTech / GreenTech',
  'E-commerce', 'IA / Machine Learning', 'Santé / HealthTech',
  'Marketing / Growth', 'Industrie / Hardware', 'Services / Conseil', 'Autre',
]

const TITLE_MAX = 100
const DESC_MAX  = 2000

export default function DeposeStep2() {
  const router = useRouter()
  const { state, patch, ready } = useDeposit()

  // Send users back to step 1 if they land here without picking a category.
  useEffect(() => {
    if (ready && !state.category) router.replace('/deposer')
  }, [ready, state.category, router])

  function handleNext(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!state.title.trim() || !state.description.trim() || !state.location.trim() || !state.sector) return
    router.push('/deposer/visibilite')
  }

  if (!ready || !state.category) return null

  return (
    <>
      <div className="bg-hero-gradient text-white px-8 py-9 text-center">
        <h1 className="text-2xl font-extrabold mb-2">📝 Déposer une annonce</h1>
        <p className="text-sm text-white/60">Rejoignez 1 200+ entrepreneurs actifs sur Les Pépites Tech</p>
      </div>

      <DepositStepper currentStep={2} />

      <div className="max-w-[1100px] mx-auto px-6 py-8 grid grid-cols-[1fr_300px] gap-7">
        <div>
          {/* Selected category recap (clickable to switch) */}
          <div className="card mb-5">
            <h2 className="text-sm font-bold text-navy mb-1">Catégorie sélectionnée</h2>
            <p className="text-xs text-muted mb-5">Cliquez pour modifier</p>
            <div className="grid grid-cols-6 gap-2.5">
              {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => {
                const isSelected = state.category === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => patch({ category: key })}
                    className={`border-2 rounded-xl p-3.5 text-center transition-all hover:border-teal hover:bg-teal-light
                      ${isSelected ? '' : 'border-border'}`}
                    style={isSelected ? { borderColor: cat.color, background: cat.bg } : {}}
                  >
                    <div className="text-2xl mb-1.5">{cat.emoji}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wider"
                         style={{ color: isSelected ? cat.color : undefined }}>
                      {cat.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleNext}>
            <div className="card">
              <h2 className="text-sm font-bold text-navy mb-1">Informations de l'annonce</h2>
              <p className="text-xs text-muted mb-6">Les champs marqués <span className="text-red-400">*</span> sont obligatoires</p>

              <div className="space-y-5">
                <div>
                  <label className="label">Titre de l'annonce <span className="text-red-400">*</span></label>
                  <input
                    className="input" required maxLength={TITLE_MAX}
                    value={state.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="Ex : Cession SaaS RH — 180K ARR, équipe de 3"
                  />
                  <p className="text-[11px] text-muted text-right mt-1">{state.title.length} / {TITLE_MAX} caractères</p>
                </div>

                <div>
                  <label className="label">Description détaillée <span className="text-red-400">*</span></label>
                  <textarea
                    className="input resize-none" rows={6} required maxLength={DESC_MAX}
                    value={state.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="Décrivez votre annonce : contexte, chiffres clés, conditions, profil recherché…"
                  />
                  <p className="text-[11px] text-muted text-right mt-1">{state.description.length} / {DESC_MAX} caractères</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Secteur d'activité <span className="text-red-400">*</span></label>
                    <select
                      className="input" required
                      value={state.sector}
                      onChange={(e) => patch({ sector: e.target.value })}
                    >
                      <option value="">— Choisir un secteur —</option>
                      {SECTORS.map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Localisation <span className="text-red-400">*</span></label>
                    <input
                      className="input" required
                      value={state.location}
                      onChange={(e) => patch({ location: e.target.value })}
                      placeholder="Ex : Paris (75), Full Remote"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Prix / Budget</label>
                    <input
                      className="input"
                      value={state.price}
                      onChange={(e) => patch({ price: e.target.value })}
                      placeholder="Ex : 380 000 €, 650 €/j, Equity"
                    />
                    <p className="text-[11px] text-muted mt-1">Laissez vide si "à définir"</p>
                  </div>
                  <div>
                    <label className="label">Mots-clés (tags)</label>
                    <input
                      className="input"
                      value={state.tags}
                      onChange={(e) => patch({ tags: e.target.value })}
                      placeholder="SaaS, RH, B2B…"
                    />
                    <p className="text-[11px] text-muted mt-1">Séparés par des virgules</p>
                  </div>
                </div>

                {/* Upload zone — placeholder, branchée plus tard via Vercel Blob */}
                <div>
                  <label className="label">Photos / Documents (optionnel)</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-7 text-center bg-surface/50 cursor-not-allowed opacity-70">
                    <div className="text-3xl mb-2.5">📎</div>
                    <p className="text-sm font-semibold text-navy/70 mb-1">Upload bientôt disponible</p>
                    <p className="text-xs text-muted">PNG/JPG, PDF · Max 10 Mo · 5 fichiers max</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-7 pt-5 border-t border-surface">
                <Link href="/deposer" className="btn-secondary">← Retour</Link>
                <button type="submit" className="btn-primary">Continuer → Visibilité</button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="card">
            <p className="section-label">Choisir la visibilité</p>
            <div className="space-y-3">
              <div className="border-2 border-border rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-navy">Gratuit</span>
                  <span className="text-base font-extrabold text-green-600">0 €</span>
                </div>
                <ul className="space-y-1">
                  {['Annonce visible 30 jours', 'Apparition dans les résultats', 'Messagerie intégrée'].map(f => (
                    <li key={f} className="text-[11px] text-navy/70 pl-3.5 relative before:content-['✓'] before:absolute before:left-0 before:text-teal before:font-bold">{f}</li>
                  ))}
                </ul>
              </div>
              <div className="border-2 border-gold rounded-xl p-4 bg-gold-light">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-navy">Premium <span className="text-[10px] font-bold bg-gold text-white px-2 py-0.5 rounded-full ml-1">⭐ Recommandé</span></span>
                  <span className="text-base font-extrabold text-gold">49 €</span>
                </div>
                <ul className="space-y-1">
                  {['Annonce visible 90 jours', 'Mise en avant en tête de liste', 'Badge "Annonce premium"', 'Alerte email aux membres', 'Stats de vues détaillées'].map(f => (
                    <li key={f} className="text-[11px] text-navy/70 pl-3.5 relative before:content-['✓'] before:absolute before:left-0 before:text-teal before:font-bold">{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="section-label">Conseils pour une bonne annonce</p>
            <ul className="space-y-0">
              {['Un titre précis et accrocheur double le taux de clics', 'Ajoutez vos chiffres clés (CA, ARR, équipe…)', 'Précisez vos conditions de transfert', 'Une photo ou screenshot rassure', 'Répondez dans les 24h pour maintenir la confiance'].map(tip => (
                <li key={tip} className="text-xs text-navy/70 py-2 border-b border-surface last:border-0 pl-4 relative leading-snug before:content-['→'] before:absolute before:left-0 before:text-teal before:font-bold">{tip}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl p-5 bg-hero-gradient border-none">
            <p className="section-label text-teal">La communauté LPT</p>
            <p className="text-xs text-white/60 leading-relaxed">
              Vos annonces sont vues par <strong className="text-white">+12 000 entrepreneurs</strong> actifs de l'écosystème French Tech — fondateurs, investisseurs, freelances et repreneurs.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
