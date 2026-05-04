import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma, Category, AnnoncePlan, AnnonceStatus } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_CATEGORIES: Record<string, Category> = {
  'cession-reprise':           Category.CESSION_REPRISE,
  'associes-cofondateurs':     Category.ASSOCIES_COFONDATEURS,
  'recrutement':               Category.RECRUTEMENT,
  'partenariats-distribution': Category.PARTENARIATS_DISTRIBUTION,
  'missions-experts':          Category.MISSIONS_EXPERTS,
  'locaux-ressources':         Category.LOCAUX_RESSOURCES,
}

const TITLE_MAX = 100
const DESC_MAX  = 2000

interface CreatePayload {
  category?: unknown
  title?:    unknown
  description?: unknown
  sector?:   unknown
  location?: unknown
  price?:    unknown
  tags?:     unknown
  plan?:     unknown
}

function parsePriceAmount(price: string): number | null {
  const normalized = price.replace(/\s| /g, '')
  if (/\/(j|jour|mois|an)/i.test(normalized)) return null
  const match = normalized.match(/^(\d+(?:[.,]\d+)?)€?$/)
  if (!match) return null
  return parseFloat(match[1].replace(',', '.'))
}

async function nextReference(): Promise<string> {
  // Count-based reference is fine while volumes are low; tighter uniqueness
  // (sequence / per-year counter) can come once volume warrants it.
  const count = await prisma.annonce.count()
  const year = new Date().getFullYear()
  return `LPT-${year}-${String(count + 1).padStart(5, '0')}`
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  let body: CreatePayload
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Payload invalide' }, { status: 400 }) }

  const categoryRaw = typeof body.category === 'string' ? body.category : ''
  const category = VALID_CATEGORIES[categoryRaw]
  if (!category) return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 })

  const title       = (typeof body.title       === 'string' ? body.title       : '').trim()
  const description = (typeof body.description === 'string' ? body.description : '').trim()
  const sector      = (typeof body.sector      === 'string' ? body.sector      : '').trim()
  const location    = (typeof body.location    === 'string' ? body.location    : '').trim()
  const priceLabel  = (typeof body.price       === 'string' ? body.price       : '').trim()
  const tagsRaw     = (typeof body.tags        === 'string' ? body.tags        : '').trim()

  if (!title)       return NextResponse.json({ error: 'Titre obligatoire' },       { status: 400 })
  if (!description) return NextResponse.json({ error: 'Description obligatoire' }, { status: 400 })
  if (!sector)      return NextResponse.json({ error: 'Secteur obligatoire' },     { status: 400 })
  if (!location)    return NextResponse.json({ error: 'Localisation obligatoire' }, { status: 400 })
  if (title.length > TITLE_MAX)        return NextResponse.json({ error: `Titre : ${TITLE_MAX} caractères max` },    { status: 400 })
  if (description.length > DESC_MAX)   return NextResponse.json({ error: `Description : ${DESC_MAX} caractères max` }, { status: 400 })

  const plan: AnnoncePlan = body.plan === 'PREMIUM' ? AnnoncePlan.PREMIUM : AnnoncePlan.FREE
  // Free = J+30, Premium = J+90 (only counts once payment lands).
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (plan === AnnoncePlan.PREMIUM ? 90 : 30))

  // Premium annonces are kept in DRAFT until the Stripe checkout webhook
  // marks the transaction as SUCCEEDED. Free annonces go ACTIVE immediately.
  const status: AnnonceStatus = plan === AnnoncePlan.PREMIUM
    ? AnnonceStatus.DRAFT
    : AnnonceStatus.ACTIVE

  // De-dup tags (case-insensitive) and clip overly long values.
  const tags = Array.from(new Set(
    tagsRaw.split(',').map((t) => t.trim()).filter((t) => t.length > 0 && t.length <= 40)
      .map((t) => t.replace(/\s+/g, ' '))
  )).slice(0, 20)

  // Best-effort retry if reference collides (very unlikely but possible under burst).
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = await nextReference()
    try {
      const annonce = await prisma.annonce.create({
        data: {
          reference, title, description, category,
          sector, location,
          priceLabel: priceLabel || null,
          priceAmount: priceLabel ? parsePriceAmount(priceLabel) : null,
          plan,
          status,
          expiresAt,
          authorId: session.user.id,
          tags: tags.length > 0 ? { create: tags.map((value) => ({ value })) } : undefined,
        },
        select: { id: true, reference: true, status: true, plan: true },
      })
      return NextResponse.json({ annonce }, { status: 201 })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && attempt < 2) continue
      console.error('annonce.create error', e)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Création échouée — réessaie' }, { status: 500 })
}
