import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { CATEGORIES, Category } from '@/lib/types'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Category as PrismaCategory, AnnonceStatus, AnnoncePlan } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PRISMA_TO_MOCK_CATEGORY: Record<PrismaCategory, Category> = {
  CESSION: 'cession', RECRUTEMENT: 'recrutement', PARTENARIAT: 'partenariat',
  FREELANCE: 'freelance', MATERIEL: 'materiel', LOCAUX: 'locaux',
}
const STATUS_LABEL: Record<AnnonceStatus, { label: string; cls: string }> = {
  ACTIVE:   { label: '🟢 Active',     cls: 'bg-green-50 text-green-700' },
  DRAFT:    { label: '✏️ Brouillon',  cls: 'bg-blue-50 text-blue-700' },
  EXPIRED:  { label: '⌛ Expirée',    cls: 'bg-gray-100 text-gray-600' },
  ARCHIVED: { label: '📦 Archivée',  cls: 'bg-gray-100 text-gray-600' },
}
const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function ComptePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/connexion?callbackUrl=/compte')
  const userId = session.user.id

  const [annonces, totalViews, contactsCount, unreadCount, recentMessages, savedCount] = await Promise.all([
    prisma.annonce.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.annonce.aggregate({
      where: { authorId: userId },
      _sum: { views: true },
    }),
    prisma.message.count({ where: { receiverId: userId } }),
    prisma.message.count({ where: { receiverId: userId, readAt: null } }),
    prisma.message.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { sender: { select: { name: true, email: true, role: true } } },
    }),
    prisma.savedAnnonce.count({ where: { userId } }),
  ])

  const stats = [
    { label: 'Vues totales',     value: String(totalViews._sum.views ?? 0), delta: 'cumulé sur vos annonces',  color: 'text-teal' },
    { label: 'Contacts reçus',   value: String(contactsCount),              delta: 'messages reçus au total',  color: 'text-teal' },
    { label: 'Messages non lus', value: String(unreadCount),                delta: unreadCount > 0 ? 'à traiter' : 'tout est à jour', color: unreadCount > 0 ? 'text-gold' : 'text-navy' },
    { label: 'Annonces actives', value: String(annonces.filter(a => a.status === AnnonceStatus.ACTIVE).length), delta: `sur ${annonces.length} au total`, color: 'text-navy' },
  ]

  const navItems: Array<{ emoji: string; label: string; href: string; active?: boolean; badge?: string; badgeColor?: string } | null> = [
    { emoji: '📊', label: 'Tableau de bord', href: '/compte', active: true },
    { emoji: '📋', label: 'Mes annonces', href: '/compte', badge: String(annonces.length) },
    { emoji: '✉️', label: 'Messages', href: '/messagerie', badge: unreadCount > 0 ? String(unreadCount) : undefined, badgeColor: 'bg-teal text-white' },
    { emoji: '♡', label: 'Annonces sauvegardées', href: '/compte/sauvegardes', badge: savedCount > 0 ? String(savedCount) : undefined },
    null,
    { emoji: '👤', label: 'Mon profil', href: '/compte' },
    { emoji: '🔔', label: 'Alertes email', href: '/compte' },
    { emoji: '💳', label: 'Facturation', href: '/compte' },
    null,
    { emoji: '❓', label: 'Aide & FAQ', href: '/compte' },
  ]

  const displayName = session.user.name ?? session.user.email
  const initials = (session.user.name?.trim().charAt(0) || session.user.email.charAt(0)).toUpperCase()
  const firstName = session.user.name?.trim().split(/\s+/)[0] ?? session.user.email.split('@')[0]

  return (
    <>
      {/* Dashboard header */}
      <div className="bg-hero-gradient text-white px-8 py-6">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-gradient flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Bonjour, {firstName} 👋</h1>
              <p className="text-sm text-white/50">{session.user.email}</p>
              {session.user.verified && (
                <span className="text-xs text-teal font-semibold">✓ Profil vérifié</span>
              )}
            </div>
          </div>
          <Link href="/deposer" className="bg-teal hover:bg-teal-dark text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors">
            📝 Déposer une annonce
          </Link>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-[220px_1fr] gap-7">

        {/* Side nav */}
        <nav className="space-y-0.5">
          {navItems.map((item, i) => (
            item === null
              ? <div key={`sep-${i}`} className="my-2 border-t border-border" />
              : (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors
                    ${item.active ? 'bg-teal-light text-teal' : 'text-navy/70 hover:bg-surface hover:text-navy'}`}>
                  <span>{item.emoji}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor ?? 'bg-surface text-navy/60'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
          ))}
        </nav>

        {/* Main content */}
        <div className="space-y-6">

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="card text-center">
                <p className="text-[11px] text-muted uppercase tracking-wider font-bold mb-2">{s.label}</p>
                <p className={`text-[28px] font-extrabold mb-1 ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-muted">{s.delta}</p>
              </div>
            ))}
          </div>

          {/* My annonces */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <p className="section-label">Mes annonces</p>
              <Link href="/deposer" className="text-xs text-teal font-bold hover:underline">+ Nouvelle annonce</Link>
            </div>
            {annonces.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">
                Vous n'avez pas encore publié d'annonce —{' '}
                <Link href="/deposer" className="text-teal font-semibold hover:underline">commencer maintenant</Link>.
              </p>
            ) : (
              <div className="space-y-3">
                {annonces.map(a => {
                  const cat = CATEGORIES[PRISMA_TO_MOCK_CATEGORY[a.category]]
                  const status = STATUS_LABEL[a.status]
                  return (
                    <div key={a.id} className="flex gap-4 items-center p-4 rounded-xl border border-border hover:border-teal/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: cat.bg }}>
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/annonce/${a.reference}`} className="text-sm font-bold text-navy mb-1 truncate block hover:text-teal transition-colors">
                          {a.title}
                        </Link>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                          {a.plan === AnnoncePlan.PREMIUM && (
                            <span className="text-[10px] font-bold bg-gold-light text-gold px-2 py-0.5 rounded-full">⭐ Premium</span>
                          )}
                          <span className="text-[11px] text-muted">Expire le {DATE_FMT.format(a.expiresAt)}</span>
                        </div>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <div className="text-base font-extrabold text-navy">{a.views}</div>
                        <div className="text-[10px] text-muted">vues</div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button className="text-[11px] font-bold text-navy/60 bg-surface px-3 py-1.5 rounded-lg hover:bg-border transition-colors" disabled title="Bientôt disponible">
                          Modifier
                        </button>
                        {a.plan === AnnoncePlan.FREE && (
                          <button className="text-[11px] font-bold text-gold bg-gold-light border border-gold/30 px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity" disabled title="Bientôt disponible">
                            ⭐ Booster
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent messages */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <p className="section-label">Messages récents</p>
              <Link href="/messagerie" className="text-xs text-teal font-bold hover:underline">Voir tous les messages →</Link>
            </div>
            {recentMessages.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">Pas encore de message reçu.</p>
            ) : (
              <div className="space-y-0 -mx-5">
                {recentMessages.map(m => {
                  const senderName = m.sender.name ?? m.sender.email
                  const initials = (m.sender.name?.trim().charAt(0) || m.sender.email.charAt(0)).toUpperCase()
                  const unread = m.readAt === null
                  return (
                    <Link key={m.id} href="/messagerie"
                      className={`flex gap-3 items-center px-5 py-3.5 border-b border-surface last:border-0 hover:bg-surface/50 transition-colors ${unread ? 'bg-teal-light/30' : ''}`}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 bg-teal-gradient">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold text-navy mb-0.5">{senderName}</h5>
                        <p className="text-xs text-muted truncate">{m.body}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-[11px] text-muted">{DATE_FMT.format(m.createdAt)}</span>
                        {unread && <span className="w-2 h-2 rounded-full bg-teal" />}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
