/**
 * One-off migration:
 *   - Rename the system user that owns Linkera-imported annonces from
 *     `linkera-sync@lpt-system.local` (Linkera Sync) to
 *     `analyste@linkera.com` (Analyste Linkera) so "Contacter l'annonceur"
 *     reaches a real Linkera mailbox and the team can read messagerie threads.
 *   - Set a known password (LINKERA_ANALYST_PASSWORD env or fallback) so the
 *     account can log in.
 *   - Rewrite the description of every Linkera-imported annonce using the
 *     richer template defined in app/api/cron/import-linkera/route.ts.
 *
 * Idempotent: safe to re-run.
 */
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

const OLD_EMAIL = 'linkera-sync@lpt-system.local'
const NEW_EMAIL = 'analyste@linkera.com'
// Public display name + role must stay neutral so the Linkera origin
// is not leaked before the prospect initiates contact.
const NEW_NAME  = 'Analyste Cession & reprise'
const NEW_ROLE  = 'Pôle Cessions — Les Pépites Tech'
const PASSWORD  = process.env.LINKERA_ANALYST_PASSWORD ?? 'linkera-analyste-2026'

function buildDescription(item: { id: string; title: string; location: string | null; price: string | null }): string {
  const parts: string[] = [item.title, '', '**À propos de cette opportunité**']
  if (item.location) parts.push(`📍 Localisation : ${item.location}`)
  if (item.price)    parts.push(`💰 Prix de cession : ${item.price}`)
  parts.push('🏷️ Type : Cession & reprise')
  return parts.join('\n')
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  console.log('1) Resolving target system user…')
  const oldUser = await prisma.user.findUnique({ where: { email: OLD_EMAIL }, select: { id: true } })
  let targetUser = await prisma.user.findUnique({ where: { email: NEW_EMAIL }, select: { id: true } })

  if (oldUser && !targetUser) {
    console.log('   migrating linkera-sync → analyste@linkera.com')
    targetUser = await prisma.user.update({
      where: { id: oldUser.id },
      data: {
        email: NEW_EMAIL,
        name: NEW_NAME,
        role: NEW_ROLE,
        verified: true,
        passwordHash,
      },
      select: { id: true },
    })
  } else if (oldUser && targetUser) {
    console.log('   both users exist — re-pointing imports to analyste@linkera.com and removing old')
    await prisma.annonce.updateMany({
      where: { externalSource: 'linkera', authorId: oldUser.id },
      data:  { authorId: targetUser.id },
    })
    await prisma.user.delete({ where: { id: oldUser.id } })
  } else if (!oldUser && targetUser) {
    console.log('   only target exists — making sure password is set')
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        name: NEW_NAME,
        role: NEW_ROLE,
        verified: true,
        passwordHash,
      },
    })
  } else {
    console.log('   neither exists — creating analyste@linkera.com')
    targetUser = await prisma.user.create({
      data: {
        email: NEW_EMAIL,
        name: NEW_NAME,
        role: NEW_ROLE,
        verified: true,
        passwordHash,
      },
      select: { id: true },
    })
  }

  console.log(`   targetUser.id = ${targetUser.id}`)

  console.log('2) Rewriting descriptions on all Linkera-imported annonces…')
  const rows = await prisma.annonce.findMany({
    where: { externalSource: 'linkera' },
    select: { id: true, externalId: true, title: true, location: true, priceLabel: true },
  })
  console.log(`   ${rows.length} rows`)

  let updated = 0
  for (const r of rows) {
    if (!r.externalId) continue
    const newDesc = buildDescription({
      id:       r.externalId,
      title:    r.title,
      location: r.location,
      price:    r.priceLabel,
    })
    await prisma.annonce.update({
      where: { id: r.id },
      data:  { description: newDesc, authorId: targetUser.id },
    })
    updated++
  }
  console.log(`   ${updated} descriptions rewritten`)

  console.log('3) Removing any "Linkera" tag from imported annonces…')
  const removed = await prisma.annonceTag.deleteMany({
    where: {
      value: 'Linkera',
      annonce: { externalSource: 'linkera' },
    },
  })
  console.log(`   ${removed.count} tags dropped`)

  console.log('Done.')
  console.log('')
  console.log(`   Login: ${NEW_EMAIL}`)
  console.log(`   Password: ${PASSWORD}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
