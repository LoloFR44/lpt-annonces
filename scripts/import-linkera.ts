import * as fs from 'node:fs'
import * as path from 'node:path'

interface ListItem {
  id: string
  title: string
  location: string
  price: string
  image: string
}
interface DetailItem extends ListItem {
  description: string | null
  type: string
}

async function main() {
  console.log('Fetching listing…')
  const listRes = await fetch('https://www.linkera.com/api/annonces?limit=100', {
    headers: { 'Accept': 'application/json' },
  })
  if (!listRes.ok) throw new Error(`Listing failed: HTTP ${listRes.status}`)
  const list = await listRes.json() as { data: ListItem[]; total: number }
  console.log(`  → ${list.data.length} annonces (total: ${list.total})`)

  console.log('Fetching details…')
  const details: DetailItem[] = []
  for (const item of list.data) {
    const detRes = await fetch(`https://www.linkera.com/api/annonces/${item.id}`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!detRes.ok) {
      console.warn(`  ⚠ ${item.id} → HTTP ${detRes.status}`)
      continue
    }
    const det = await detRes.json() as DetailItem
    details.push(det)
    process.stdout.write('.')
  }
  console.log(`\n  → ${details.length} details fetched`)

  const cessions = details.filter((d) => d.type === 'cession')
  console.log(`Cession-typed: ${cessions.length}`)

  const out = {
    source:        'https://www.linkera.com/api/annonces',
    importedAt:    new Date().toISOString(),
    totalReturned: list.data.length,
    cessions,
  }

  const outDir  = path.join(__dirname, '..', 'data', 'import')
  fs.mkdirSync(outDir, { recursive: true })
  const stamp   = new Date().toISOString().slice(0, 10)
  const outPath = path.join(outDir, `linkera-cessions-${stamp}.json`)
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log(`Saved → ${outPath}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
