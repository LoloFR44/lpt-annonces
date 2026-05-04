import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AnnonceStatus } from '@prisma/client'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'

/**
 * Sweeps ACTIVE annonces whose `expiresAt` is in the past and flips
 * them to EXPIRED. Wired to Vercel Cron (see vercel.json) — Vercel
 * sends `Authorization: Bearer <CRON_SECRET>` with each invocation.
 *
 * Manual trigger from a browser is rejected; in dev (no CRON_SECRET
 * set), the route works without auth so it can be exercised locally.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET
  if (expected) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const before = new Date()
  const result = await prisma.annonce.updateMany({
    where: {
      status:   AnnonceStatus.ACTIVE,
      expiresAt: { lt: before },
    },
    data: { status: AnnonceStatus.EXPIRED },
  })

  return NextResponse.json({
    ranAt:    before.toISOString(),
    expired:  result.count,
  })
}
