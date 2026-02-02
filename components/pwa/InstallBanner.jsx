'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Download } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

/**
 * PWA Install Banner
 * Shows a non-intrusive banner on iOS Safari suggesting to install the app.
 * - Only shows on iOS Safari (not in standalone mode)
 * - Dismissible with "Don't show again" option
 * - Uses localStorage to remember dismissed state
 */
export default function InstallBanner() {
  const { t, isRTL } = useI18n()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if we should show the banner
    const shouldShow = () => {
      // Don't show if already dismissed
      if (localStorage.getItem('pwa-banner-dismissed') === 'true') {
        return false
      }

      // Don't show in standalone mode (already installed)
      if (window.navigator.standalone || 
          window.matchMedia('(display-mode: standalone)').matches) {
        return false
      }

      // Only show on iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      
      return isIOS && isSafari
    }

    // Delay showing to not interrupt initial experience
    const timer = setTimeout(() => {
      if (shouldShow()) {
        setShow(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-[rgb(var(--accent))]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[rgb(var(--text-primary))] mb-0.5">
              {t('installBanner.title')}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              {t('installBanner.description')}
            </p>
            <Link
              href="/install"
              className="inline-block mt-2 text-sm font-medium text-[rgb(var(--accent))]"
            >
              {t('installBanner.cta')}
            </Link>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgb(var(--bg-tertiary))] transition-colors flex-shrink-0"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          </button>
        </div>
      </div>
    </div>
  )
}
