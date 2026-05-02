import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        // LPT Design System
        teal: {
          DEFAULT: '#2BBFBF',
          dark: '#1A8F8F',
          light: '#F0FAFA',
        },
        navy: {
          DEFAULT: '#1A2533',
          medium: '#2D3F55',
        },
        gold: {
          DEFAULT: '#D4A843',
          light: '#FFFDF0',
        },
        bordeaux: {
          DEFAULT: '#8B1A3C',
          light: '#F5E8EE',
        },
        // Category colors
        cat: {
          cession:    '#E67E22',
          recrutement:'#27AE60',
          partenariat:'#8B1A3C',
          freelance:  '#2980B9',
          materiel:   '#8E44AD',
          locaux:     '#16A085',
        },
        // UI
        surface: '#F7F8FA',
        border:  '#E8ECF0',
        muted:   '#8090A0',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1A2533 0%, #2D3F55 100%)',
        'teal-gradient':  'linear-gradient(135deg, #2BBFBF 0%, #1A8F8F 100%)',
        'gold-gradient':  'linear-gradient(135deg, #D4A843 0%, #B8892E 100%)',
      },
    },
  },
  plugins: [],
}

export default config
