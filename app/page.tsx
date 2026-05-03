import Link from 'next/link'
import { CATEGORIES, Category } from '@/lib/types'
import { listAnnonces, countActiveAnnonces, countByCategory } from '@/lib/queries'

// Server-rendered: every visit re-queries Neon so freshly published annonces appear.
export const dynamic = 'force-dynamic'

const RTF = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

function relativeFromNow(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1)  return "aujourd'hui"
  if (days < 30) return RTF.format(-days, 'day')
  return RTF.format(-Math.round(days / 30), 'month')
}

export default async function ListingPage() {
  const [annonces, total, categoryCounts] = await Promise.all([
    listAnnonces(),
    countActiveAnnonces(),
    countByCategory(),
  ])

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="bg-hero-gradient text-white px-8 py-12 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-teal/10 rounded-full" />
        <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-teal/7 rounded-full" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h1 className="text-[28px] font-extrabold mb-2.5">
            Petites annonces pour <span className="text-teal">entrepreneurs</span>
          </h1>
          <p className="text-white/60 text-sm mb-6">
            Cessions, recrutements, partenariats, missions… La marketplace de l'écosystème startup français
          </p>

          {/* Search */}
          <div className="flex gap-2 max-w-[540px] mx-auto">
            <input
              type="text"
              placeholder="Recherchez une annonce, secteur, ville…"
              className="flex-1 px-5 py-3 rounded-full text-sm text-navy font-medium focus:outline-none"
            />
            <button className="bg-teal text-white font-bold text-sm px-6 rounded-full hover:bg-teal-dark transition-colors">
              Rechercher
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-10 justify-center mt-7">
            {[[String(total), 'Annonces actives'], ['1 200+', 'Membres actifs'], ['87', 'Mises en relation/mois']].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-[22px] font-extrabold text-teal">{n}</div>
                <div className="text-[11px] text-white/50 uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-[1fr_300px] gap-7">

        {/* ── Left: filters + list ── */}
        <div>
          {/* Filters bar */}
          <div className="bg-white rounded-xl border border-border p-4 mb-5 flex gap-2.5 flex-wrap items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted mr-1">Catégorie :</span>
            <button className="text-xs font-semibold text-teal border-[1.5px] border-teal bg-teal-light rounded-full px-3.5 py-1.5">
              Toutes
            </button>
            {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
              <button
                key={key}
                className="text-xs font-semibold rounded-full px-3.5 py-1.5 border-[1.5px] transition-colors hover:opacity-80"
                style={{ borderColor: cat.color, color: cat.color }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
            <select className="ml-auto text-xs font-semibold text-navy/70 border-[1.5px] border-border rounded-full px-3.5 py-1.5">
              <option>Les plus récentes</option>
              <option>Les plus vues</option>
              <option>Prix croissant</option>
            </select>
          </div>

          <p className="text-sm text-muted font-semibold mb-3.5">
            <span className="text-teal font-bold">{total}</span> annonce{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
          </p>

          {/* Annonce cards */}
          <div className="space-y-3.5">
            {annonces.map(a => {
              const cat = CATEGORIES[a.category]
              return (
                <Link
                  key={a.id}
                  href={`/annonce/${a.id}`}
                  className={`block bg-white rounded-xl border transition-all duration-200 p-5
                              hover:border-teal hover:shadow-lg hover:-translate-y-0.5
                              ${a.isPremium ? 'border-l-4 border-l-gold border-border bg-[#FFFDF5]' : 'border-border'}`}
                >
                  <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-start">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                         style={{ background: cat.bg }}>
                      {cat.emoji}
                    </div>

                    {/* Body */}
                    <div>
                      {a.isPremium && (
                        <span className="inline-block bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5">
                          ⭐ Annonce premium
                        </span>
                      )}
                      <h3 className="text-[15px] font-bold text-navy mb-1.5 leading-snug">{a.title}</h3>
                      <p className="text-[13px] text-navy/60 leading-relaxed mb-2.5 line-clamp-2">{a.description}</p>
                      <div className="flex gap-3 flex-wrap items-center">
                        <span className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 bg-teal-light text-teal">
                          {cat.emoji} {cat.label}
                        </span>
                        <span className="text-[11px] font-semibold bg-surface text-navy/70 px-2.5 py-0.5 rounded-full">
                          {a.sector}
                        </span>
                        <span className="text-[11px] font-semibold bg-surface text-navy/70 px-2.5 py-0.5 rounded-full">
                          📍 {a.location}
                        </span>
                        <span className="text-[11px] text-muted">{relativeFromNow(a.createdAt)}</span>
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-[17px] font-extrabold text-navy mb-1.5 ${!a.price ? 'text-[13px] text-muted font-semibold' : ''}`}>
                        {a.price ?? 'À définir'}
                      </div>
                      <span className="inline-block bg-teal text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-teal-dark transition-colors">
                        Voir →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-1.5 mt-6">
            {[1,2,3,'…',18].map((p, i) => (
              <button key={i} className={`w-8 h-8 rounded-lg text-sm font-semibold border-[1.5px] transition-colors
                ${p === 1 ? 'bg-teal text-white border-teal' : 'bg-white text-navy/70 border-border hover:border-teal hover:text-teal'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-5">
          {/* CTA déposer */}
          <div className="card">
            <p className="section-label">Déposer une annonce</p>
            <Link href="/deposer" className="btn-primary w-full justify-center mb-2.5 text-sm py-3">
              📝 Publier gratuitement
            </Link>
            <Link href="/deposer?plan=premium" className="btn-outline w-full justify-center text-sm py-2.5">
              ⭐ Annonce premium
            </Link>
          </div>

          {/* Categories */}
          <div className="card">
            <p className="section-label">Catégories</p>
            <ul className="space-y-0">
              {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
                <li key={key} className="flex justify-between items-center py-2 border-b border-surface last:border-0">
                  <span className="text-sm font-semibold text-navy/80">{cat.emoji} {cat.label}</span>
                  <span className="text-[11px] font-bold bg-teal-light text-teal px-2 py-0.5 rounded-full">
                    {categoryCounts[key]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conseils */}
          <div className="card">
            <p className="section-label">Conseils annonceur</p>
            <ul className="space-y-0">
              {[
                'Soignez le titre : soyez précis et accrocheur',
                'Ajoutez vos chiffres clés pour crédibiliser',
                'Indiquez secteur et zone géographique',
                'Répondez vite aux messages reçus',
                'Optez pour le premium pour 3× plus de visibilité',
              ].map(tip => (
                <li key={tip} className="text-xs text-navy/70 py-2 border-b border-surface last:border-0 pl-4 relative leading-snug
                                        before:content-['→'] before:absolute before:left-0 before:text-teal before:font-bold">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  )
}
