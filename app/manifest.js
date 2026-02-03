export default function manifest() {
  return {
    name: 'Monity',
    short_name: 'Monity',
    description: 'Personal finance management - Track expenses, budgets, and goals',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#6366F1',
    orientation: 'portrait-primary',
    scope: '/',
    id: '/',
    icons: [
      {
        src: '/MonityLogo.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/MonityLogo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Quick Add',
        short_name: 'Add',
        description: 'Quickly add an expense',
        url: '/quick-add',
        icons: [{ src: '/MonityLogo.svg', sizes: '96x96', type: 'image/svg+xml' }],
      },
      {
        name: 'Transactions',
        short_name: 'Txns',
        url: '/transactions',
        icons: [{ src: '/MonityLogo.svg', sizes: '96x96', type: 'image/svg+xml' }],
      },
    ],
    categories: ['finance', 'productivity', 'utilities'],
    lang: 'en',
    dir: 'ltr',
    prefer_related_applications: false,
  }
}
