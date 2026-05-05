import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma, Category, AnnoncePlan, AnnonceStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Polls Linkera's public annonces API and mirrors every cession into LPT.
 *
 * Idempotent: each row carries (externalSource='linkera', externalId=<linkeraId>)
 * with a unique constraint, so re-running on the same data is a no-op.
 *
 * Wired to Vercel Cron (see vercel.json) — Vercel sends
 * `Authorization: Bearer <CRON_SECRET>` with each invocation.
 */

const SOURCE = 'linkera'
// Author of every imported annonce. The team behind this account reads the
// messagerie threads — clicking "Contacter l'annonceur" routes here.
const SYSTEM_USER_EMAIL    = 'analyste@linkera.com'
const SYSTEM_USER_NAME     = 'Analyste Linkera'
// Default password used when creating the system user. Override via env in
// production. The user can rotate it via the normal login flow once set.
const SYSTEM_USER_DEFAULT_PASSWORD = process.env.LINKERA_ANALYST_PASSWORD ?? 'linkera-analyste-2026'

interface LinkeraListItem {
  id:       string
  title:    string
  location: string
  price:    string  // "250 000" — no currency, French formatting
  image?:   string
}
interface LinkeraDetail extends LinkeraListItem {
  description: string | null
  type:        string
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null
  const normalized = priceStr.replace(/\s| /g, '').replace(',', '.')
  const n = parseFloat(normalized)
  return Number.isFinite(n) ? n : null
}

function buildDescription(item: LinkeraDetail): string {
  // If Linkera's API ever returns a real description, use it as-is.
  if (item.description && item.description.trim().length > 0) return item.description
  // Otherwise compose the richest possible recap from the public fields.
  const parts: string[] = []
  parts.push(item.title)
  parts.push('')
  parts.push('**À propos de cette opportunité**')
  parts.push(`📍 Localisation : ${item.location}`)
  if (item.price) parts.push(`💰 Prix de cession : ${item.price} €`)
  parts.push('🏷️ Type : Cession & reprise')
  parts.push('')
  parts.push('Le dossier détaillé (chiffres clés, raison de la cession, conditions, contact direct du cédant) est disponible sur Linkera, partenaire des opérations de cession et reprise d\'entreprise.')
  parts.push('')
  parts.push(`👉 Consulter le dossier complet : https://www.linkera.com/annonces/${item.id}`)
  parts.push('')
  parts.push('💬 Vous pouvez aussi contacter directement notre analyste via le bouton « Contacter l\'annonceur » — nous répondons sous 24h ouvrées et pouvons vous orienter vers le bon interlocuteur côté Linkera.')
  return parts.join('\n')
}

async function nextReference(): Promise<string> {
  const count = await prisma.annonce.count()
  const year = new Date().getFullYear()
  return `LPT-${year}-${String(count + 1).padStart(5, '0')}`
}

async function getOrCreateSystemUser(): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email: SYSTEM_USER_EMAIL },
    select: { id: true, passwordHash: true },
  })
  if (existing) {
    // Make sure a password is set so the team can log into LPT messagerie.
    if (!existing.passwordHash) {
      const hash = await bcrypt.hash(SYSTEM_USER_DEFAULT_PASSWORD, 10)
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash: hash } })
    }
    return existing.id
  }
  const hash = await bcrypt.hash(SYSTEM_USER_DEFAULT_PASSWORD, 10)
  const created = await prisma.user.create({
    data: {
      email:        SYSTEM_USER_EMAIL,
      name:         SYSTEM_USER_NAME,
      role:         'Analyste cessions & reprises — Linkera',
      verified:     true,
      passwordHash: hash,
    },
  })
  return created.id
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET?.trim()
  if (expected) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const start = new Date()
  const stats = { fetched: 0, imported: 0, skipped: 0, errors: 0, errorIds: [] as string[] }

  let listing: { data: LinkeraListItem[] }
  try {
    const r = await fetch('https://www.linkera.com/api/annonces?limit=100', {
      headers: { Accept: 'application/json' },
    })
    if (!r.ok) throw new Error(`upstream HTTP ${r.status}`)
    listing = await r.json()
  } catch (e) {
    console.error('[cron/import-linkera] listing failed', e)
    return NextResponse.json({ error: 'Listing fetch failed', details: String(e) }, { status: 502 })
  }

  stats.fetched = listing.data.length
  const systemUserId = await getOrCreateSystemUser()

  for (const item of listing.data) {
    try {
      const existing = await prisma.annonce.findFirst({
        where: { externalSource: SOURCE, externalId: item.id },
        select: { id: true },
      })
      if (existing) { stats.skipped++; continue }

      // Hit detail endpoint to get type + (potentially) description.
      const detRes = await fetch(`https://www.linkera.com/api/annonces/${item.id}`, {
        headers: { Accept: 'application/json' },
      })
      if (!detRes.ok) { stats.errors++; stats.errorIds.push(item.id); continue }
      const detail = await detRes.json() as LinkeraDetail
      if (detail.type !== 'cession') { stats.skipped++; continue }

      const priceAmount = parsePrice(detail.price)
      const reference   = await nextReference()
      // Free pack visibility (30 days) — imports stay non-paying by default.
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await prisma.annonce.create({
        data: {
          reference,
          title:        detail.title,
          description:  buildDescription(detail),
          category:     Category.CESSION_REPRISE,
          sector:       'Cession & reprise',
          location:     detail.location,
          priceLabel:   priceAmount !== null ? `${detail.price} €` : detail.price,
          priceAmount,
          plan:         AnnoncePlan.FREE,
          durationDays: 30,
          status:       AnnonceStatus.ACTIVE,
          expiresAt,
          authorId:     systemUserId,
          externalSource: SOURCE,
          externalId:     item.id,
          tags: { create: [{ value: 'Linkera' }, { value: 'Cession' }] },
        },
      })
      stats.imported++
    } catch (e) {
      // Race-condition safety: if two cron runs overlap and try to create the
      // same row, the unique index returns P2002 — treat as a skip.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        stats.skipped++
      } else {
        console.error('[cron/import-linkera] item failed', item.id, e)
        stats.errors++; stats.errorIds.push(item.id)
      }
    }
  }

  return NextResponse.json({
    ranAt:     start.toISOString(),
    durationMs: Date.now() - start.getTime(),
    ...stats,
  })
}
