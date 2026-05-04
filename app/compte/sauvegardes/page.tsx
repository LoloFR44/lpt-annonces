import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { CATEGORIES, Category } from '@/lib/types'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Category as PrismaCategory, AnnoncePlan } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PRISMA_TO_MOCK_CATEGORY: Record<PrismaCategory, Category> = {
  CESSION: 'cession', RECRUTEMENT: 'recrutement', PARTENARIAT: 'partenariat',
  FREELANCE: 'freelance', MATERIEL: 'materiel', LOCAUX: 'locaux',
}
const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function SauvegardesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/connexion?callbackUrl=/compte/sauvegardes')

  const saved = await prisma.savedAnnonce.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      annonce: {
        include: {
          author: { select: { name: true, verified: true } },
        },
      },
    },
  })

  return (
    <>
      <div className="bg-hero-gradient text-white px-8 py-6">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold">♥ Annonces sauvegardées</h1>
            <p className="text-sm text-white/50">{saved.length} annonce{saved.length > 1 ? 's' : ''} en mémoire</p>
          </div>
          <Link href="/compte" className="text-sm text-white/60 hover:text-white transition-colors">
            ← Tableau de bord
          </Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        {saved.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-10 text-center">
            <div className="text-4xl mb-3">♡</div>
            <h2 className="text-lg font-extrabold text-navy mb-1.5">Aucune annonce sauvegardée</h2>
            <p className="text-sm text-muted mb-5 max-w-md mx-auto">
              Cliquez sur le ♡ d'une annonce pour la garder à portée de main.
            </p>
            <Link href="/" className="btn-primary inline-block">Parcourir les annonces</Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {saved.map((s) => {
              const a = s.annonce
              const cat = CATEGORIES[PRISMA_TO_MOCK_CATEGORY[a.category]]
              return (
                <Link
                  key={s.id}
                  href={`/annonce/${a.reference}`}
                  className={`block bg-white rounded-xl border transition-all duration-200 p-5
                              hover:border-teal hover:shadow-lg hover:-translate-y-0.5
                              ${a.plan === AnnoncePlan.PREMIUM ? 'border-l-4 border-l-gold border-border bg-[#FFFDF5]' : 'border-border'}`}
                >
                  <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: cat.bg }}>
                      {cat.emoji}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-navy mb-1.5 leading-snug">{a.title}</h3>
                      <p className="text-[13px] text-navy/60 leading-relaxed mb-2.5 line-clamp-2">{a.description}</p>
                      <div className="flex gap-3 flex-wrap items-center">
                        <span className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 bg-teal-light text-teal">
                          {cat.emoji} {cat.label}
                        </span>
                        {a.location && (
                          <span className="text-[11px] font-semibold bg-surface text-navy/70 px-2.5 py-0.5 rounded-full">
                            📍 {a.location}
                          </span>
                        )}
                        <span className="text-[11px] text-muted">Sauvegardée le {DATE_FMT.format(s.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-[17px] font-extrabold text-navy mb-1.5 ${!a.priceLabel ? 'text-[13px] text-muted font-semibold' : ''}`}>
                        {a.priceLabel ?? 'À définir'}
                      </div>
                      <span className="inline-block bg-teal text-white text-xs font-bold px-4 py-1.5 rounded-full">
                        Voir →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
