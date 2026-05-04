import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { AnnonceStatus, TransactionStatus } from '@prisma/client'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stripe webhook receiver. The signature header is mandatory — without it,
 * an attacker could synthesize fake `checkout.session.completed` events and
 * upgrade their own annonces to Premium for free.
 *
 * Stripe → Vercel:
 *   - HTTPS endpoint configured in the Stripe dashboard
 *   - Signing secret in STRIPE_WEBHOOK_SECRET
 *   - Events subscribed: checkout.session.completed,
 *                        checkout.session.expired,
 *                        payment_intent.payment_failed
 */
export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 })
  }
  // Trim to survive copy-paste whitespace from the Vercel dashboard.
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!signingSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET absent' }, { status: 503 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'signature manquante' }, { status: 400 })

  // Stripe signs the raw bytes — we cannot use req.json() before verification.
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, signingSecret)
  } catch (e) {
    console.error('Stripe webhook signature failed:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const sessionData = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(sessionData)
      break
    }
    case 'checkout.session.expired': {
      const sessionData = event.data.object as Stripe.Checkout.Session
      await prisma.transaction.updateMany({
        where: { stripeSessionId: sessionData.id, status: TransactionStatus.PENDING },
        data:  { status: TransactionStatus.FAILED },
      })
      break
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      const annonceId = intent.metadata?.annonceId
      if (annonceId) {
        await prisma.transaction.updateMany({
          where: { annonceId, status: TransactionStatus.PENDING },
          data:  { status: TransactionStatus.FAILED },
        })
      }
      break
    }
    // Other events ignored — easy to add later.
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

async function handleCheckoutCompleted(s: Stripe.Checkout.Session): Promise<void> {
  // Stripe "complete" doesn't always mean "paid" — only after payment_status flips.
  if (s.payment_status !== 'paid') return

  const annonceId = (s.metadata?.annonceId as string | undefined) ?? null
  const userId    = (s.metadata?.userId    as string | undefined) ?? null
  if (!annonceId) {
    console.error('webhook: checkout.session.completed without annonceId metadata', s.id)
    return
  }

  const paymentIntent = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id ?? null

  // Idempotent: if Stripe re-delivers the same event, we won't double-activate.
  await prisma.$transaction([
    prisma.transaction.updateMany({
      where:  { stripeSessionId: s.id },
      data: {
        status:          TransactionStatus.SUCCEEDED,
        stripePaymentId: paymentIntent ?? undefined,
      },
    }),
    prisma.annonce.update({
      where: { id: annonceId },
      data:  { status: AnnonceStatus.ACTIVE },
    }),
  ]).catch((e) => {
    // Don't 500 the webhook — Stripe will retry on a non-2xx, but the data is
    // logged and the dev DB stays in a known state.
    console.error('webhook activation failed', { annonceId, userId, err: e })
  })
}
