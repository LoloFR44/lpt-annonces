'use client'
import { useState } from 'react'
import Link from 'next/link'

const FEATURES = [
  { emoji: '📝', title: 'Déposez vos annonces', desc: 'Cessions, recrutements, partenariats et plus' },
  { emoji: '💬', title: 'Messagerie directe', desc: 'Échangez en toute confidentialité' },
  { emoji: '⭐', title: 'Sauvegardez des annonces', desc: 'Retrouvez vos annonces favorites' },
  { emoji: '📊', title: 'Suivez vos performances', desc: 'Statistiques de vues et de contacts' },
]

export default function ConnexionPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')

  return (
    <div className="grid grid-cols-[1fr_480px_1fr] min-h-[calc(100vh-60px)]">

      {/* Left panel — value prop */}
      <div className="bg-hero-gradient px-12 py-16 flex flex-col justify-center">
        <h2 className="text-[22px] font-extrabold text-white mb-2.5">
          La marketplace des entrepreneurs French Tech
        </h2>
        <p className="text-sm text-white/60 leading-relaxed mb-9">
          Rejoignez +12 000 fondateurs, investisseurs et freelances de l'écosystème startup français.
        </p>

        <ul className="space-y-0">
          {FEATURES.map(f => (
            <li key={f.title} className="flex gap-3 items-start py-2.5 border-b border-white/8 last:border-0">
              <span className="text-xl flex-shrink-0 mt-0.5">{f.emoji}</span>
              <div>
                <div className="text-sm font-bold text-white">{f.title}</div>
                <div className="text-xs text-white/50 mt-0.5">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex gap-7 mt-8">
          {[['1 200+', 'Membres actifs'], ['342', 'Annonces actives'], ['87', 'Mises en relation/mois']].map(([n, l]) => (
            <div key={l}>
              <div className="text-[22px] font-extrabold text-teal">{n}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Center — auth form */}
      <div className="bg-white border-x border-border flex flex-col justify-center px-10 py-12">

        {/* Tabs */}
        <div className="flex border-b-2 border-border mb-8">
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-bold transition-colors border-b-[3px] -mb-0.5
                ${tab === t ? 'text-teal border-teal' : 'text-muted border-transparent'}`}>
              {t === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <div>
            <h1 className="text-xl font-extrabold text-navy mb-1.5">Bon retour parmi nous 👋</h1>
            <p className="text-xs text-muted mb-7 leading-relaxed">
              Connectez-vous pour accéder à vos annonces et messages.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="vous@email.com" />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input className="input" type="password" placeholder="••••••••" />
              </div>
            </div>

            <div className="text-center mb-5">
              <a href="#" className="text-xs text-teal font-semibold hover:underline">Mot de passe oublié ?</a>
            </div>

            <button className="btn-primary w-full justify-center py-3.5 text-sm mb-5">
              Se connecter →
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">ou continuer avec</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2.5">
              {[{ icon: '🔵', label: 'Continuer avec LinkedIn' }, { icon: '⚫', label: 'Continuer avec Google' }].map(btn => (
                <button key={btn.label}
                  className="w-full flex items-center justify-center gap-2.5 py-3 border-[1.5px] border-border rounded-xl text-sm font-semibold text-navy/70 hover:border-teal hover:bg-teal-light transition-colors">
                  <span className="text-lg">{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-extrabold text-navy mb-1.5">Rejoignez Les Pépites Tech 🚀</h1>
            <p className="text-xs text-muted mb-7 leading-relaxed">
              Créez votre compte gratuitement et commencez à publier des annonces.
            </p>

            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="label">Prénom</label>
                  <input className="input" placeholder="Jean" />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input className="input" placeholder="Dupont" />
                </div>
              </div>
              <div>
                <label className="label">Email professionnel</label>
                <input className="input" type="email" placeholder="vous@startup.com" />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input className="input" type="password" placeholder="8 caractères minimum" />
              </div>
              <div>
                <label className="label">Vous êtes…</label>
                <select className="input">
                  <option>Fondateur / CEO</option>
                  <option>Investisseur</option>
                  <option>Freelance</option>
                  <option>Business Developer</option>
                  <option>Autre</option>
                </select>
              </div>
            </div>

            <button className="btn-primary w-full justify-center py-3.5 text-sm mb-5">
              Créer mon compte →
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">ou s'inscrire avec</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2.5">
              {[{ icon: '🔵', label: "S'inscrire avec LinkedIn" }, { icon: '⚫', label: "S'inscrire avec Google" }].map(btn => (
                <button key={btn.label}
                  className="w-full flex items-center justify-center gap-2.5 py-3 border-[1.5px] border-border rounded-xl text-sm font-semibold text-navy/70 hover:border-teal hover:bg-teal-light transition-colors">
                  <span className="text-lg">{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted text-center mt-6 leading-relaxed">
          En continuant, vous acceptez nos{' '}
          <a href="#" className="text-teal hover:underline">CGU</a>{' '}
          et notre{' '}
          <a href="#" className="text-teal hover:underline">Politique de confidentialité</a>.
        </p>
      </div>

      {/* Right — empty bg */}
      <div className="bg-surface" />
    </div>
  )
}
