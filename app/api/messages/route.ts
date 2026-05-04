import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const BODY_MAX = 4000

interface SendPayload {
  annonceReference?: unknown
  recipientId?:      unknown
  body?:             unknown
}

/**
 * Send a message in a (annonce, recipient) thread.
 * - Sender is always the authenticated user.
 * - Recipient must be either the annonce author OR an existing prospect
 *   (someone who already messaged the author about that annonce).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })

  let body: SendPayload
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Payload invalide' }, { status: 400 }) }

  const reference   = typeof body.annonceReference === 'string' ? body.annonceReference.trim() : ''
  const recipientId = typeof body.recipientId      === 'string' ? body.recipientId.trim()      : ''
  const text        = typeof body.body             === 'string' ? body.body.trim()             : ''

  if (!reference)            return NextResponse.json({ error: 'Annonce manquante' }, { status: 400 })
  if (!recipientId)          return NextResponse.json({ error: 'Destinataire manquant' }, { status: 400 })
  if (!text)                 return NextResponse.json({ error: 'Message vide' }, { status: 400 })
  if (text.length > BODY_MAX) return NextResponse.json({ error: `Message : ${BODY_MAX} caractères max` }, { status: 400 })
  if (recipientId === session.user.id) return NextResponse.json({ error: "Vous ne pouvez pas vous envoyer un message" }, { status: 400 })

  const annonce = await prisma.annonce.findUnique({
    where: { reference },
    select: { id: true, authorId: true, status: true },
  })
  if (!annonce) return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })

  // Authorization: the recipient must be a legitimate counterpart for this annonce.
  // Either the recipient is the annonce author, or there's already a thread between
  // sender and recipient (the author replying to a prospect, or vice-versa).
  const recipientIsAuthor = annonce.authorId === recipientId
  if (!recipientIsAuthor) {
    const senderIsAuthor = annonce.authorId === session.user.id
    if (!senderIsAuthor) {
      return NextResponse.json({ error: 'Destinataire non autorisé pour cette annonce' }, { status: 403 })
    }
    // Sender is the author — verify a thread already exists with this prospect.
    const exists = await prisma.message.findFirst({
      where: {
        annonceId: annonce.id,
        OR: [
          { senderId: recipientId,      receiverId: session.user.id },
          { senderId: session.user.id,  receiverId: recipientId     },
        ],
      },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ error: 'Aucune conversation existante avec ce destinataire' }, { status: 403 })
    }
  }

  const message = await prisma.message.create({
    data: {
      annonceId:  annonce.id,
      senderId:   session.user.id,
      receiverId: recipientId,
      body:       text,
    },
    select: { id: true, createdAt: true },
  })

  return NextResponse.json({ message }, { status: 201 })
}
