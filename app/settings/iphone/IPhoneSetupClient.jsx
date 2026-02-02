'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Smartphone, 
  Share, 
  Plus, 
  Check, 
  ExternalLink,
  ChevronRight,
  Zap,
  WifiOff,
  Bell,
  Copy,
  CheckCheck,
  ArrowLeft,
  Settings,
  Link as LinkIcon
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { cn } from '@/lib/utils'
import { isStandalonePWA, isIOS, isIOSSafari } from '@/lib/pwa'

export default function IPhoneSetupClient() {
  const { t, isRTL } = useI18n()
  const { toast } = useToast()
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [copied, setCopied] = useState(false)
  const [quickAddUrl, setQuickAddUrl] = useState('')

  useEffect(() => {
    setIsStandalone(isStandalonePWA())
    setIsIOSDevice(isIOS())
    setQuickAddUrl(`${window.location.origin}/quick-add`)
  }, [])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(quickAddUrl)
      setCopied(true)
      toast.success(t('common.copiedSuccess'))
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy URL')
    }
  }

  const pwaSteps = [
    {
      number: 1,
      icon: Share,
      title: t('iphoneSetup.pwa.step1Title'),
      description: t('iphoneSetup.pwa.step1Desc'),
    },
    {
      number: 2,
      icon: Plus,
      title: t('iphoneSetup.pwa.step2Title'),
      description: t('iphoneSetup.pwa.step2Desc'),
    },
    {
      number: 3,
      icon: Check,
      title: t('iphoneSetup.pwa.step3Title'),
      description: t('iphoneSetup.pwa.step3Desc'),
    },
  ]

  const shortcutSteps = [
    {
      number: 1,
      icon: Settings,
      title: t('iphoneSetup.shortcut.step1Title'),
      description: t('iphoneSetup.shortcut.step1Desc'),
    },
    {
      number: 2,
      icon: Plus,
      title: t('iphoneSetup.shortcut.step2Title'),
      description: t('iphoneSetup.shortcut.step2Desc'),
    },
    {
      number: 3,
      icon: LinkIcon,
      title: t('iphoneSetup.shortcut.step3Title'),
      description: t('iphoneSetup.shortcut.step3Desc'),
    },
    {
      number: 4,
      icon: Smartphone,
      title: t('iphoneSetup.shortcut.step4Title'),
      description: t('iphoneSetup.shortcut.step4Desc'),
    },
  ]

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      {/* Page Content */}
      <div className="p-4 lg:p-6 pb-24 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-[rgb(var(--accent))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                {t('iphoneSetup.title')}
              </h1>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                {t('iphoneSetup.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* PWA Status Card */}
        <div className={cn(
          "p-4 rounded-xl mb-6 flex items-center gap-3 border",
          isStandalone 
            ? "bg-[rgb(var(--positive))]/5 border-[rgb(var(--positive))]/20"
            : "bg-[rgb(var(--warning))]/5 border-[rgb(var(--warning))]/20"
        )}>
          {isStandalone ? (
            <>
              <div className="w-10 h-10 rounded-full bg-[rgb(var(--positive))]/10 flex items-center justify-center">
                <CheckCheck className="w-5 h-5 text-[rgb(var(--positive))]" />
              </div>
              <div>
                <p className="font-medium text-[rgb(var(--text-primary))]">
                  {t('iphoneSetup.pwaInstalled')}
                </p>
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  Monity is running as an app
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[rgb(var(--warning))]/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-[rgb(var(--warning))]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[rgb(var(--text-primary))]">
                  {t('iphoneSetup.pwaNotInstalled')}
                </p>
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  Install for the best experience
                </p>
              </div>
              <Link
                href="/install"
                className="px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium"
              >
                Install
              </Link>
            </>
          )}
        </div>

        {/* Section 1: Install PWA (if not installed) */}
        {!isStandalone && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-[rgb(var(--accent))] text-white text-sm font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                {t('iphoneSetup.installPwa')}
              </h2>
            </div>

            <div className="space-y-3">
              {pwaSteps.map((step) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.number}
                    className="flex items-start gap-4 p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--bg-tertiary))] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[rgb(var(--text-primary))] mb-0.5">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[rgb(var(--text-secondary))]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Section 2: iOS Shortcut */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 rounded-full bg-[rgb(var(--accent))] text-white text-sm font-bold flex items-center justify-center">
              {isStandalone ? '1' : '2'}
            </span>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('iphoneSetup.createShortcut')}
            </h2>
          </div>

          <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
            {t('iphoneSetup.shortcutDesc')}
          </p>

          {/* Quick Add URL Copy Box */}
          <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] mb-4">
            <label className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wide mb-2 block">
              {t('iphoneSetup.quickAddUrl')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={quickAddUrl}
                readOnly
                className="flex-1 px-3 py-2.5 rounded-lg bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] text-sm font-mono border border-[rgb(var(--border-secondary))]"
                dir="ltr"
              />
              <button
                onClick={handleCopyUrl}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors min-w-[100px] justify-center",
                  copied 
                    ? "bg-[rgb(var(--positive))]" 
                    : "bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/90"
                )}
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    {t('common.copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('common.copy')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Shortcut Steps */}
          <div className="space-y-3">
            {shortcutSteps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.number}
                  className="flex items-start gap-4 p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[rgb(var(--accent))]">
                      {step.number}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[rgb(var(--text-primary))] mb-0.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 3: Pro Tips */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">
            {t('iphoneSetup.tips')}
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--warning))]/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[rgb(var(--warning))]" />
                </div>
                <h3 className="font-medium text-[rgb(var(--text-primary))]">
                  {t('iphoneSetup.tip1Title')}
                </h3>
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))] ps-11">
                {t('iphoneSetup.tip1Desc')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--info))]/10 flex items-center justify-center">
                  <WifiOff className="w-4 h-4 text-[rgb(var(--info))]" />
                </div>
                <h3 className="font-medium text-[rgb(var(--text-primary))]">
                  {t('iphoneSetup.tip2Title')}
                </h3>
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))] ps-11">
                {t('iphoneSetup.tip2Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* Try Quick Add CTA */}
        <Link
          href="/quick-add"
          className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--accent))] text-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">{t('iphoneSetup.tryQuickAdd')}</div>
              <div className="text-sm opacity-80">{t('iphoneSetup.tryQuickAddDesc')}</div>
            </div>
          </div>
          <ChevronRight className={cn("w-5 h-5", isRTL && "rtl-flip")} />
        </Link>
      </div>
    </div>
  )
}
