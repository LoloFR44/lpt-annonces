import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { AnnoncePlan, AnnonceStatus, Category as PrismaCategory, TransactionStatus } from '@prisma/client'
import DepositStepper from '@/components/deposit/DepositStepper'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CATEGORIES, type Category } from '@/lib/types'
import RetryCheckoutButton from '@/components/deposit/RetryCheckoutButton'

export const dynamic = 'force-dynamic'

const PRISMA_TO_MOCK_CATEGORY: Record<PrismaCategory, Category> = {
  CESSION_REPRISE:           'cession-reprise',
  ASSOCIES_COFONDATEURS:     'associes-cofondateurs',
  RECRUTEMENT:               'recrutement',
  PARTENARIATS_DISTRIBUTION: 'partenariats-distribution',
  MISSIONS_EXPERTS:          'missions-experts',
  LOCAUX_RESSOURCES:         'locaux-ressources',
  MATERIEL:                  'locaux-ressources',
}

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function DeposeStep4({
  searchParams,
}: { searchParams: { ref?: string; session_id?: string } }) {
  const reference = searchParams.ref
  if (!reference) notFound()

  const session = await getServerSession(authOptions)
  if (!session?.user) notFound()

  const annonce = await prisma.annonce.findUnique({
    where: { reference },
    select: {
      id: true, reference: true, title: true, category: true,
      plan: true, status: true, expiresAt: true, views: true,
      authorId: true,
    },
  })
  if (!annonce) notFound()
  // Only the author lands here.
  if (annonce.authorId !== session.user.id) notFound()

  const lastTx = annonce.plan === AnnoncePlan.PREMIUM
    ? await prisma.transaction.findFirst({
        where: { annonceId: annonce.id },
        orderBy: { createdAt: 'desc' },
        select: { status: true, createdAt: true },
      })
    : null

  const cat = CATEGORIES[PRISMA_TO_MOCK_CATEGORY[annonce.category]]
  const expiresAt = DATE_FMT.format(annonce.expiresAt)
  const isPaymentPending =
    annonce.plan === AnnoncePlan.PREMIUM &&
    annonce.status !== AnnonceStatus.ACTIVE &&
    (!lastTx || lastTx.status === TransactionStatus.PENDING)
  const paymentFailed =
    annonce.plan === AnnoncePlan.PREMIUM &&
    annonce.status !== AnnonceStatus.ACTIVE &&
    lastTx?.status === TransactionStatus.FAILED

  return (
    <>
      {/* While the webhook is racing the user back from Stripe, refresh
          the page silently so the success banner appears without manual reload. */}
      {isPaymentPending && (
        <meta httpEquiv="refresh" content="4" />
      )}

      <DepositStepper currentStep={4} />

      <div className="max-w-[760px] mx-auto px-6 py-12">

        {/* Hero — adapts to status */}
        {isPaymentPending ? (
          <div className="rounded-2xl p-10 text-center text-white mb-7"
               style={{ background: 'linear-gradient(135deg, #D4A843 0%, #B8902F 100%)' }}>
            <span className="text-[64px] block mb-4">⏳</span>
            <h1 className="text-[26px] font-extrabold mb-2">Paiement en cours de validation</h1>
            <p className="text-sm text-white/85 leading-relaxed max-w-md mx-auto">
              Stripe nous confirme votre règlement dans quelques secondes. La page se rafraîchit
              automatiquement — votre annonce passera en ligne dès la confirmation.
            </p>
            <p className="text-xs text-white/50 mt-4">
              Référence : <strong className="text-white font-mono tracking-wider">{annonce.reference}</strong>
            </p>
          </div>
        ) : paymentFailed ? (
          <div className="rounded-2xl p-10 text-center text-white mb-7"
               style={{ background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)' }}>
            <span className="text-[64px] block mb-4">⚠️</span>
            <h1 className="text-[26px] font-extrabold mb-2">Paiement non finalisé</h1>
            <p className="text-sm text-white/85 leading-relaxed max-w-md mx-auto">
              Votre annonce reste en brouillon. Vous pouvez relancer le paiement depuis votre tableau de bord
              ou réessayer maintenant.
            </p>
            <div className="mt-5 flex justify-center">
              <RetryCheckoutButton annonceReference={annonce.reference} />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-10 text-center text-white mb-7"
               style={{ background: 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)' }}>
            <span className="text-[64px] block mb-4 animate-bounce">🎉</span>
            <h1 className="text-[26px] font-extrabold mb-2">Votre annonce est en ligne !</h1>
            <p className="text-sm text-white/85 leading-relaxed max-w-md mx-auto">
              Elle est maintenant visible par les <strong className="text-white">+12 000 entrepreneurs</strong> de l'écosystème Les Pépites Tech.
            </p>
            <p className="text-xs text-white/50 mt-4">
              Référence annonce : <strong className="text-white font-mono tracking-wider">{annonce.reference}</strong>
            </p>
          </div>
        )}

        {/* Action cards */}
        {!isPaymentPending && !paymentFailed && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { emoji: '👁',  title: 'Voir mon annonce',          desc: 'Prévisualisez votre annonce publiée',     href: `/annonce/${annonce.reference}` },
              { emoji: '📬', title: 'Gérer mes messages',         desc: 'Suivez vos demandes de contact',          href: '/messagerie' },
              { emoji: '📊', title: 'Mon tableau de bord',        desc: 'Statistiques et gestion de vos annonces', href: '/compte' },
              { emoji: '➕', title: 'Publier une autre annonce',  desc: 'Créez une nouvelle opportunité',          href: '/deposer' },
            ].map(card => (
              <Link key={card.title} href={card.href}
                className="bg-white rounded-xl border border-border p-6 text-center hover:border-teal hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="text-[32px] mb-2.5">{card.emoji}</div>
                <div className="text-sm font-bold text-navy mb-1">{card.title}</div>
                <div className="text-xs text-muted leading-snug">{card.desc}</div>
              </Link>
            ))}
          </div>
        )}

        {/* Details recap */}
        <div className="card mb-6">
          <p className="section-label">Détails de la publication</p>
          <div className="space-y-0">
            <div className="flex justify-between items-center py-2.5 border-b border-surface">
              <span className="text-xs text-muted font-semibold">Catégorie</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>
                {cat.emoji} {cat.label}
              </span>
            </div>
            <div className="flex justify-between items-start py-2.5 border-b border-surface">
              <span className="text-xs text-muted font-semibold">Annonce</span>
              <span className="text-xs font-bold text-navy text-right max-w-[65%]">{annonce.title}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-surface">
              <span className="text-xs text-muted font-semibold">Plan</span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border
                ${annonce.plan === AnnoncePlan.PREMIUM ? 'bg-gold-light text-gold border-gold/30' : 'bg-teal-light text-teal border-teal/30'}`}>
                {annonce.plan === AnnoncePlan.PREMIUM ? '⭐ Premium' : '📋 Gratuit'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-surface">
              <span className="text-xs text-muted font-semibold">Statut</span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border
                ${annonce.status === AnnonceStatus.ACTIVE
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : paymentFailed
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {annonce.status === AnnonceStatus.ACTIVE
                  ? '🟢 En ligne'
                  : paymentFailed
                    ? '🔴 Paiement échoué'
                    : '🟡 Paiement en attente'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-surface">
              <span className="text-xs text-muted font-semibold">Expire le</span>
              <span className="text-xs font-bold text-navy">{expiresAt}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-xs text-muted font-semibold">Vues</span>
              <span className="text-xs font-bold text-navy">{annonce.views} vue{annonce.views > 1 ? 's' : ''} · mis à jour en temps réel</span>
            </div>
          </div>
        </div>

        {/* Share — only when live */}
        {!isPaymentPending && !paymentFailed && (
          <div className="rounded-xl p-6 bg-hero-gradient text-white text-center">
            <h3 className="text-sm font-bold mb-1">Partagez votre annonce</h3>
            <p className="text-xs text-white/50 mb-5">Plus de partages = plus de contacts potentiels</p>
            <div className="flex gap-2.5 justify-center flex-wrap">
              <button className="bg-[#0077B5] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                LinkedIn
              </button>
              <button className="bg-[#1DA1F2] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                Twitter / X
              </button>
              <button className="bg-white/15 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-white/25 transition-colors">
                🔗 Copier le lien
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
