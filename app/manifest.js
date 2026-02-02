export default function manifest() {
  return {
    name: 'Monity - Personal Finance Management',
    short_name: 'Monity',
    description: 'Premium personal finance tracking with Apple-inspired design',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3B82F6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/MonityLogo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/MonityLogo.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
      {
        src: '/MonityLogo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
    categories: ['finance', 'productivity', 'utilities'],
    lang: 'en',
    dir: 'ltr',
  }
}

