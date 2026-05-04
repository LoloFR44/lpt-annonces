'use client'
import { useRouter } from 'next/navigation'
import { CATEGORIES, Category } from '@/lib/types'
import DepositStepper from '@/components/deposit/DepositStepper'
import { useDeposit } from './DepositProvider'

export default function DeposeStep1() {
  const router = useRouter()
  const { state, patch } = useDeposit()
  const selected = state.category

  return (
    <>
      <div className="bg-hero-gradient text-white px-8 py-9 text-center">
        <h1 className="text-2xl font-extrabold mb-2">📝 Publier une opportunité</h1>
        <p className="text-sm text-white/60">Rejoignez 1 200+ entrepreneurs actifs sur Les Pépites Tech</p>
      </div>

      <DepositStepper currentStep={1} />

      <div className="max-w-[900px] mx-auto px-6 py-10">
        <h2 className="text-lg font-extrabold text-navy text-center mb-2">
          Quelle opportunité souhaitez-vous publier ?
        </h2>
        <p className="text-sm text-muted text-center mb-9 max-w-2xl mx-auto">
          Choisissez la catégorie la plus adaptée pour toucher les bons entrepreneurs,
          repreneurs, associés, recruteurs, experts ou partenaires.
        </p>

        <div className="bg-white border border-border rounded-xl p-4 flex gap-4 items-start mb-9">
          <span className="text-2xl flex-shrink-0">💡</span>
          <p className="text-sm text-navy/70 leading-relaxed">
            Vos annonces sont diffusées auprès de{' '}
            <strong className="text-navy">+12 000 entrepreneurs</strong> de l'écosystème French Tech.
            La bonne catégorie vous permet d'atteindre les profils les plus pertinents.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-9">
          {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => {
            const isSelected = selected === key
            return (
              <button
                key={key}
                onClick={() => patch({ category: key })}
                className={`relative bg-white rounded-2xl border-2 p-7 text-center transition-all duration-200
                           hover:-translate-y-0.5 hover:shadow-lg focus:outline-none
                           ${isSelected ? 'shadow-lg -translate-y-0.5' : 'border-border hover:border-teal'}`}
                style={isSelected ? { borderColor: cat.color, background: cat.bg } : {}}
              >
                {isSelected && (
                  <span className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                        style={{ background: cat.color }}>
                    ✓
                  </span>
                )}
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <div className="text-sm font-extrabold text-navy mb-1.5"
                     style={isSelected ? { color: cat.color } : {}}>
                  {cat.label}
                </div>
                <div className="text-[11px] text-muted leading-snug">{cat.shortDescription}</div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-sm font-semibold text-muted underline hover:text-navy transition-colors"
          >
            Annuler
          </button>
          <button
            disabled={!selected}
            onClick={() => selected && router.push('/deposer/details')}
            className={`text-sm font-bold text-white px-9 py-3.5 rounded-xl transition-all
              ${selected ? 'bg-teal hover:bg-teal-dark' : 'bg-border text-muted cursor-not-allowed'}`}
          >
            Continuer → Détails de l'annonce
          </button>
        </div>
      </div>
    </>
  )
}
