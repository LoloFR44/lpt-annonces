import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

  return NextResponse.json({ env, prisma: prismaCheck }, { status: 200 })
}
