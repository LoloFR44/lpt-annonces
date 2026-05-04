'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { value: 'recent',     label: 'Les plus récentes' },
  { value: 'views',      label: 'Les plus vues' },
  { value: 'price-asc',  label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
] as const

export default function SortSelect({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString())
    if (e.target.value === 'recent') next.delete('sort')
    else next.set('sort', e.target.value)
    next.delete('page') // a new sort resets pagination
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <select
      value={current}
      onChange={onChange}
      className="ml-auto text-xs font-semibold text-navy/70 border-[1.5px] border-border rounded-full px-3.5 py-1.5"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
