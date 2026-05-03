'use client'
import { useState, useEffect, FormEvent, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

const FEATURES = [
  { emoji: '📝', title: 'Déposez vos annonces', desc: 'Cessions, recrutements, partenariats et plus' },
  { emoji: '💬', title: 'Messagerie directe', desc: 'Échangez en toute confidentialité' },
  { emoji: '⭐', title: 'Sauvegardez des annonces', desc: 'Retrouvez vos annonces favorites' },
  { emoji: '📊', title: 'Suivez vos performances', desc: 'Statistiques de vues et de contacts' },
]

const PROFILE_OPTIONS = [
  { value: 'FOUNDER',   label: 'Fondateur / CEO' },
  { value: 'INVESTOR',  label: 'Investisseur' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'PARTNER',   label: 'Business Developer' },
  { value: 'OTHER',     label: 'Autre' },
]

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionInner />
    </Suspense>
  )
}

function ConnexionInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [tab, setTab] = useState<'login' | 'register'>(
    params.get('tab') === 'register' ? 'register' : 'login',
  )
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setError(null) }, [tab])

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true); setError(null)
    const fd = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      redirect: false,
      email:    String(fd.get('email')),
      password: String(fd.get('password')),
    })
    setBusy(false)
    if (res?.error) {
      setError('Email ou mot de passe incorrect.')
      return
    }
    router.push(params.get('callbackUrl') ?? '/compte')
    router.refresh()
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true); setError(null)
    const fd = new FormData(e.currentTarget)
    const payload = {
      firstName: String(fd.get('firstName')),
      lastName:  String(fd.get('lastName')),
      email:     String(fd.get('email')),
      password:  String(fd.get('password')),
      profile:   String(fd.get('profile')),
    }
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setBusy(false)
      setError(data.error ?? 'Erreur lors de la création du compte')
      return
    }
    // Auto-login après inscription réussie
    const loginRes = await signIn('credentials', {
      redirect: false,
      email:    payload.email,
      password: payload.password,
    })
    setBusy(false)
    if (loginRes?.error) {
      setError('Compte créé. Connectez-vous pour continuer.')
      setTab('login')
      return
    }
    router.push('/compte')
    router.refresh()
  }

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
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-bold transition-colors border-b-[3px] -mb-0.5
                ${tab === t ? 'text-teal border-teal' : 'text-muted border-transparent'}`}>
              {t === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <h1 className="text-xl font-extrabold text-navy mb-1.5">Bon retour parmi nous 👋</h1>
            <p className="text-xs text-muted mb-7 leading-relaxed">
              Connectez-vous pour accéder à vos annonces et messages.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="label" htmlFor="login-email">Email</label>
                <input id="login-email" name="email" required className="input" type="email" placeholder="vous@email.com" autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor="login-password">Mot de passe</label>
                <input id="login-password" name="password" required className="input" type="password" placeholder="••••••••" autoComplete="current-password" />
              </div>
            </div>

            <div className="text-center mb-5">
              <a href="#" className="text-xs text-teal font-semibold hover:underline">Mot de passe oublié ?</a>
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3.5 text-sm mb-5 disabled:opacity-60">
              {busy ? 'Connexion…' : 'Se connecter →'}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">ou continuer avec</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2.5">
              {[{ icon: '🔵', label: 'Continuer avec LinkedIn' }, { icon: '⚫', label: 'Continuer avec Google' }].map(btn => (
                <button key={btn.label} type="button" disabled
                  className="w-full flex items-center justify-center gap-2.5 py-3 border-[1.5px] border-border rounded-xl text-sm font-semibold text-navy/70 opacity-60 cursor-not-allowed"
                  title="Disponible bientôt">
                  <span className="text-lg">{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h1 className="text-xl font-extrabold text-navy mb-1.5">Rejoignez Les Pépites Tech 🚀</h1>
            <p className="text-xs text-muted mb-7 leading-relaxed">
              Créez votre compte gratuitement et commencez à publier des annonces.
            </p>

            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="label" htmlFor="reg-first">Prénom</label>
                  <input id="reg-first" name="firstName" required className="input" placeholder="Jean" autoComplete="given-name" />
                </div>
                <div>
                  <label className="label" htmlFor="reg-last">Nom</label>
                  <input id="reg-last" name="lastName" required className="input" placeholder="Dupont" autoComplete="family-name" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="reg-email">Email professionnel</label>
                <input id="reg-email" name="email" required className="input" type="email" placeholder="vous@startup.com" autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor="reg-password">Mot de passe</label>
                <input id="reg-password" name="password" required minLength={8} className="input" type="password" placeholder="8 caractères minimum" autoComplete="new-password" />
              </div>
              <div>
                <label className="label" htmlFor="reg-profile">Vous êtes…</label>
                <select id="reg-profile" name="profile" className="input">
                  {PROFILE_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3.5 text-sm mb-5 disabled:opacity-60">
              {busy ? 'Création…' : 'Créer mon compte →'}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">ou s'inscrire avec</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2.5">
              {[{ icon: '🔵', label: "S'inscrire avec LinkedIn" }, { icon: '⚫', label: "S'inscrire avec Google" }].map(btn => (
                <button key={btn.label} type="button" disabled
                  className="w-full flex items-center justify-center gap-2.5 py-3 border-[1.5px] border-border rounded-xl text-sm font-semibold text-navy/70 opacity-60 cursor-not-allowed"
                  title="Disponible bientôt">
                  <span className="text-lg">{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
          </form>
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
