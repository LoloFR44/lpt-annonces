import { prisma } from './prisma'
import type { Annonce, Category } from './types'
import { Category as PrismaCategory, AnnonceStatus, AnnoncePlan } from '@prisma/client'

/**
 * Glue between the database (Prisma rows + uppercase enums) and the
 * `Annonce` shape consumed by the pages — the latter still mirrors the
 * static prototype so we don't need to touch every component yet.
 */

const PRISMA_TO_MOCK_CATEGORY: Record<PrismaCategory, Category> = {
  CESSION:     'cession',
  RECRUTEMENT: 'recrutement',
  PARTENARIAT: 'partenariat',
  FREELANCE:   'freelance',
  MATERIEL:    'materiel',
  LOCAUX:      'locaux',
}

const MOCK_TO_PRISMA_CATEGORY: Record<Category, PrismaCategory> = {
  cession:     PrismaCategory.CESSION,
  recrutement: PrismaCategory.RECRUTEMENT,
  partenariat: PrismaCategory.PARTENARIAT,
  freelance:   PrismaCategory.FREELANCE,
  materiel:    PrismaCategory.MATERIEL,
  locaux:      PrismaCategory.LOCAUX,
}

const annonceInclude = {
  tags: true,
  kpis: { orderBy: { order: 'asc' } },
  author: { select: { name: true, role: true, verified: true } },
} as const

type AnnonceRow = Awaited<ReturnType<typeof prisma.annonce.findFirstOrThrow<{ include: typeof annonceInclude }>>>

function initialsOf(name: string | null | undefined): string {
  if (!name) return '?'
  return name.trim().charAt(0).toUpperCase() || '?'
}

function toAnnonce(row: AnnonceRow): Annonce {
  return {
    // The reference (LPT-2026-04001) is what the URLs and pages reference now.
    id:          row.reference,
    title:       row.title,
    description: row.description,
    category:    PRISMA_TO_MOCK_CATEGORY[row.category],
    sector:      row.sector ?? '',
    location:    row.location ?? '',
    price:       row.priceLabel ?? null,
    priceNote:   row.priceNote ?? undefined,
    isPremium:   row.plan === AnnoncePlan.PREMIUM,
    views:       row.views,
    createdAt:   row.createdAt.toISOString(),
    expiresAt:   row.expiresAt.toISOString(),
    tags:        row.tags.map((t) => t.value),
    kpis:        row.kpis.length > 0 ? row.kpis.map((k) => ({ value: k.value, label: k.label })) : undefined,
    author: {
      name:     row.author.name ?? 'Anonyme',
      role:     row.author.role ?? '',
      initials: initialsOf(row.author.name),
      verified: row.author.verified,
    },
  }
}

// ─── Public queries ──────────────────────────────────────────────────

export interface ListAnnoncesOptions {
  category?: Category
  take?: number
  skip?: number
}

export async function listAnnonces(opts: ListAnnoncesOptions = {}): Promise<Annonce[]> {
  const rows = await prisma.annonce.findMany({
    where: {
      status: AnnonceStatus.ACTIVE,
      ...(opts.category && { category: MOCK_TO_PRISMA_CATEGORY[opts.category] }),
    },
    orderBy: [
      // Premium d'abord, puis date desc — reproduit l'effet "mise en avant".
      { plan: 'desc' },
      { createdAt: 'desc' },
    ],
    include: annonceInclude,
    take: opts.take,
    skip: opts.skip,
  })
  return rows.map(toAnnonce)
}

export async function countActiveAnnonces(): Promise<number> {
  return prisma.annonce.count({ where: { status: AnnonceStatus.ACTIVE } })
}

export async function countByCategory(): Promise<Record<Category, number>> {
  const grouped = await prisma.annonce.groupBy({
    by: ['category'],
    where: { status: AnnonceStatus.ACTIVE },
    _count: { _all: true },
  })
  const out: Record<Category, number> = { cession: 0, recrutement: 0, partenariat: 0, freelance: 0, materiel: 0, locaux: 0 }
  for (const g of grouped) out[PRISMA_TO_MOCK_CATEGORY[g.category]] = g._count._all
  return out
}

export async function getAnnonceByReference(reference: string): Promise<Annonce | null> {
  const row = await prisma.annonce.findUnique({
    where: { reference },
    include: annonceInclude,
  })
  return row ? toAnnonce(row) : null
}

export async function getSimilarAnnonces(reference: string, category: Category, limit = 3): Promise<Annonce[]> {
  const rows = await prisma.annonce.findMany({
    where: {
      status: AnnonceStatus.ACTIVE,
      category: MOCK_TO_PRISMA_CATEGORY[category],
      NOT: { reference },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: annonceInclude,
  })
  return rows.map(toAnnonce)
}
