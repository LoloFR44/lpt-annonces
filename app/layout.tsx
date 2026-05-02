import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import FeedbackOverlay from '@/components/feedback/FeedbackOverlay'

export const metadata: Metadata = {
  title: { default: 'Annonces | Les Pépites Tech', template: '%s | Les Pépites Tech' },
  description: 'Marketplace de petites annonces pour entrepreneurs tech — cessions, recrutements, partenariats, missions freelance.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-surface">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FeedbackOverlay />
      </body>
    </html>
  )
}
