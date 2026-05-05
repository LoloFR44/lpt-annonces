import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { CATEGORIES, Category } from '@/lib/types'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listThreadsForUser, getThreadMessages, markThreadAsRead, countUnreadForUser } from '@/lib/messages'
import Composer from '@/components/messages/Composer'
import { Category as PrismaCategory } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PRISMA_TO_CATEGORY: Record<PrismaCategory, Category> = {
  CESSION_REPRISE:           'cession-reprise',
  ASSOCIES_COFONDATEURS:     'associes-cofondateurs',
  RECRUTEMENT:               'recrutement',
  PARTENARIATS_DISTRIBUTION: 'partenariats-distribution',
  MISSIONS_EXPERTS:          'missions-experts',
  LOCAUX_RESSOURCES:         'locaux-ressources',
  MATERIEL:                  'locaux-ressources',
}

const TIME_FMT = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const DAY_FMT  = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function relativeLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const day   = new Date(date); day.setHours(0, 0, 0, 0)
  const diff  = Math.round((today.getTime() - day.getTime()) / 86_400_000)
  if (diff === 0) return TIME_FMT.format(date)
  if (diff === 1) return 'Hier'
  if (diff < 7)   return new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date)
  return DAY_FMT.format(date)
}

interface PageProps {
  searchParams: { annonce?: string; with?: string }
}

export default async function MessageriePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/connexion?callbackUrl=/messagerie')
  const userId = session.user.id

  // 1) If a thread is targeted, mark its inbound messages as read first so the
  //    sidebar reflects the up-to-date state.
  let activeAnnonce: { id: string; reference: string; title: string; category: keyof typeof CATEGORIES; authorId: string } | null = null
  let activeOther:   { id: string; name: string | null; email: string; role: string | null } | null = null
  let activeMessages: Awaited<ReturnType<typeof getThreadMessages>> = null

  if (searchParams.annonce && searchParams.with) {
    const annonceRow = await prisma.annonce.findUnique({
      where: { reference: searchParams.annonce },
      select: { id: true, reference: true, title: true, category: true, authorId: true },
    })
    const otherRow = await prisma.user.findUnique({
      where: { id: searchParams.with },
      select: { id: true, name: true, email: true, role: true },
    })

    if (annonceRow && otherRow && otherRow.id !== userId) {
      // The user must be one side of the conversation: either author of the
      // annonce, OR contacting the author. Anything else is a 404.
      const allowed = annonceRow.authorId === userId || annonceRow.authorId === otherRow.id
      if (allowed) {
        await markThreadAsRead(userId, annonceRow.id, otherRow.id)
        activeAnnonce  = {
          id: annonceRow.id, reference: annonceRow.reference, title: annonceRow.title,
          category: PRISMA_TO_CATEGORY[annonceRow.category],
          authorId: annonceRow.authorId,
        }
        activeOther    = otherRow
        activeMessages = await getThreadMessages(userId, annonceRow.id, otherRow.id)
      }
    }
  }

  const [threads, unreadTotal] = await Promise.all([
    listThreadsForUser(userId),
    countUnreadForUser(userId),
  ])

  // Initiales seulement (pas de nom complet) — privacy par défaut.
  function initialsOf(name: string | null | undefined, fallback: string): string {
    const source = (name?.trim() || fallback).normalize('NFKD').replace(/[^a-zA-Z\s]/g, '')
    const ini = source.split(/\s+/).filter(Boolean).slice(0, 3).map((w) => w[0].toUpperCase()).join('')
    return ini || '?'
  }
  const activeOtherInitials = activeOther ? initialsOf(activeOther.name, activeOther.email) : ''
  const isNewThread = activeMessages !== null && activeMessages.length === 0
  const FIRST_MESSAGE_TEMPLATE = 'Je souhaite avoir plus d\'informations concernant votre annonce, êtes-vous disponible pour échanger ?'

  return (
    <>
      {/* Page header */}
      <div className="bg-hero-gradient text-white px-8 py-5">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold">✉️ Messagerie</h1>
            <p className="text-sm text-white/50">
              {unreadTotal > 0 ? `${unreadTotal} message${unreadTotal > 1 ? 's' : ''} non lu${unreadTotal > 1 ? 's' : ''}` : 'Tout est à jour'}
            </p>
          </div>
          <Link href="/compte" className="text-sm text-white/60 hover:text-white transition-colors">
            ← Mon tableau de bord
          </Link>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex" style={{ height: 'calc(100vh - 60px - 80px)' }}>

        {/* Inbox sidebar */}
        <div className="w-[320px] bg-white border-r border-border flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-border">
            <input
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:outline-none focus:border-teal transition-colors"
              placeholder="🔍 Rechercher une conversation…"
              disabled
              title="Recherche bientôt disponible"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {threads.length === 0 ? (
              <p className="text-sm text-muted text-center py-10 px-6">
                Pas encore de conversation — commencez par contacter un annonceur depuis une fiche d'annonce.
              </p>
            ) : threads.map((t) => {
              const isActive = activeAnnonce?.id === t.annonceId && activeOther?.id === t.otherUserId
              const cat = CATEGORIES[t.annonceCategory]
              return (
                <Link
                  key={`${t.annonceId}:${t.otherUserId}`}
                  href={`/messagerie?annonce=${encodeURIComponent(t.annonceReference)}&with=${encodeURIComponent(t.otherUserId)}`}
                  className={`flex gap-3 items-start px-4 py-3.5 border-b border-surface text-left hover:bg-surface/70 transition-colors
                    ${isActive ? 'bg-teal-light border-l-2 border-l-teal' : ''}
                    ${t.unreadCount > 0 ? 'bg-teal-light/30' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 bg-teal-gradient">
                    {t.otherUserInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold mb-0.5 truncate" style={{ color: cat.color }}>
                      {cat.emoji} {t.annonceTitle.length > 28 ? t.annonceTitle.slice(0, 28) + '…' : t.annonceTitle}
                    </p>
                    <h5 className="text-sm font-bold text-navy mb-0.5">{t.otherUserInitial}</h5>
                    <p className="text-xs text-muted truncate">
                      {t.lastSenderIsMe ? <span className="text-navy/50">Vous : </span> : null}
                      {t.lastMessage}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-muted">{relativeLabel(t.lastMessageAt)}</span>
                    {t.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-surface min-w-0">

          {!activeAnnonce || !activeOther ? (
            <div className="flex-1 flex items-center justify-center text-center px-10">
              <div>
                <div className="text-5xl mb-3">✉️</div>
                <h3 className="text-lg font-extrabold text-navy mb-1">Sélectionnez une conversation</h3>
                <p className="text-sm text-muted max-w-md">
                  Choisissez une conversation à gauche ou contactez un annonceur depuis une fiche d'annonce
                  pour démarrer un nouveau fil.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header — initiales seulement, pas de nom complet */}
              <div className="bg-white border-b border-border px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 bg-teal-gradient">
                  {activeOtherInitials}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-navy">{activeOtherInitials}</h4>
                  <p className="text-xs text-muted">{CATEGORIES[activeAnnonce.category].emoji} {activeAnnonce.title}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/annonce/${activeAnnonce.reference}`}
                    className="text-xs font-bold text-navy/60 bg-surface px-3 py-1.5 rounded-lg hover:bg-border transition-colors"
                  >
                    Voir l'annonce →
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {activeMessages && activeMessages.length === 0 ? (
                  <p className="text-center text-sm text-muted py-10">
                    Première prise de contact — écrivez votre message ci-dessous.
                  </p>
                ) : activeMessages?.map((m) => (
                  <div key={m.id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                      ${m.fromMe
                        ? 'bg-teal text-white rounded-br-sm'
                        : 'bg-white text-navy/80 rounded-bl-sm border border-border shadow-sm'}`}>
                      <span className="whitespace-pre-line">{m.body}</span>
                      <p className={`text-[10px] mt-1.5 ${m.fromMe ? 'text-white/60' : 'text-muted'} text-right`}>
                        {relativeLabel(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security note */}
              <div className="bg-white border-t border-border px-6 py-2 text-center">
                <p className="text-[11px] text-muted">🔒 Messages confidentiels · Ne partagez jamais vos coordonnées bancaires</p>
              </div>

              <Composer
                annonceReference={activeAnnonce.reference}
                recipientId={activeOther.id}
                defaultBody={isNewThread ? FIRST_MESSAGE_TEMPLATE : undefined}
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}
