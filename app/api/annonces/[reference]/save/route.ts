import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Ctx { params: { reference: string } }

/**
 * Toggle the "saved" state for the authenticated user on the given annonce.
 * Body is optional — call without one to flip the bookmark, or pass
 * { saved: true | false } to set it explicitly.
 */
export async function POST(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })

  const annonce = await prisma.annonce.findUnique({
    where: { reference: params.reference },
    select: { id: true, authorId: true },
  })
  if (!annonce) return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  if (annonce.authorId === session.user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas sauvegarder votre propre annonce' }, { status: 400 })
  }

  let target: boolean | undefined
  try {
    const body = await req.json()
    if (typeof body?.saved === 'boolean') target = body.saved
  } catch { /* no body = toggle */ }

  const existing = await prisma.savedAnnonce.findUnique({
    where: { userId_annonceId: { userId: session.user.id, annonceId: annonce.id } },
  })
  const desired = target ?? existing === null

  if (desired && !existing) {
    await prisma.savedAnnonce.create({
      data: { userId: session.user.id, annonceId: annonce.id },
    })
    return NextResponse.json({ saved: true }, { status: 201 })
  }
  if (!desired && existing) {
    await prisma.savedAnnonce.delete({ where: { id: existing.id } })
    return NextResponse.json({ saved: false }, { status: 200 })
  }
  return NextResponse.json({ saved: desired }, { status: 200 })
}
