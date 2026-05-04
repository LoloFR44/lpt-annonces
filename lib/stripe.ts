import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY

// We instantiate even in test/dev when the key is present. Code paths that
// need Stripe should bail early via stripeAvailable() if the key is unset.
export const stripe = secretKey
  ? new Stripe(secretKey, {
      // Pin the API version we tested against so future Stripe rollouts don't
      // change shape under us. Bump deliberately.
      apiVersion: '2026-04-22.dahlia',
    })
  : null

export function stripeAvailable(): boolean {
  return stripe !== null
}

export const STRIPE_PRICE_PREMIUM_ID = process.env.STRIPE_PRICE_ID ?? ''
