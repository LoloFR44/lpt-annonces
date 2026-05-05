import { prisma } from './prisma'
import { Category as PrismaCategory } from '@prisma/client'
import type { Category } from './types'

const PRISMA_TO_MOCK_CATEGORY: Record<PrismaCategory, Category> = {
  CESSION_REPRISE:           'cession-reprise',
  ASSOCIES_COFONDATEURS:     'associes-cofondateurs',
  RECRUTEMENT:               'recrutement',
  PARTENARIATS_DISTRIBUTION: 'partenariats-distribution',
  MISSIONS_EXPERTS:          'missions-experts',
  LOCAUX_RESSOURCES:         'locaux-ressources',
  MATERIEL:                  'locaux-ressources',
}

export interface ThreadSummary {
  annonceId:        string
  annonceReference: string
  annonceTitle:     string
  annonceCategory:  Category
  otherUserId:      string
  otherUserName:    string
  otherUserRole:    string
  otherUserInitial: string
  lastMessage:      string
  lastMessageAt:    string // ISO
  lastSenderIsMe:   boolean
  unreadCount:      number
}

export interface ThreadMessage {
  id:        string
  body:      string
  createdAt: string // ISO
  fromMe:    boolean
  readAt:    string | null
}

/**
 * Returns the initials of every alphabetic word in a name (max 3 letters).
 * "Thomas M." → "TM"
 * "Marie Curie" → "MC"
 * "Analyste Cession & reprise" → "ACR"
 * Falls back to the first character of the email when the name is empty.
 */
function initialsOf(name: string | null | undefined, fallback: string): string {
  const source = (name?.trim() || fallback).normalize('NFKD').replace(/[^a-zA-Z\s]/g, '')
  const ini = source.split(/\s+/).filter(Boolean).slice(0, 3).map((w) => w[0].toUpperCase()).join('')
  return ini || '?'
}

/**
 * Group every message touching `userId` into one thread per (annonce, otherUser),
 * with the latest message as the preview and an unread counter.
 */
export async function listThreadsForUser(userId: string): Promise<ThreadSummary[]> {
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender:   { select: { id: true, name: true, email: true, role: true } },
      receiver: { select: { id: true, name: true, email: true, role: true } },
      annonce:  { select: { id: true, reference: true, title: true, category: true } },
    },
  })

  const threads = new Map<string, ThreadSummary>()
  for (const m of messages) {
    const otherUser = m.senderId === userId ? m.receiver : m.sender
    const key = `${m.annonceId}:${otherUser.id}`
    const fromMe = m.senderId === userId

    if (!threads.has(key)) {
      threads.set(key, {
        annonceId:        m.annonce.id,
        annonceReference: m.annonce.reference,
        annonceTitle:     m.annonce.title,
        annonceCategory:  PRISMA_TO_MOCK_CATEGORY[m.annonce.category],
        otherUserId:      otherUser.id,
        otherUserName:    otherUser.name ?? otherUser.email,
        otherUserRole:    otherUser.role ?? '',
        otherUserInitial: initialsOf(otherUser.name, otherUser.email),
        lastMessage:      m.body,
        lastMessageAt:    m.createdAt.toISOString(),
        lastSenderIsMe:   fromMe,
        unreadCount:      0,
      })
    }

    const t = threads.get(key)!
    if (!fromMe && m.readAt === null) t.unreadCount += 1
  }

  return Array.from(threads.values())
}

/**
 * Full message list for a (annonceId, otherUserId) thread visible to `userId`.
 * Returns null if the user is not a participant.
 */
export async function getThreadMessages(
  userId: string,
  annonceId: string,
  otherUserId: string,
): Promise<ThreadMessage[] | null> {
  // Ensure the user is one side of the conversation.
  if (userId === otherUserId) return null

  const messages = await prisma.message.findMany({
    where: {
      annonceId,
      OR: [
        { senderId: userId,      receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, body: true, createdAt: true, senderId: true, readAt: true },
  })

  return messages.map((m) => ({
    id:        m.id,
    body:      m.body,
    createdAt: m.createdAt.toISOString(),
    fromMe:    m.senderId === userId,
    readAt:    m.readAt ? m.readAt.toISOString() : null,
  }))
}

/** Mark every "to me" message in this thread as read. */
export async function markThreadAsRead(
  userId: string,
  annonceId: string,
  otherUserId: string,
): Promise<number> {
  const res = await prisma.message.updateMany({
    where: {
      annonceId,
      receiverId: userId,
      senderId:   otherUserId,
      readAt:     null,
    },
    data: { readAt: new Date() },
  })
  return res.count
}

export async function countUnreadForUser(userId: string): Promise<number> {
  return prisma.message.count({ where: { receiverId: userId, readAt: null } })
}
