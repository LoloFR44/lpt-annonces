/**
 * Placeholder ad slot — same overall footprint as an annonce card so the
 * listing layout doesn't shift when ads are wired in.
 *
 * Today: hard-coded creative for QA. Tomorrow: replace the inner `<div>`
 * by an ad-server snippet (Google Ad Manager, Equativ, etc.) keyed on
 * a slot id like `lpt-listing-bottom`.
 */
interface Props {
  slot: string
}

export default function AdSlot({ slot }: Props) {
  return (
    <div
      data-ad-slot={slot}
      className="block bg-white rounded-xl border border-dashed border-gold/60 p-5 hover:border-gold transition-colors"
      role="complementary"
      aria-label="Publicité sponsorisée"
    >
      <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-start">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gold-light">
          📣
        </div>
        <div>
          <span className="inline-block bg-gold text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5">
            Sponsorisé
          </span>
          <h3 className="text-[15px] font-bold text-navy mb-1.5 leading-snug">
            Espace publicitaire — réservez ce placement
          </h3>
          <p className="text-[13px] text-navy/60 leading-relaxed mb-2.5 line-clamp-2">
            Touchez +50 000 acteurs de la tech en mettant votre marque
            au cœur des annonces stratégiques de l'écosystème français.
            Banques, Assurances, Services, RH, Growth, … ce slot vous attend.
          </p>
          <div className="flex gap-3 flex-wrap items-center">
            <span className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 bg-gold-light text-gold">
              📣 Publicité ciblée
            </span>
            <span className="text-[11px] font-semibold bg-surface text-navy/70 px-2.5 py-0.5 rounded-full">
              Slot : {slot}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <a
            href="mailto:loic@linkera.com?subject=R%C3%A9server%20un%20placement%20LPT"
            className="inline-block bg-gold hover:opacity-90 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-opacity"
          >
            Nous contacter →
          </a>
        </div>
      </div>
    </div>
  )
}
