'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: 'https://lespepitestech.com/startups', label: 'Startups', external: true },
  { href: 'https://lespepitestech.com/ecosystemes', label: 'Écosystèmes', external: true },
  { href: 'https://lespepitestech.com/evenements', label: 'Événements', external: true },
  { href: 'https://lespepitestech.com/actualite', label: 'Actualité', external: true },
  { href: '/', label: 'Annonces', external: false },
  { href: 'https://lespepitestech.com/nos-offres', label: 'Nos offres', external: true },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-border h-[60px] flex items-center px-8 justify-between sticky top-0 z-40">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
        <div className="flex gap-[3px] items-center">
          <div className="w-3 h-3 rotate-45 bg-gold" />
          <div className="w-3 h-3 rotate-45 bg-bordeaux" />
          <div className="w-3 h-3 rotate-45 bg-teal" />
        </div>
        <span className="text-[15px] font-extrabold text-navy tracking-tight">
          Les <span className="text-teal">Pépites</span> Tech
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label, external }) => {
          const isActive = !external && (pathname === href || (href !== '/' && pathname.startsWith(href)))
          const base = 'text-xs font-semibold uppercase tracking-wider px-3 py-1.5 transition-colors'
          const active = 'text-teal border-b-2 border-teal pb-[5px]'
          const inactive = 'text-navy/70 hover:text-teal'

          if (external) {
            return (
              <a key={href} href={href} className={`${base} ${inactive}`} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            )
          }
          return (
            <Link key={href} href={href} className={`${base} ${isActive ? active : inactive}`}>
              {label}
            </Link>
          )
        })}

        <Link
          href="/deposer"
          className="ml-2 text-xs font-bold text-white bg-teal rounded-full px-4 py-1.5 hover:bg-teal-dark transition-colors"
        >
          + Ajouter
        </Link>
      </nav>

      {/* Auth */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href="/connexion" className="text-xs font-semibold text-navy/70 px-3.5 py-1.5 border border-border rounded-full hover:border-teal hover:text-teal transition-colors">
          Se connecter
        </Link>
        <Link href="/connexion?tab=register" className="text-xs font-bold text-white bg-teal px-3.5 py-1.5 rounded-full hover:bg-teal-dark transition-colors">
          S'inscrire
        </Link>
      </div>
    </header>
  )
}
