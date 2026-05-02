'use client'
import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

const PAGE_NAMES: Record<string, string> = {
  '/':                    'Listing des annonces',
  '/annonce':             'Détail annonce',
  '/deposer':             'Dépôt — Étape 1 : Catégorie',
  '/deposer/details':     'Dépôt — Étape 2 : Détails',
  '/deposer/visibilite':  'Dépôt — Étape 3 : Visibilité',
  '/deposer/confirmation':'Dépôt — Étape 4 : Confirmation',
  '/connexion':           'Connexion / Inscription',
  '/compte':              'Tableau de bord',
  '/messagerie':          'Messagerie',
}

export default function FeedbackOverlay() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [element, setElement] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Resolve page name
  const pageName = Object.entries(PAGE_NAMES)
    .filter(([k]) => pathname.startsWith(k))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? pathname

  function buildReport() {
    const lines = [
      `📋 **Feedback page : ${pageName}**`,
      `🔗 URL : \`${pathname}\``,
      element ? `🎯 Élément concerné : ${element}` : null,
      ``,
      `📝 Commentaire :`,
      feedback || '(aucun commentaire)',
    ].filter(Boolean)
    return lines.join('\n')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildReport())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleClose() {
    setOpen(false)
    setFeedback('')
    setElement('')
    setCopied(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="Laisser un commentaire sur cette page"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-navy text-white text-xs font-bold
                   px-4 py-2.5 rounded-full shadow-lg hover:bg-navy-medium transition-all duration-200
                   hover:shadow-xl hover:-translate-y-0.5 group"
      >
        <span className="text-base">💬</span>
        <span className="group-hover:inline">Feedback</span>
        <span className="bg-teal text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
          LPT
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-[420px] max-h-[90vh] flex flex-col overflow-hidden border border-border">
            {/* Header */}
            <div className="bg-hero-gradient px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-teal text-[10px] font-bold uppercase tracking-widest mb-0.5">Feedback LPT</p>
                <h3 className="text-white font-extrabold text-sm">{pageName}</h3>
                <p className="text-white/50 text-[11px] font-mono mt-0.5">{pathname}</p>
              </div>
              <button onClick={handleClose} className="text-white/60 hover:text-white text-xl leading-none transition-colors">✕</button>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Element concerned */}
              <div>
                <label className="label">Élément concerné (optionnel)</label>
                <input
                  type="text"
                  value={element}
                  onChange={e => setElement(e.target.value)}
                  placeholder="Ex : bouton CTA, carte annonce, header…"
                  className="input text-sm"
                />
              </div>

              {/* Feedback text */}
              <div>
                <label className="label">Ton commentaire <span className="text-red-400">*</span></label>
                <textarea
                  ref={textareaRef}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Décris ce que tu voudrais changer, améliorer ou corriger sur cette page…"
                  rows={5}
                  className="input resize-none text-sm leading-relaxed"
                  autoFocus
                />
              </div>

              {/* Preview */}
              {feedback && (
                <div className="bg-surface rounded-xl p-4 border border-border">
                  <p className="section-label mb-2">Aperçu du message à coller dans le chat</p>
                  <pre className="text-xs text-navy/80 whitespace-pre-wrap font-mono leading-relaxed">
                    {buildReport()}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-4 flex items-center gap-3">
              <button
                onClick={handleCopy}
                disabled={!feedback.trim()}
                className={`flex-1 flex items-center justify-center gap-2 font-bold text-sm py-2.5 rounded-xl transition-all
                  ${feedback.trim()
                    ? copied
                      ? 'bg-green-500 text-white'
                      : 'bg-teal text-white hover:bg-teal-dark'
                    : 'bg-border text-muted cursor-not-allowed'
                  }`}
              >
                {copied ? '✓ Copié !' : '📋 Copier et coller dans le chat'}
              </button>
              <button onClick={handleClose} className="text-xs text-muted hover:text-navy font-semibold transition-colors">
                Fermer
              </button>
            </div>

            {/* Instruction */}
            {copied && (
              <div className="bg-green-50 border-t border-green-100 px-5 py-3 text-center">
                <p className="text-green-700 text-xs font-semibold">
                  ✓ Colle ce message dans le chat Claude — les modifications seront appliquées !
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
