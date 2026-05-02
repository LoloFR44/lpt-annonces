'use client'
import { useState } from 'react'
import Link from 'next/link'

const CONVERSATIONS = [
  { id: 'c1', initials: 'AS', gradient: 'from-teal to-teal-dark', name: 'Alexandre Simon', annonce: '🔄 Cession SaaS RH', preview: 'Bonjour, votre SaaS RH m\'intéresse…', time: '14:32', unread: 2 },
  { id: 'c2', initials: 'ML', gradient: 'from-gold to-yellow-600', name: 'Marie Laurent', annonce: '🔄 Cession SaaS RH', preview: 'Pouvez-vous me transmettre un NDA…', time: '11:15', unread: 1 },
  { id: 'c3', initials: 'PD', gradient: 'from-bordeaux to-red-800', name: 'Pierre Dubois', annonce: '👥 CTO recherché', preview: 'Merci pour votre retour, je pense…', time: 'Hier', unread: 0 },
  { id: 'c4', initials: 'CF', gradient: 'from-blue-500 to-blue-700', name: 'Claire Fontaine', annonce: '🤝 Partenariat distribution', preview: 'Parfait, on peut fixer un appel…', time: 'Mar.', unread: 1 },
  { id: 'c5', initials: 'JB', gradient: 'from-purple-500 to-purple-700', name: 'Julien Bernard', annonce: '👥 CTO recherché', preview: 'Voici mon GitHub et mon CV…', time: 'Lun.', unread: 0 },
]

const THREAD = [
  { from: 'them', text: 'Bonjour, je suis très intéressé par votre SaaS RH. Pourriez-vous me donner plus de détails sur la stack technique et les conditions de cession ?', time: '14:12' },
  { from: 'me', text: 'Bonjour Alexandre ! Bien sûr, la stack est React + Node.js + PostgreSQL, hébergé sur AWS. Concernant la cession, nous sommes ouverts à une reprise progressive avec accompagnement de 6 mois.', time: '14:20' },
  { from: 'them', text: "C'est exactement ce que je recherche. Est-ce que vous pourriez me préparer un mémorandum d'information avec les indicateurs financiers des 12 derniers mois ?", time: '14:28' },
  { from: 'me', text: 'Tout à fait, je vous prépare ça. Seriez-vous disponible pour un appel de découverte la semaine prochaine ?', time: '14:31' },
  { from: 'them', text: 'Oui, mercredi ou jeudi matin me conviendraient. Je peux faire 9h-12h en visio. Envoyez-moi un lien Calendly si vous en avez un.', time: '14:32' },
]

export default function MessageriePage() {
  const [activeConv, setActiveConv] = useState('c1')
  const active = CONVERSATIONS.find(c => c.id === activeConv)!

  return (
    <>
      {/* Page header */}
      <div className="bg-hero-gradient text-white px-8 py-5">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold">✉️ Messagerie</h1>
            <p className="text-sm text-white/50">4 messages non lus</p>
          </div>
          <Link href="/compte" className="text-sm text-white/60 hover:text-white transition-colors">
            ← Mon tableau de bord
          </Link>
        </div>
      </div>

      {/* Split layout — fills remaining viewport height */}
      <div className="flex" style={{ height: 'calc(100vh - 60px - 80px)' }}>

        {/* Inbox sidebar */}
        <div className="w-[320px] bg-white border-r border-border flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-border">
            <input
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:outline-none focus:border-teal transition-colors"
              placeholder="🔍 Rechercher une conversation…"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {CONVERSATIONS.map(conv => (
              <button key={conv.id} onClick={() => setActiveConv(conv.id)}
                className={`w-full flex gap-3 items-start px-4 py-3.5 border-b border-surface text-left hover:bg-surface/70 transition-colors
                  ${activeConv === conv.id ? 'bg-teal-light border-l-2 border-l-teal' : ''}
                  ${conv.unread > 0 ? 'bg-teal-light/30' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 bg-gradient-to-br ${conv.gradient}`}>
                  {conv.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-teal font-bold mb-0.5">{conv.annonce}</p>
                  <h5 className="text-sm font-bold text-navy mb-0.5">{conv.name}</h5>
                  <p className="text-xs text-muted truncate">{conv.preview}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[11px] text-muted">{conv.time}</span>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-surface min-w-0">

          {/* Chat header */}
          <div className="bg-white border-b border-border px-6 py-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 bg-gradient-to-br ${active.gradient}`}>
              {active.initials}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-navy">{active.name}</h4>
              <p className="text-xs text-muted">{active.annonce}</p>
            </div>
            <div className="flex gap-2">
              <button className="text-xs font-bold text-navy/60 bg-surface px-3 py-1.5 rounded-lg hover:bg-border transition-colors">
                Voir l'annonce →
              </button>
              <button className="text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                Signaler
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="text-center text-[11px] text-muted font-semibold uppercase tracking-wider py-1">
              Aujourd'hui
            </div>
            {THREAD.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.from === 'me'
                    ? 'bg-teal text-white rounded-br-sm'
                    : 'bg-white text-navy/80 rounded-bl-sm border border-border shadow-sm'}`}>
                  {msg.text}
                  <p className={`text-[10px] mt-1.5 ${msg.from === 'me' ? 'text-white/60 text-right' : 'text-muted text-right'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div className="bg-white border-t border-border px-6 py-2 text-center">
            <p className="text-[11px] text-muted">🔒 Messages confidentiels · Ne partagez jamais vos coordonnées bancaires</p>
          </div>

          {/* Input area */}
          <div className="bg-white border-t border-border px-5 py-3.5 flex gap-3 items-end">
            <textarea
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-navy placeholder:text-muted focus:outline-none focus:border-teal transition-colors resize-none"
              placeholder="Écrivez votre message…"
              rows={2}
            />
            <button className="bg-teal hover:bg-teal-dark text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors flex-shrink-0">
              Envoyer →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
