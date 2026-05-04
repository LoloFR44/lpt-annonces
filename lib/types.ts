export type Category =
  | 'cession'
  | 'recrutement'
  | 'partenariat'
  | 'freelance'
  | 'materiel'
  | 'locaux'

export const CATEGORIES: Record<Category, { label: string; emoji: string; color: string; bg: string }> = {
  cession:     { label: 'Cession',       emoji: '🔄', color: '#E67E22', bg: '#FDF0E8' },
  recrutement: { label: 'Recrutement',   emoji: '👥', color: '#27AE60', bg: '#E8F8ED' },
  partenariat: { label: 'Partenariat',   emoji: '🤝', color: '#8B1A3C', bg: '#F5E8EE' },
  freelance:   { label: 'Freelance',     emoji: '💻', color: '#2980B9', bg: '#E8F2FB' },
  materiel:    { label: 'Matériel',      emoji: '📦', color: '#8E44AD', bg: '#F3E8F8' },
  locaux:      { label: 'Locaux',        emoji: '🏢', color: '#16A085', bg: '#E8F6F4' },
}

export interface Annonce {
  id: string
  title: string
  description: string
  category: Category
  sector: string
  location: string
  price: string | null
  priceNote?: string
  isPremium: boolean
  views: number
  createdAt: string
  expiresAt: string
  tags: string[]
  kpis?: { value: string; label: string }[]
  author: {
    id: string
    name: string
    role: string
    initials: string
    verified: boolean
  }
}

export interface Message {
  id: string
  sender: string
  senderRole: string
  senderInitials: string
  avatarColor: string
  annonceTitle: string
  annonceCategory: Category
  preview: string
  time: string
  unread: boolean
  thread: { from: 'me' | 'them'; body: string; time: string }[]
}
