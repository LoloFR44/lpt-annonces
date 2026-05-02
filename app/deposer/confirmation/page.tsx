import Link from 'next/link'
import DepositStepper from '@/components/deposit/DepositStepper'

const ACTION_CARDS = [
  { emoji: '👁', title: 'Voir mon annonce', desc: 'Prévisualisez votre annonce publiée', href: '/annonce/lpt-001' },
  { emoji: '📬', title: 'Gérer mes messages', desc: 'Suivez vos demandes de contact', href: '/messagerie' },
  { emoji: '📊', title: 'Mon tableau de bord', desc: 'Statistiques et gestion de vos annonces', href: '/compte' },
  { emoji: '➕', title: 'Déposer une autre annonce', desc: 'Publiez une nouvelle annonce', href: '/deposer' },
]

export default function DeposeStep4() {
  return (
    <>
      <DepositStepper currentStep={4} />

      <div className="max-w-[760px] mx-auto px-6 py-12">

        {/* Success banner */}
        <div className="rounded-2xl p-10 text-center text-white mb-7"
             style={{ background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)' }}>
          <span className="text-[64px] block mb-4 animate-bounce">🎉</span>
          <h1 className="text-[26px] font-extrabold mb-2">Votre annonce est en ligne !</h1>
          <p className="text-sm text-white/85 leading-relaxed max-w-md mx-auto">
            Elle est maintenant visible par les <strong className="text-white">+12 000 entrepreneurs</strong> de l'écosystème Les Pépites Tech.
          </p>
          <p className="text-xs text-white/50 mt-4">
            Référence annonce : <strong className="text-white font-mono tracking-wider">LPT-2026-08742</strong>
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {ACTION_CARDS.map(card => (
            <Link key={card.title} href={card.href}
              className="bg-white rounded-xl border border-border p-6 text-center hover:border-teal hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="text-[32px] mb-2.5">{card.emoji}</div>
              <div className="text-sm font-bold text-navy mb-1">{card.title}</div>
              <div className="text-xs text-muted leading-snug">{card.desc}</div>
            </Link>
          ))}
        </div>

        {/* Details recap */}
        <div className="card mb-6">
          <p className="section-label">Détails de la publication</p>
          <div className="space-y-0">
            {[
              { label: 'Annonce', value: 'Cession SaaS RH — 180K ARR, rentable, équipe de 3' },
              { label: 'Plan', valueBadge: { text: '⭐ Premium', className: 'bg-gold-light text-gold border border-gold/30' } },
              { label: 'Statut', valueBadge: { text: '🟢 En ligne', className: 'bg-green-50 text-green-700 border border-green-200' } },
              { label: 'Expire le', value: '29 juillet 2026' },
              { label: 'Vues', value: '0 vue · mis à jour en temps réel' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-surface last:border-0">
                <span className="text-xs text-muted font-semibold">{row.label}</span>
                {row.valueBadge
                  ? <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${row.valueBadge.className}`}>{row.valueBadge.text}</span>
                  : <span className="text-xs font-bold text-navy text-right max-w-[65%]">{row.value}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Share */}
        <div className="rounded-xl p-6 bg-hero-gradient text-white text-center">
          <h3 className="text-sm font-bold mb-1">Partagez votre annonce</h3>
          <p className="text-xs text-white/50 mb-5">Plus de partages = plus de contacts potentiels</p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            <button className="bg-[#0077B5] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
              LinkedIn
            </button>
            <button className="bg-[#1DA1F2] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
              Twitter / X
            </button>
            <button className="bg-white/15 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-white/25 transition-colors">
              🔗 Copier le lien
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
