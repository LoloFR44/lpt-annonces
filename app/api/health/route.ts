import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Minimal liveness/readiness probe for monitoring/uptime checks.
 * Confirms the app boots, the DB is reachable and counts annonces.
 * Safe to expose publicly — leaks no env metadata.
 */
export async function GET() {
  try {
    const annonceCount = await prisma.annonce.count()
    return NextResponse.json({ ok: true, annonceCount }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
