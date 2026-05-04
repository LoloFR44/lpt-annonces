export type Category =
  | 'cession-reprise'
  | 'associes-cofondateurs'
  | 'recrutement'
  | 'partenariats-distribution'
  | 'missions-experts'
  | 'locaux-ressources'

// Order here drives every UI surface (filter pills, /deposer cards, sidebar).
// shortDescription is used on the deposer step 1 cards.
export const CATEGORIES: Record<Category, {
  label: string
  emoji: string
  color: string
  bg: string
  shortDescription: string
}> = {
  'cession-reprise': {
    label:    'Cession & reprise',
    emoji:    '🔄',
    color:    '#E67E22',
    bg:       '#FDF0E8',
    shortDescription: 'Vente de startup, SaaS, PME, actifs digitaux, recherche repreneur ou adossement.',
  },
  'associes-cofondateurs': {
    label:    'Associés & cofondateurs',
    emoji:    '🤝',
    color:    '#8B1A3C',
    bg:       '#F5E8EE',
    shortDescription: 'Recherche de CTO, associé business, cofondateur, advisor ou profil opérationnel au capital.',
  },
  'recrutement': {
    label:    'Recrutement',
    emoji:    '👥',
    color:    '#27AE60',
    bg:       '#E8F8ED',
    shortDescription: 'CDI, alternance, stage, C-level ou profils tech, sales, produit et growth pour startups ou PME.',
  },
  'partenariats-distribution': {
    label:    'Partenariats & distribution',
    emoji:    '🔗',
    color:    '#2980B9',
    bg:       '#E8F2FB',
    shortDescription: 'Distribution, intégration, accord commercial, marque blanche, co-marketing ou alliance stratégique.',
  },
  'missions-experts': {
    label:    'Missions & experts',
    emoji:    '💼',
    color:    '#8E44AD',
    bg:       '#F3E8F8',
    shortDescription: 'CFO part-time, CTO part-time, DAF externalisé, expert growth, produit, tech, IA ou finance.',
  },
  'locaux-ressources': {
    label:    'Locaux & ressources',
    emoji:    '🏢',
    color:    '#16A085',
    bg:       '#E8F6F4',
    shortDescription: 'Bureaux, coworking, sous-location, matériel, licences, outils et équipements pour entreprises.',
  },
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
