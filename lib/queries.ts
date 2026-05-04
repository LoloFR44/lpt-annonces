import { prisma } from './prisma'
import type { Annonce, Category, Pack } from './types'
import { Category as PrismaCategory, AnnonceStatus, AnnoncePlan } from '@prisma/client'

/**
 * Glue between the database (Prisma rows + uppercase enums) and the
 * `Annonce` shape consumed by the pages — the latter still mirrors the
 * static prototype so we don't need to touch every component yet.
 */

const PRISMA_TO_MOCK_CATEGORY: Record<PrismaCategory, Category> = {
  CESSION_REPRISE:           'cession-reprise',
  ASSOCIES_COFONDATEURS:     'associes-cofondateurs',
  RECRUTEMENT:               'recrutement',
  PARTENARIATS_DISTRIBUTION: 'partenariats-distribution',
  MISSIONS_EXPERTS:          'missions-experts',
  LOCAUX_RESSOURCES:         'locaux-ressources',
  // Legacy: rows seeded as MATERIEL display under Locaux & ressources.
  MATERIEL:                  'locaux-ressources',
}

const MOCK_TO_PRISMA_CATEGORY: Record<Category, PrismaCategory> = {
  'cession-reprise':           PrismaCategory.CESSION_REPRISE,
  'associes-cofondateurs':     PrismaCategory.ASSOCIES_COFONDATEURS,
  'recrutement':               PrismaCategory.RECRUTEMENT,
  'partenariats-distribution': PrismaCategory.PARTENARIATS_DISTRIBUTION,
  'missions-experts':          PrismaCategory.MISSIONS_EXPERTS,
  'locaux-ressources':         PrismaCategory.LOCAUX_RESSOURCES,
}

const annonceInclude = {
  tags: true,
  kpis: { orderBy: { order: 'asc' } },
  author: { select: { id: true, name: true, role: true, verified: true } },
} as const

type AnnonceRow = Awaited<ReturnType<typeof prisma.annonce.findFirstOrThrow<{ include: typeof annonceInclude }>>>

const PRISMA_TO_PACK: Record<AnnoncePlan, Pack> = {
  FREE:    'free',
  BOOST:   'boost',
  PRO:     'pro',
  ULTRA:   'ultra',
  // Legacy 49€ Premium → display as Pro tier (closest paid equivalent).
  PREMIUM: 'pro',
}

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
    pack:        PRISMA_TO_PACK[row.plan],
    durationDays: row.durationDays,
    isPaid:      row.plan !== AnnoncePlan.FREE,
    externalSource: row.externalSource,
    externalId:     row.externalId,
    views:       row.views,
    createdAt:   row.createdAt.toISOString(),
    expiresAt:   row.expiresAt.toISOString(),
    tags:        row.tags.map((t) => t.value),
    kpis:        row.kpis.length > 0 ? row.kpis.map((k) => ({ value: k.value, label: k.label })) : undefined,
    author: {
      id:       row.author.id,
      name:     row.author.name ?? 'Anonyme',
      role:     row.author.role ?? '',
      initials: initialsOf(row.author.name),
      verified: row.author.verified,
    },
  }
}

// ─── Public queries ──────────────────────────────────────────────────

export type ListSort = 'recent' | 'views' | 'price-asc' | 'price-desc'

export interface ListAnnoncesOptions {
  category?: Category
  sort?:     ListSort
  take?:     number
  skip?:     number
}

// Premium first as the marketing default, then sort within tiers.
function orderByForSort(sort: ListSort | undefined) {
  switch (sort) {
    case 'views':
      return [{ plan: 'desc' as const }, { views: 'desc' as const }, { createdAt: 'desc' as const }]
    case 'price-asc':
      // NULLS LAST so untyped prices stay at the bottom.
      return [{ plan: 'desc' as const }, { priceAmount: { sort: 'asc' as const, nulls: 'last' as const } }, { createdAt: 'desc' as const }]
    case 'price-desc':
      return [{ plan: 'desc' as const }, { priceAmount: { sort: 'desc' as const, nulls: 'last' as const } }, { createdAt: 'desc' as const }]
    case 'recent':
    default:
      return [{ plan: 'desc' as const }, { createdAt: 'desc' as const }]
  }
}

// "locaux-ressources" inherits the legacy MATERIEL rows seeded before the
// merge so existing matériel annonces still surface under the new label.
function categoryToPrismaFilter(category: Category): PrismaCategory[] {
  if (category === 'locaux-ressources') {
    return [PrismaCategory.LOCAUX_RESSOURCES, PrismaCategory.MATERIEL]
  }
  return [MOCK_TO_PRISMA_CATEGORY[category]]
}

export async function listAnnonces(opts: ListAnnoncesOptions = {}): Promise<Annonce[]> {
  const rows = await prisma.annonce.findMany({
    where: {
      status: AnnonceStatus.ACTIVE,
      ...(opts.category && { category: { in: categoryToPrismaFilter(opts.category) } }),
    },
    orderBy: orderByForSort(opts.sort),
    include: annonceInclude,
    take: opts.take,
    skip: opts.skip,
  })
  return rows.map(toAnnonce)
}

export async function countActiveAnnonces(category?: Category): Promise<number> {
  return prisma.annonce.count({
    where: {
      status: AnnonceStatus.ACTIVE,
      ...(category && { category: { in: categoryToPrismaFilter(category) } }),
    },
  })
}

export async function countByCategory(): Promise<Record<Category, number>> {
  const grouped = await prisma.annonce.groupBy({
    by: ['category'],
    where: { status: AnnonceStatus.ACTIVE },
    _count: { _all: true },
  })
  const out: Record<Category, number> = {
    'cession-reprise':           0,
    'associes-cofondateurs':     0,
    'recrutement':               0,
    'partenariats-distribution': 0,
    'missions-experts':          0,
    'locaux-ressources':         0,
  }
  for (const g of grouped) out[PRISMA_TO_MOCK_CATEGORY[g.category]] += g._count._all
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
      category: { in: categoryToPrismaFilter(category) },
      NOT: { reference },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: annonceInclude,
  })
  return rows.map(toAnnonce)
}
