import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { AnnoncePlan, AnnonceStatus, TransactionStatus } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, resolveStripePriceId } from '@/lib/stripe'

export const runtime = 'nodejs'

/**
 * Creates a Stripe Checkout session for a DRAFT paid annonce.
 * The session metadata carries the annonceId so the webhook knows
 * which row to flip to ACTIVE on success.
 *
 * Body: { annonceReference: string }
 * Returns: { url: string } (Stripe-hosted checkout)
 */
export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  let body: { annonceReference?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Payload invalide' }, { status: 400 }) }
  const reference = typeof body.annonceReference === 'string' ? body.annonceReference.trim() : ''
  if (!reference) return NextResponse.json({ error: 'Annonce manquante' }, { status: 400 })

  const annonce = await prisma.annonce.findUnique({
    where: { reference },
    select: { id: true, reference: true, title: true, plan: true, status: true, durationDays: true, authorId: true },
  })
  if (!annonce)                             return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  if (annonce.authorId !== session.user.id) return NextResponse.json({ error: 'Annonce non possédée' }, { status: 403 })
  if (annonce.plan === AnnoncePlan.FREE)    return NextResponse.json({ error: 'Pack gratuit — pas de paiement' }, { status: 400 })
  if (annonce.status === AnnonceStatus.ACTIVE) {
    return NextResponse.json({ error: 'Annonce déjà active' }, { status: 409 })
  }

  const stripePriceId = resolveStripePriceId(annonce.plan, annonce.durationDays)
  if (!stripePriceId) {
    return NextResponse.json(
      { error: `Aucun prix Stripe configuré pour ${annonce.plan} ${annonce.durationDays}j` },
      { status: 503 },
    )
  }

  // Trim aggressively — env vars copy-pasted from dashboards often carry an
  // invisible trailing tab/space that breaks Stripe URL validation.
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin).trim().replace(/\/+$/, '')

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    locale: 'fr',
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/deposer/confirmation?ref=${encodeURIComponent(annonce.reference)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${baseUrl}/compte?cancelled_ref=${encodeURIComponent(annonce.reference)}`,
    customer_email: session.user.email ?? undefined,
    metadata: {
      annonceId:        annonce.id,
      annonceReference: annonce.reference,
      userId:           session.user.id,
      pack:             annonce.plan,
      durationDays:     String(annonce.durationDays),
    },
    payment_intent_data: {
      metadata: {
        annonceId:        annonce.id,
        annonceReference: annonce.reference,
        userId:           session.user.id,
      },
    },
  })

  await prisma.transaction.create({
    data: {
      userId:          session.user.id,
      annonceId:       annonce.id,
      // amount stays in EUR HT for our records; Stripe handles VAT on its side.
      amount:          0,
      currency:        'EUR',
      stripeSessionId: checkoutSession.id,
      status:          TransactionStatus.PENDING,
    },
  })

  if (!checkoutSession.url) {
    return NextResponse.json({ error: 'URL de paiement indisponible' }, { status: 500 })
  }
  return NextResponse.json({ url: checkoutSession.url }, { status: 200 })
}
