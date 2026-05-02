import Link from 'next/link'
import { ANNONCES } from '@/data/mock'
import { CATEGORIES } from '@/lib/types'

const STATS = [
  { label: 'Vues totales', value: '1 247', delta: '↑ +18% cette semaine', color: 'text-teal' },
  { label: 'Contacts reçus', value: '34', delta: '↑ +5 nouveaux', color: 'text-teal' },
  { label: 'Messages non lus', value: '4', delta: '3 conversations actives', color: 'text-gold' },
  { label: 'Annonces actives', value: '3', delta: '1 expire dans 7 jours', color: 'text-navy' },
]

const MY_ANNONCES = [
  { id: 'lpt-001', category: 'cession' as const, title: 'Cession SaaS RH — 180K ARR, rentable, équipe de 3', status: 'active', plan: 'premium', views: 847, contacts: 18, expires: '29 juil. 2026' },
  { id: 'lpt-002', category: 'recrutement' as const, title: 'CTO recherché — Startup FinTech Série A, Paris', status: 'active', plan: 'free', views: 312, contacts: 12, expires: '15 mai 2026' },
  { id: 'lpt-003', category: 'partenariat' as const, title: 'Partenariat distribution SaaS B2B — intégration API', status: 'pending', plan: 'free', views: 88, contacts: 4, expires: '20 mai 2026' },
]

const RECENT_MESSAGES = [
  { initials: 'AS', name: 'Alexandre Simon', preview: 'Bonjour, très intéressé par votre SaaS RH. Auriez-vous…', time: 'Il y a 2h', unread: true, gradient: 'from-teal to-teal-dark' },
  { initials: 'ML', name: 'Marie Laurent', preview: 'Pouvez-vous me transmettre un NDA avant de continuer…', time: 'Il y a 5h', unread: true, gradient: 'from-gold to-yellow-600' },
  { initials: 'PD', name: 'Pierre Dubois', preview: "Merci pour votre retour. Je pense que ça pourrait…", time: 'Hier', unread: false, gradient: 'from-bordeaux to-red-800' },
]

const NAV_ITEMS = [
  { emoji: '📊', label: 'Tableau de bord', href: '/compte', active: true },
  { emoji: '📋', label: 'Mes annonces', href: '/compte', badge: '3' },
  { emoji: '✉️', label: 'Messages', href: '/messagerie', badge: '4', badgeColor: 'bg-teal text-white' },
  { emoji: '♡', label: 'Annonces sauvegardées', href: '/compte' },
  null,
  { emoji: '👤', label: 'Mon profil', href: '/compte' },
  { emoji: '🔔', label: 'Alertes email', href: '/compte' },
  { emoji: '💳', label: 'Facturation', href: '/compte' },
  null,
  { emoji: '❓', label: 'Aide & FAQ', href: '/compte' },
]

export default function ComptePage() {
  return (
    <>
      {/* Dashboard header */}
      <div className="bg-hero-gradient text-white px-8 py-6">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-gradient flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0">
              T
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Bonjour, Thomas 👋</h1>
              <p className="text-sm text-white/50">thomas.martin@techsaas.fr</p>
              <span className="text-xs text-teal font-semibold">✓ Profil vérifié · Membre depuis mars 2024</span>
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
          {NAV_ITEMS.map((item, i) => (
            item === null
              ? <div key={i} className="my-2 border-t border-border" />
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
            {STATS.map(s => (
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
            <div className="space-y-3">
              {MY_ANNONCES.map(a => {
                const cat = CATEGORIES[a.category]
                return (
                  <div key={a.id} className="flex gap-4 items-center p-4 rounded-xl border border-border hover:border-teal/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                         style={{ background: cat.bg }}>
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-navy mb-1 truncate">{a.title}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                          ${a.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {a.status === 'active' ? '🟢 Active' : '🟡 En attente'}
                        </span>
                        {a.plan === 'premium' && (
                          <span className="text-[10px] font-bold bg-gold-light text-gold px-2 py-0.5 rounded-full">⭐ Premium</span>
                        )}
                        <span className="text-[11px] text-muted">Expire le {a.expires}</span>
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-base font-extrabold text-navy">{a.views}</div>
                      <div className="text-[10px] text-muted">vues</div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-base font-extrabold text-teal">{a.contacts}</div>
                      <div className="text-[10px] text-muted">contacts</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button className="text-[11px] font-bold text-navy/60 bg-surface px-3 py-1.5 rounded-lg hover:bg-border transition-colors">
                        Modifier
                      </button>
                      {a.plan === 'free' && (
                        <button className="text-[11px] font-bold text-gold bg-gold-light border border-gold/30 px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity">
                          ⭐ Booster
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent messages */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <p className="section-label">Messages récents</p>
              <Link href="/messagerie" className="text-xs text-teal font-bold hover:underline">Voir tous les messages →</Link>
            </div>
            <div className="space-y-0 -mx-5">
              {RECENT_MESSAGES.map((msg, i) => (
                <Link key={i} href="/messagerie"
                  className={`flex gap-3 items-center px-5 py-3.5 border-b border-surface last:border-0 hover:bg-surface/50 transition-colors
                    ${msg.unread ? 'bg-teal-light/30' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 bg-gradient-to-br ${msg.gradient}`}>
                    {msg.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-navy mb-0.5">{msg.name}</h5>
                    <p className="text-xs text-muted truncate">{msg.preview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-muted">{msg.time}</span>
                    {msg.unread && <span className="w-2 h-2 rounded-full bg-teal" />}
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
