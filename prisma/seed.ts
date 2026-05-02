/**
 * Seed dev DB with the mock annonces + messages used by the static prototype.
 * Run with:  npx prisma db seed
 */
import { PrismaClient, Category, AnnoncePlan, AnnonceStatus, UserProfile } from '@prisma/client'
import { ANNONCES, MESSAGES } from '../data/mock'
import type { Category as MockCategory } from '../lib/types'

const prisma = new PrismaClient()

const CATEGORY_MAP: Record<MockCategory, Category> = {
  cession:     Category.CESSION,
  recrutement: Category.RECRUTEMENT,
  partenariat: Category.PARTENARIAT,
  freelance:   Category.FREELANCE,
  materiel:    Category.MATERIEL,
  locaux:      Category.LOCAUX,
}

// Best-effort: parse "380 000 €" / "12 000 €" into a number for sort/filter.
// Returns null when the price is purely textual ("Equity", "650 €/j", "2 400 €/mois", null).
function parsePriceAmount(price: string | null): number | null {
  if (!price) return null
  const normalized = price.replace(/\s| /g, '')
  if (/\/(j|jour|mois|an)/i.test(normalized)) return null
  const match = normalized.match(/^(\d+(?:[.,]\d+)?)€?$/)
  if (!match) return null
  return parseFloat(match[1].replace(',', '.'))
}

function refFromId(id: string): string {
  // "lpt-001" → "LPT-2026-04001" (deterministic, year-prefixed for display)
  const num = id.replace(/[^0-9]/g, '').padStart(5, '0')
  return `LPT-2026-${num}`
}

async function main() {
  console.log('🧹 Wiping existing seed data…')
  // Order matters: child rows first.
  await prisma.message.deleteMany()
  await prisma.savedAnnonce.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.annonceKpi.deleteMany()
  await prisma.annonceTag.deleteMany()
  await prisma.annonceMedia.deleteMany()
  await prisma.annonce.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('👤 Creating demo users…')
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@lespepitestech.com',
      name: 'Demo LPT',
      profile: UserProfile.FOUNDER,
      role: 'Compte de démonstration',
      verified: true,
    },
  })

  // Each annonce gets its own author so author cards stay distinct.
  const authorByAnnonceId: Record<string, string> = {}
  for (const a of ANNONCES) {
    const slug = a.author.name.toLowerCase().replace(/[^a-z]/g, '')
    const email = `${slug}.${a.id}@lpt-demo.local`
    const user = await prisma.user.create({
      data: {
        email,
        name: a.author.name,
        role: a.author.role,
        verified: a.author.verified,
      },
    })
    authorByAnnonceId[a.id] = user.id
  }

  console.log(`📋 Inserting ${ANNONCES.length} annonces…`)
  for (const a of ANNONCES) {
    await prisma.annonce.create({
      data: {
        reference:   refFromId(a.id),
        title:       a.title,
        description: a.description,
        category:    CATEGORY_MAP[a.category],
        sector:      a.sector,
        location:    a.location,
        priceAmount: parsePriceAmount(a.price),
        priceLabel:  a.price,
        priceNote:   a.priceNote,
        plan:        a.isPremium ? AnnoncePlan.PREMIUM : AnnoncePlan.FREE,
        status:      AnnonceStatus.ACTIVE,
        views:       a.views,
        createdAt:   new Date(a.createdAt),
        expiresAt:   new Date(a.expiresAt),
        authorId:    authorByAnnonceId[a.id],
        tags: { create: a.tags.map((value) => ({ value })) },
        kpis: a.kpis
          ? { create: a.kpis.map((k, i) => ({ value: k.value, label: k.label, order: i })) }
          : undefined,
      },
    })
  }

  console.log(`✉️  Inserting ${MESSAGES.length} message threads…`)
  // The mock messages are all addressed to the demo user about annonce lpt-001.
  const cessionAnnonce = await prisma.annonce.findFirstOrThrow({ where: { reference: refFromId('lpt-001') } })

  for (const m of MESSAGES) {
    const sender = await prisma.user.create({
      data: {
        email: `${m.id}@lpt-demo.local`,
        name:  m.sender,
        role:  m.senderRole,
      },
    })
    for (const turn of m.thread) {
      await prisma.message.create({
        data: {
          senderId:   turn.from === 'me' ? demoUser.id : sender.id,
          receiverId: turn.from === 'me' ? sender.id   : demoUser.id,
          annonceId:  cessionAnnonce.id,
          body:       turn.body,
          readAt:     m.unread && turn.from === 'them' ? null : new Date(),
        },
      })
    }
  }

  console.log('✅ Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
