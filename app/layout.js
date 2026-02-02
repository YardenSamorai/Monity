import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme-context'
import { ToastProvider } from '@/lib/toast-context'
import { LoadingProvider } from '@/lib/loading-context'
import { I18nProvider } from '@/lib/i18n-context'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Monity - Personal Finance Management',
  description: 'Premium personal finance tracking with Apple-inspired design',
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Monity',
  },
  icons: {
    icon: [
      { url: '/MonityLogo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/MonityLogo.svg',
    apple: [
      { url: '/MonityLogo.svg', type: 'image/svg+xml' },
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  // Theme
                  const theme = localStorage.getItem('theme') || 'system';
                  if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    document.documentElement.classList.add(systemTheme);
                  } else {
                    document.documentElement.classList.add(theme);
                  }
                  
                  // Locale & RTL
                  const locale = localStorage.getItem('locale') || 'en';
                  const direction = locale === 'he' ? 'rtl' : 'ltr';
                  document.documentElement.lang = locale;
                  document.documentElement.dir = direction;
                  if (direction === 'rtl') {
                    document.body.classList.add('rtl');
                  }
                } catch (e) {}
              `,
            }}
          />
        </head>
        <body className="font-sans antialiased">
          <ThemeProvider>
            <I18nProvider>
              <LoadingProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </LoadingProvider>
            </I18nProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

