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
  CheckCheck,
  Download,
  Settings,
  Hand,
  Lightbulb,
  Play
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { cn } from '@/lib/utils'
import { isStandalonePWA, isIOS } from '@/lib/pwa'

const SHORTCUT_ICLOUD_URL = 'https://www.icloud.com/shortcuts/fe5918a67bab4914b386197c1aeebc67'

export default function IPhoneSetupClient() {
  const { t, isRTL } = useI18n()
  const { toast } = useToast()
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)

  useEffect(() => {
    setIsStandalone(isStandalonePWA())
    setIsIOSDevice(isIOS())
  }, [])

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

  const installShortcutSteps = [
    t('iphoneSetup.installSection.step1'),
    t('iphoneSetup.installSection.step2'),
    t('iphoneSetup.installSection.step3'),
    t('iphoneSetup.installSection.step4'),
  ]

  const backTapSteps = [
    t('iphoneSetup.backTapSection.step1'),
    t('iphoneSetup.backTapSection.step2'),
    t('iphoneSetup.backTapSection.step3'),
    t('iphoneSetup.backTapSection.step4'),
    t('iphoneSetup.backTapSection.step5'),
    t('iphoneSetup.backTapSection.step6'),
  ]

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
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

        {/* Section 2: Quick Add Shortcut - NEW DESIGN */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 rounded-full bg-[rgb(var(--accent))] text-white text-sm font-bold flex items-center justify-center">
              {isStandalone ? '1' : '2'}
            </span>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('iphoneSetup.createShortcut')}
            </h2>
          </div>

          <p className="text-[rgb(var(--text-secondary))] mb-6">
            {t('iphoneSetup.shortcutDesc')}
          </p>

          {/* Install Shortcut Card */}
          <div className="rounded-2xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] overflow-hidden mb-6">
            {/* Card Header */}
            <div className="p-4 border-b border-[rgb(var(--border-primary))]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgb(var(--accent))]/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-[rgb(var(--accent))]" />
                </div>
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                  {t('iphoneSetup.installSection.title')}
                </h3>
              </div>
            </div>

            {/* Install Steps */}
            <div className="p-4 space-y-3">
              {installShortcutSteps.map((step, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3"
                >
                  <span className="w-7 h-7 rounded-full bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))] text-sm font-medium flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-[rgb(var(--text-primary))]">
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* Install Button */}
            <div className="p-4 pt-2">
              <a
                href={SHORTCUT_ICLOUD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[rgb(var(--accent))] text-white font-semibold text-base touch-target active:scale-[0.98] transition-transform"
              >
                <Download className="w-5 h-5" />
                {t('iphoneSetup.installShortcut')}
              </a>
            </div>
          </div>

          {/* Back Tap Card */}
          <div className="rounded-2xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] overflow-hidden mb-6">
            {/* Card Header */}
            <div className="p-4 border-b border-[rgb(var(--border-primary))]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-[rgb(var(--info))]/10 flex items-center justify-center">
                  <Hand className="w-5 h-5 text-[rgb(var(--info))]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                    {t('iphoneSetup.backTapSection.title')}
                  </h3>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    {t('iphoneSetup.backTapSection.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Back Tap Steps */}
            <div className="p-4 space-y-3">
              {backTapSteps.map((step, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3"
                >
                  <span className="w-7 h-7 rounded-full bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))] text-sm font-medium flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-[rgb(var(--text-primary))]">
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* Tip Callout */}
            <div className="mx-4 mb-4 p-3 rounded-xl bg-[rgb(var(--warning))]/5 border border-[rgb(var(--warning))]/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-[rgb(var(--warning))] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  {t('iphoneSetup.tipTripleTap')}
                </p>
              </div>
            </div>

            {/* Test Callout */}
            <div className="mx-4 mb-4 p-3 rounded-xl bg-[rgb(var(--positive))]/5 border border-[rgb(var(--positive))]/20">
              <div className="flex items-start gap-2">
                <Play className="w-4 h-4 text-[rgb(var(--positive))] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[rgb(var(--text-primary))] font-medium">
                  {t('iphoneSetup.testTripleTap')}
                </p>
              </div>
            </div>
          </div>

          {/* Secondary CTA - Open Quick Add */}
          <Link
            href="/quick-add"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-primary))] font-medium border border-[rgb(var(--border-primary))] touch-target active:bg-[rgb(var(--bg-secondary))] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {t('iphoneSetup.openQuickAdd')}
          </Link>
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
