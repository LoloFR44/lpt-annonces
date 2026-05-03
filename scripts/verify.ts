import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const [users, annonces, msgs, tags, kpis] = await Promise.all([
    p.user.count(), p.annonce.count(), p.message.count(),
    p.annonceTag.count(), p.annonceKpi.count(),
  ])
  console.log({ users, annonces, msgs, tags, kpis })
  const sample = await p.annonce.findFirst({
    where: { plan: 'PREMIUM' },
    include: { tags: true, kpis: true, author: { select: { name: true, role: true, verified: true } } },
  })
  console.log('\nPremium sample:', JSON.stringify(sample, null, 2))
}
main().finally(() => p.$disconnect())
