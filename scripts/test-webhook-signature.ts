import * as fs from 'node:fs'
import Stripe from 'stripe'

// Tiny inline .env loader (dotenv isn't installed).
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
}

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
  const secret = process.env.STRIPE_WEBHOOK_SECRET!
  console.log('Using local secret prefix:', secret.slice(0, 10) + '... len:', secret.length)

  const payload = JSON.stringify({
    id: 'evt_local_test',
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_a1lcjiXSgsoUq8N2CwW5FmJYIvHZ2p9T3X5ylOnR3isxUpRIArGq12iOC5',
        object: 'checkout.session',
        payment_status: 'paid',
        payment_intent: 'pi_3TTMzwKxYXCaJYdG0TeAuTRC',
        metadata: {
          annonceId: 'cmor9j2vm0001nq3e4v17m3ip',
          annonceReference: 'LPT-2026-00016',
          userId: 'cmoq58p0e0000121wu6zngy6t',
        },
      },
    },
  })

  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret })

  const res = await fetch('https://lpt-annonces.vercel.app/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
    body: payload,
  })
  console.log('HTTP', res.status, await res.text())
}

main()
