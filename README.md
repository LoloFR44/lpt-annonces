# annonces.lespepitestech.com — Dev

Marketplace de petites annonces pour l'écosystème startup français. Projet Next.js 14 + Tailwind CSS.

## Lancer le projet

```bash
cd /Users/loicfleury/Documents/Claude/Projects/LPT/lpt-annonces
npm install
npm run dev
```

Ouvrez ensuite **http://localhost:3000** dans votre navigateur.

> Si Node.js n'est pas installé : https://nodejs.org/fr (version LTS recommandée)

## Pages disponibles

| URL | Page |
|-----|------|
| `/` | Listing des annonces |
| `/annonce/lpt-001` | Détail d'une annonce (fiche) |
| `/deposer` | Étape 1 — Choix de catégorie |
| `/deposer/details` | Étape 2 — Informations de l'annonce |
| `/deposer/visibilite` | Étape 3 — Choix du plan |
| `/deposer/confirmation` | Étape 4 — Confirmation de publication |
| `/connexion` | Connexion / Inscription |
| `/compte` | Tableau de bord utilisateur |
| `/messagerie` | Messagerie (split-view) |

## Overlay de feedback

Chaque page affiche un bouton **💬 Feedback** en bas à droite. Cliquez dessus pour :
1. Décrire l'élément à modifier
2. Écrire votre commentaire
3. Copier le rapport formaté
4. Coller directement dans le chat Claude pour itérer

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS 3.3** (tokens LPT personnalisés)
- **Montserrat** (Google Fonts)
- Données mockées — aucun backend requis

## Structure du projet

```
lpt-annonces/
├── app/                    # Pages (App Router)
│   ├── page.tsx            # Listing
│   ├── annonce/[id]/       # Détail
│   ├── deposer/            # Tunnel dépôt (4 étapes)
│   ├── connexion/          # Auth
│   ├── compte/             # Dashboard
│   └── messagerie/         # Chat
├── components/
│   ├── layout/             # Header, Footer
│   ├── deposit/            # DepositStepper
│   └── feedback/           # FeedbackOverlay
├── data/mock.ts            # Données de démo
└── lib/types.ts            # Types TypeScript
```
