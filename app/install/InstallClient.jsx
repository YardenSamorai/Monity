'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Share, 
  Plus, 
  ArrowRight, 
  Check, 
  Smartphone, 
  Zap, 
  WifiOff,
  ChevronDown,
  ExternalLink,
  X
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

export default function InstallClient() {
  const router = useRouter()
  const { t, isRTL } = useI18n()
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if running in standalone mode (PWA)
    const standalone = window.navigator.standalone || 
      window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iOS)
  }, [])

  const steps = [
    {
      icon: Share,
      title: t('install.step1Title'),
      description: t('install.step1Desc'),
      image: '/share-icon.svg', // We'll use an icon instead
    },
    {
      icon: Plus,
      title: t('install.step2Title'),
      description: t('install.step2Desc'),
    },
    {
      icon: Check,
      title: t('install.step3Title'),
      description: t('install.step3Desc'),
    },
  ]

  const benefits = [
    { icon: Zap, text: t('install.benefit1') },
    { icon: Smartphone, text: t('install.benefit2') },
    { icon: WifiOff, text: t('install.benefit3') },
  ]

  // If already installed as PWA
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-[rgb(var(--positive))]/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[rgb(var(--positive))]" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-3">
            {t('install.alreadyInstalled')}
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mb-8">
            {t('install.alreadyInstalledDesc')}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[rgb(var(--accent))] text-white font-medium"
          >
            {t('install.goToDashboard')}
            <ArrowRight className={cn("w-5 h-5", isRTL && "rtl-flip")} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] safe-area-inset">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-primary))]">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
        >
          <X className="w-6 h-6 text-[rgb(var(--text-secondary))]" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/MonityLogo.svg" alt="Monity" width={28} height={28} />
          <span className="font-semibold text-[rgb(var(--text-primary))]">
            {t('install.title')}
          </span>
        </div>
        <div className="w-10" />
      </header>

      <div className="p-6 max-w-md mx-auto">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4">
            <Image 
              src="/MonityLogo.svg" 
              alt="Monity" 
              width={96} 
              height={96}
              className="w-full h-full"
            />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
            {t('install.heroTitle')}
          </h1>
          <p className="text-[rgb(var(--text-secondary))]">
            {t('install.heroDesc')}
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="p-3 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-center"
            >
              <benefit.icon className="w-6 h-6 mx-auto mb-2 text-[rgb(var(--accent))]" />
              <span className="text-xs text-[rgb(var(--text-secondary))]">
                {benefit.text}
              </span>
            </div>
          ))}
        </div>

        {/* Installation Steps - iOS specific */}
        {isIOS && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4 text-center">
              {t('install.howToInstall')}
            </h2>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[rgb(var(--accent))]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[rgb(var(--accent))]">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-[rgb(var(--accent))]" />
                        <h3 className="font-medium text-[rgb(var(--text-primary))]">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm text-[rgb(var(--text-secondary))]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Non-iOS message */}
        {!isIOS && (
          <div className="mb-8 p-4 rounded-xl bg-[rgb(var(--info))]/10 border border-[rgb(var(--info))]/20">
            <p className="text-sm text-[rgb(var(--text-primary))]">
              {t('install.nonIOSMessage')}
            </p>
          </div>
        )}

        {/* Quick Add shortcut */}
        <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] mb-6">
          <h3 className="font-medium text-[rgb(var(--text-primary))] mb-2">
            {t('install.quickAddShortcut')}
          </h3>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
            {t('install.quickAddShortcutDesc')}
          </p>
          <Link
            href="/quick-add"
            className="inline-flex items-center gap-2 text-[rgb(var(--accent))] font-medium text-sm"
          >
            {t('install.tryQuickAdd')}
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full py-3.5 rounded-xl bg-[rgb(var(--accent))] text-white font-medium text-center"
          >
            {t('install.continueToDashboard')}
          </Link>
          <Link
            href="/settings/iphone"
            className="block w-full py-3.5 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] font-medium text-center"
          >
            {t('install.iPhoneSetup')}
          </Link>
        </div>
      </div>
    </div>
  )
}
