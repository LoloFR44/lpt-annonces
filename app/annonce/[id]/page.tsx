import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { CATEGORIES } from '@/lib/types'
import { authOptions } from '@/lib/auth'
import { getAnnonceByReference, getSimilarAnnonces } from '@/lib/queries'
import { prisma } from '@/lib/prisma'
import SaveButton from '@/components/annonces/SaveButton'

export const dynamic = 'force-dynamic'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function AnnoncePage({ params }: { params: { id: string } }) {
  const annonce = await getAnnonceByReference(params.id)
  if (!annonce) notFound()

  const session = await getServerSession(authOptions)
  const isOwner = session?.user?.id === annonce.author.id
  const cat = CATEGORIES[annonce.category]
  const similar = await getSimilarAnnonces(annonce.id, annonce.category, 3)
  const publishedAt = DATE_FMT.format(new Date(annonce.createdAt))

  const initialSaved = session?.user
    ? Boolean(await prisma.savedAnnonce.findFirst({
        where: { userId: session.user.id, annonce: { reference: annonce.id } },
        select: { id: true },
      }))
    : false

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-border px-8 py-2.5 text-xs text-muted">
        <Link href="/" className="text-teal font-semibold hover:underline">Accueil</Link>
        <span className="mx-1.5">›</span>
        <Link href="/" className="text-teal font-semibold hover:underline">Annonces</Link>
        <span className="mx-1.5">›</span>
        <span className="font-semibold" style={{ color: cat.color }}>{cat.emoji} {cat.label}</span>
        <span className="mx-1.5">›</span>
        <span className="text-navy/70">{annonce.title.substring(0, 40)}…</span>
      </div>

      {/* Hero */}
      <div className="px-8 py-7 text-white" style={{ background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}CC 100%)` }}>
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full mb-3">
          {cat.emoji} {cat.label}
        </span>
        <h1 className="text-2xl font-extrabold leading-snug mb-3">{annonce.title}</h1>
        <div className="flex flex-wrap gap-4 items-center">
          {annonce.isPaid && (
            <span className="bg-gold text-white text-[11px] font-bold px-3 py-1 rounded-full">⭐ Annonce premium</span>
          )}
          <span className="text-sm text-white/85">📍 {annonce.location}</span>
          <span className="text-sm text-white/85">📅 Publiée le {publishedAt}</span>
          <span className="text-sm text-white/85">👁 {annonce.views} vues</span>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-[1fr_320px] gap-7">
        <div className="space-y-5">

          {/* KPIs */}
          {annonce.kpis && annonce.kpis.length > 0 && (
            <div className="card">
              <h2 className="section-label">Chiffres clés</h2>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${Math.min(annonce.kpis.length, 4)}, minmax(0, 1fr))` }}
              >
                {annonce.kpis.map(kpi => (
                  <div key={kpi.label} className="bg-surface rounded-lg p-4 text-center border border-border">
                    <div className="text-[22px] font-extrabold text-teal mb-1">{kpi.value}</div>
                    <div className="text-[11px] text-muted uppercase tracking-wider font-semibold">{kpi.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="card">
            <h2 className="section-label">Description de l'annonce</h2>
            <div className="text-[14px] text-navy/75 leading-relaxed space-y-3 whitespace-pre-line">
              {annonce.description}
            </div>

            {/* Tags */}
            {annonce.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {annonce.tags.map(tag => (
                  <span key={tag} className="bg-surface text-navy/70 text-xs font-semibold px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Share */}
          <div className="card">
            <h2 className="section-label">Partager cette annonce</h2>
            <div className="flex gap-2.5 items-center flex-wrap">
              <span className="text-xs text-muted font-semibold">Partager :</span>
              <button className="bg-[#0077B5] text-white text-xs font-bold px-4 py-2 rounded-full hover:opacity-90">LinkedIn</button>
              <button className="bg-[#1DA1F2] text-white text-xs font-bold px-4 py-2 rounded-full hover:opacity-90">Twitter / X</button>
              <button className="bg-surface text-navy/70 text-xs font-bold px-4 py-2 rounded-full hover:bg-border">🔗 Copier le lien</button>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-5">
          {/* Contact card */}
          <div className="bg-white rounded-xl border-2 border-teal p-6">
            {/* Annonceur */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-surface">
              <div className="w-12 h-12 rounded-full bg-teal-gradient flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0">
                {annonce.author.initials}
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy">{annonce.author.name}</h4>
                <p className="text-xs text-muted">{annonce.author.role}</p>
                {annonce.author.verified && (
                  <span className="text-[11px] text-green-600 font-semibold">✓ Profil vérifié LPT</span>
                )}
              </div>
            </div>

            {/* Price */}
            {annonce.price && (
              <div className="text-center py-4 mb-4 bg-surface rounded-xl">
                <div className="text-[26px] font-extrabold text-navy">{annonce.price}</div>
                {annonce.priceNote && <div className="text-xs text-muted mt-1">{annonce.priceNote}</div>}
              </div>
            )}

            {isOwner ? (
              <>
                <Link href="/compte" className="btn-primary w-full justify-center py-3 text-sm mb-2.5">
                  📊 Voir mes stats
                </Link>
                <p className="text-[11px] text-muted text-center mt-3">
                  C'est votre annonce — la modification arrive bientôt.
                </p>
              </>
            ) : (
              <>
                {session?.user ? (
                  <Link
                    href={`/messagerie?annonce=${encodeURIComponent(annonce.id)}&with=${encodeURIComponent(annonce.author.id)}`}
                    className="btn-primary w-full justify-center py-3 text-sm mb-2.5"
                  >
                    ✉️ Contacter l'annonceur
                  </Link>
                ) : (
                  <Link
                    href={`/connexion?callbackUrl=/annonce/${encodeURIComponent(annonce.id)}`}
                    className="btn-primary w-full justify-center py-3 text-sm mb-2.5"
                  >
                    ✉️ Se connecter pour contacter
                  </Link>
                )}
                {session?.user ? (
                  <SaveButton annonceReference={annonce.id} initialSaved={initialSaved} />
                ) : (
                  <Link
                    href={`/connexion?callbackUrl=/annonce/${encodeURIComponent(annonce.id)}`}
                    className="block text-center w-full border-2 border-border text-navy/70 font-bold text-sm py-2.5 rounded-lg hover:border-teal hover:text-teal transition-colors"
                  >
                    ♡ Sauvegarder l'annonce
                  </Link>
                )}
                <p className="text-[11px] text-muted text-center mt-3">
                  Votre message est confidentiel.<br />Réponse moyenne sous 24h.
                </p>
              </>
            )}
          </div>

          {/* Annonces similaires */}
          {similar.length > 0 && (
            <div className="card">
              <p className="section-label">Annonces similaires</p>
              <div className="space-y-0">
                {similar.map(s => (
                  <Link key={s.id} href={`/annonce/${s.id}`} className="flex gap-3 py-3 border-b border-surface last:border-0 hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                         style={{ background: CATEGORIES[s.category].bg }}>
                      {CATEGORIES[s.category].emoji}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-navy leading-snug mb-0.5">{s.title.length > 45 ? s.title.substring(0, 45) + '…' : s.title}</h5>
                      <p className="text-[11px] text-muted">{s.location} · {s.price ?? 'À définir'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
