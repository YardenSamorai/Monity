export default function manifest() {
  return {
    name: 'Monity',
    short_name: 'Monity',
    description: 'Personal finance management - Track expenses, budgets, and goals',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#2563EB',
    orientation: 'portrait-primary',
    scope: '/',
    id: '/',
    icons: [
      // SVG as primary (works in most modern browsers)
      {
        src: '/MonityLogo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      // PNG fallbacks (generate these for full iOS/Android support)
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Quick Add',
        short_name: 'Add',
        description: 'Quickly add an expense',
        url: '/quick-add',
        icons: [{ src: '/MonityLogo.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      {
        name: 'Transactions',
        short_name: 'Txns',
        url: '/transactions',
        icons: [{ src: '/MonityLogo.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    ],
    categories: ['finance', 'productivity', 'utilities'],
    lang: 'en',
    dir: 'ltr',
    prefer_related_applications: false,
    launch_handler: {
      client_mode: 'navigate-existing',
    },
  }
}
