import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-navy text-muted text-center py-6 text-xs mt-12">
      <p>
        © 2026 Les Pépites Tech ·{' '}
        <Link href="/faq" className="text-teal hover:underline mx-2">FAQ</Link>
        <Link href="/cgu" className="text-teal hover:underline mx-2">CGU</Link>
        <Link href="/contact" className="text-teal hover:underline mx-2">Contact</Link>
        <Link href="/mentions-legales" className="text-teal hover:underline mx-2">Mentions légales</Link>
      </p>
    </footer>
  )
}
