import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Diagnostic endpoint — checks env vars + Prisma connectivity.
 * Returns metadata only, never the secret values themselves.
 * Safe to remove once the deploy is confirmed healthy.
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL ?? ''
  const directUrl = process.env.DIRECT_URL ?? ''

  const env = {
    NODE_ENV:               process.env.NODE_ENV ?? null,
    VERCEL_ENV:             process.env.VERCEL_ENV ?? null,
    DATABASE_URL_set:       dbUrl.length > 0,
    DATABASE_URL_length:    dbUrl.length,
    DATABASE_URL_protocol:  dbUrl.split('://')[0] || null,
    DATABASE_URL_host:      (() => {
      try { return new URL(dbUrl).host } catch { return null }
    })(),
    DIRECT_URL_set:         directUrl.length > 0,
    DIRECT_URL_length:      directUrl.length,
    NEXTAUTH_SECRET_set:    Boolean(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL:           process.env.NEXTAUTH_URL ?? null,
  }

  let prismaCheck: { ok: boolean; error?: string; annonceCount?: number } = { ok: false }
  try {
    const count = await prisma.annonce.count()
    prismaCheck = { ok: true, annonceCount: count }
  } catch (e) {
    prismaCheck = { ok: false, error: e instanceof Error ? e.message : String(e) }
  }

  const stripeEnv = {
    STRIPE_SECRET_KEY_set:        Boolean(process.env.STRIPE_SECRET_KEY),
    STRIPE_SECRET_KEY_prefix:     (process.env.STRIPE_SECRET_KEY ?? '').slice(0, 7),
    STRIPE_PRICE_ID_set:          Boolean(process.env.STRIPE_PRICE_ID),
    STRIPE_PRICE_ID_prefix:       (process.env.STRIPE_PRICE_ID ?? '').slice(0, 6),
    STRIPE_WEBHOOK_SECRET_set:    Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    STRIPE_WEBHOOK_SECRET_length: (process.env.STRIPE_WEBHOOK_SECRET ?? '').length,
    STRIPE_WEBHOOK_SECRET_prefix: (process.env.STRIPE_WEBHOOK_SECRET ?? '').slice(0, 11),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_set: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    NEXT_PUBLIC_SITE_URL:         process.env.NEXT_PUBLIC_SITE_URL ?? null,
  }

  let stripeCheck: { ok: boolean; error?: string; priceLive?: { id: string; amount: number | null; currency: string } } = { ok: false }
  if (stripe && process.env.STRIPE_PRICE_ID) {
    try {
      const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID)
      stripeCheck = {
        ok: true,
        priceLive: { id: price.id, amount: price.unit_amount, currency: price.currency },
      }
    } catch (e) {
      stripeCheck = { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  return NextResponse.json({ env, prisma: prismaCheck, stripe: { env: stripeEnv, check: stripeCheck } }, { status: 200 })
}
