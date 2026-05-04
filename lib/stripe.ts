import Stripe from 'stripe'
import { AnnoncePlan } from '@prisma/client'

const secretKey = process.env.STRIPE_SECRET_KEY?.trim()

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: '2026-04-22.dahlia' })
  : null

export function stripeAvailable(): boolean {
  return stripe !== null
}

/**
 * Resolves the Stripe price id for a (pack, durationDays) pair.
 *
 * Each paid pack (Boost / Pro / Ultra) has 2 prices in Stripe (1 month / 4
 * months). The price ids are kept as env vars so they can be rotated or
 * swapped between test/live without code changes.
 */
export function resolveStripePriceId(plan: AnnoncePlan, durationDays: number): string | null {
  const isFourMonths = durationDays >= 90 // 120 in our config; 90 covers legacy Premium too
  const key = (() => {
    switch (plan) {
      case AnnoncePlan.BOOST: return isFourMonths ? 'STRIPE_PRICE_BOOST_4M' : 'STRIPE_PRICE_BOOST_1M'
      case AnnoncePlan.PRO:   return isFourMonths ? 'STRIPE_PRICE_PRO_4M'   : 'STRIPE_PRICE_PRO_1M'
      case AnnoncePlan.ULTRA: return isFourMonths ? 'STRIPE_PRICE_ULTRA_4M' : 'STRIPE_PRICE_ULTRA_1M'
      // Legacy single-price flow — falls back to the original 49€ price.
      case AnnoncePlan.PREMIUM: return 'STRIPE_PRICE_ID'
      default: return null
    }
  })()
  if (!key) return null
  const value = process.env[key]?.trim()
  return value && value.length > 0 ? value : null
}
