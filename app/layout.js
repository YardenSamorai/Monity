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
  title: 'Monity',
  description: 'Personal finance management - Track expenses, budgets, and goals',
  applicationName: 'Monity',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Monity',
  },
  icons: {
    icon: [
      { url: '/MonityLogo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/MonityLogo.svg',
    apple: '/MonityLogo.svg',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <head>
          {/* iOS PWA Meta Tags */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Monity" />
          <meta name="mobile-web-app-capable" content="yes" />
          
          {/* Apple Touch Icons - Use SVG with PNG fallbacks */}
          <link rel="apple-touch-icon" href="/MonityLogo.svg" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
          <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167.png" />
          
          {/* iOS Splash Screens */}
          <link 
            rel="apple-touch-startup-image" 
            href="/icons/apple-splash-2048-2732.png"
            media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
          />
          <link 
            rel="apple-touch-startup-image" 
            href="/icons/apple-splash-1170-2532.png"
            media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
          />
          <link 
            rel="apple-touch-startup-image" 
            href="/icons/apple-splash-1284-2778.png"
            media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
          />
          
          {/* Preconnect for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Initialization Script - Theme, Locale, PWA Detection */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    // Theme initialization
                    var theme = localStorage.getItem('theme') || 'system';
                    var resolvedTheme = theme;
                    if (theme === 'system') {
                      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    document.documentElement.classList.add(resolvedTheme);
                    
                    // Locale & RTL initialization
                    var locale = localStorage.getItem('locale') || 'en';
                    var direction = locale === 'he' ? 'rtl' : 'ltr';
                    document.documentElement.lang = locale;
                    document.documentElement.dir = direction;
                    if (direction === 'rtl') {
                      document.documentElement.classList.add('rtl');
                    }
                    
                    // PWA Standalone mode detection
                    var isStandalone = window.navigator.standalone === true || 
                      window.matchMedia('(display-mode: standalone)').matches;
                    if (isStandalone) {
                      document.documentElement.classList.add('standalone');
                    }
                    
                    // iOS detection
                    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    if (isIOS) {
                      document.documentElement.classList.add('ios');
                    }
                    
                    // Set safe area CSS variables
                    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
                    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');
                    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
                    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
                  } catch (e) {
                    console.error('Init error:', e);
                  }
                })();
              `,
            }}
          />
          
          {/* Service Worker Registration */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' })
                      .then(function(reg) {
                        console.log('SW registered:', reg.scope);
                        // Check for updates periodically
                        setInterval(function() { reg.update(); }, 60 * 60 * 1000);
                      })
                      .catch(function(err) {
                        console.log('SW error:', err);
                      });
                  });
                }
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
