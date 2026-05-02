#!/bin/bash
cd "$(dirname "$0")"
echo "📦 Installation des dépendances..."
npm install
echo ""
echo "🚀 Démarrage du serveur de développement..."
echo "👉 Ouvrez http://localhost:3000 dans votre navigateur"
echo ""
npm run dev
