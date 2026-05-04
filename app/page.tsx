import Link from 'next/link'
import { CATEGORIES, Category } from '@/lib/types'
import { listAnnonces, countActiveAnnonces, countByCategory, type ListSort } from '@/lib/queries'
import SortSelect from '@/components/listing/SortSelect'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12
const VALID_CATEGORIES = new Set<Category>(['cession', 'recrutement', 'partenariat', 'freelance', 'materiel', 'locaux'])
const VALID_SORTS: ReadonlyArray<ListSort> = ['recent', 'views', 'price-asc', 'price-desc']

const RTF = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

function relativeFromNow(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1)  return "aujourd'hui"
  if (days < 30) return RTF.format(-days, 'day')
  return RTF.format(-Math.round(days / 30), 'month')
}

interface PageProps {
  searchParams: { category?: string; sort?: string; page?: string }
}

function buildQuery(params: { category?: string; sort?: string; page?: number }): string {
  const usp = new URLSearchParams()
  if (params.category) usp.set('category', params.category)
  if (params.sort && params.sort !== 'recent') usp.set('sort', params.sort)
  if (params.page && params.page > 1) usp.set('page', String(params.page))
  const s = usp.toString()
  return s ? `?${s}` : ''
}

export default async function ListingPage({ searchParams }: PageProps) {
  const category = VALID_CATEGORIES.has(searchParams.category as Category)
    ? (searchParams.category as Category)
    : undefined
  const sort: ListSort = VALID_SORTS.includes(searchParams.sort as ListSort)
    ? (searchParams.sort as ListSort)
    : 'recent'
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)

  const [annonces, totalForFilter, totalAll, categoryCounts] = await Promise.all([
    listAnnonces({ category, sort, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    countActiveAnnonces(category),
    countActiveAnnonces(),
    countByCategory(),
  ])
  const totalPages = Math.max(1, Math.ceil(totalForFilter / PAGE_SIZE))

  // Pagination compaction: 1 … (n-1) n (n+1) … last
  const pageNumbers: Array<number | '…'> = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const out: Array<number | '…'> = [1]
    if (page > 3) out.push('…')
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) out.push(p)
    if (page < totalPages - 2) out.push('…')
    out.push(totalPages)
    return out
  })()

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

          <div className="flex gap-2 max-w-[540px] mx-auto">
            <input
              type="text"
              placeholder="Recherche bientôt disponible…"
              className="flex-1 px-5 py-3 rounded-full text-sm text-navy font-medium focus:outline-none disabled:opacity-70"
              disabled
            />
            <button className="bg-teal text-white font-bold text-sm px-6 rounded-full opacity-70 cursor-not-allowed" disabled>
              Rechercher
            </button>
          </div>

          <div className="flex gap-10 justify-center mt-7">
            {[[String(totalAll), 'Annonces actives'], ['1 200+', 'Membres actifs'], ['87', 'Mises en relation/mois']].map(([n, l]) => (
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

        <div>
          {/* Filters bar */}
          <div className="bg-white rounded-xl border border-border p-4 mb-5 flex gap-2.5 flex-wrap items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted mr-1">Catégorie :</span>
            <Link
              href={`/${buildQuery({ sort })}`}
              className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border-[1.5px] transition-colors
                ${!category ? 'text-teal border-teal bg-teal-light' : 'text-navy/70 border-border hover:border-teal hover:text-teal'}`}
            >
              Toutes
            </Link>
            {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => {
              const active = category === key
              return (
                <Link
                  key={key}
                  href={`/${buildQuery({ category: key, sort })}`}
                  className="text-xs font-semibold rounded-full px-3.5 py-1.5 border-[1.5px] transition-colors hover:opacity-80"
                  style={{
                    borderColor: cat.color,
                    color: active ? '#fff' : cat.color,
                    background: active ? cat.color : 'transparent',
                  }}
                >
                  {cat.emoji} {cat.label}
                </Link>
              )
            })}
            <SortSelect current={sort} />
          </div>

          <p className="text-sm text-muted font-semibold mb-3.5">
            <span className="text-teal font-bold">{totalForFilter}</span> annonce{totalForFilter > 1 ? 's' : ''} trouvée{totalForFilter > 1 ? 's' : ''}
            {category && <> dans la catégorie <strong className="text-navy">{CATEGORIES[category].label}</strong></>}
          </p>

          {/* Annonce cards */}
          <div className="space-y-3.5">
            {annonces.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-10 text-center">
                <p className="text-sm text-muted">
                  Aucune annonce {category ? `dans cette catégorie` : ''} pour l'instant —{' '}
                  <Link href="/deposer" className="text-teal font-semibold hover:underline">déposer la première</Link> ?
                </p>
              </div>
            ) : annonces.map((a) => {
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
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: cat.bg }}>
                      {cat.emoji}
                    </div>

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
          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-6">
              {page > 1 && (
                <Link href={`/${buildQuery({ category, sort, page: page - 1 })}`}
                      className="px-3 h-8 rounded-lg text-sm font-semibold border-[1.5px] bg-white text-navy/70 border-border hover:border-teal hover:text-teal flex items-center">
                  ←
                </Link>
              )}
              {pageNumbers.map((n, i) =>
                n === '…' ? (
                  <span key={`gap-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-muted">…</span>
                ) : (
                  <Link key={n}
                    href={`/${buildQuery({ category, sort, page: n })}`}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold border-[1.5px] flex items-center justify-center transition-colors
                      ${n === page
                        ? 'bg-teal text-white border-teal'
                        : 'bg-white text-navy/70 border-border hover:border-teal hover:text-teal'}`}>
                    {n}
                  </Link>
                ),
              )}
              {page < totalPages && (
                <Link href={`/${buildQuery({ category, sort, page: page + 1 })}`}
                      className="px-3 h-8 rounded-lg text-sm font-semibold border-[1.5px] bg-white text-navy/70 border-border hover:border-teal hover:text-teal flex items-center">
                  →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-5">
          <div className="card">
            <p className="section-label">Déposer une annonce</p>
            <Link href="/deposer" className="btn-primary w-full justify-center mb-2.5 text-sm py-3">
              📝 Publier gratuitement
            </Link>
            <Link href="/deposer?plan=premium" className="btn-outline w-full justify-center text-sm py-2.5">
              ⭐ Annonce premium
            </Link>
          </div>

          <div className="card">
            <p className="section-label">Catégories</p>
            <ul className="space-y-0">
              {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
                <li key={key}>
                  <Link
                    href={`/${buildQuery({ category: key, sort })}`}
                    className={`flex justify-between items-center py-2 border-b border-surface last:border-0 transition-colors
                      ${category === key ? 'text-teal' : 'text-navy/80 hover:text-teal'}`}
                  >
                    <span className="text-sm font-semibold">{cat.emoji} {cat.label}</span>
                    <span className="text-[11px] font-bold bg-teal-light text-teal px-2 py-0.5 rounded-full">
                      {categoryCounts[key]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

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
