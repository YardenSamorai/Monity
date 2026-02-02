'use client'

import Image from 'next/image'
import { TrendingUp, Target, PiggyBank, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { cn } from '@/lib/utils'

export function WelcomeStep({ onNext }) {
  const { t, isRTL } = useI18n()

  const features = [
    {
      icon: TrendingUp,
      text: t('onboarding.welcome.feature1'),
    },
    {
      icon: Target,
      text: t('onboarding.welcome.feature2'),
    },
    {
      icon: PiggyBank,
      text: t('onboarding.welcome.feature3'),
    },
  ]

  return (
    <div className="text-center">
      {/* Logo */}
      <div className="-mb-2 flex justify-center">
        <Image 
          src="/MonityLogo.svg" 
          alt="Monity" 
          width={300} 
          height={300}
          className="w-48 h-48 lg:w-56 lg:h-56"
        />
      </div>

      {/* Welcome Text */}
      <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-2">
        Monity
      </h1>

      <p className="text-[rgb(var(--text-secondary))] mb-10 max-w-sm mx-auto leading-relaxed">
        {t('onboarding.welcome.subtitle')}
      </p>

      {/* Features - Clean list style */}
      <div className="space-y-3 mb-10 max-w-sm mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))]"
          >
            <div className="w-10 h-10 rounded-lg bg-[rgb(var(--accent))]/10 flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-5 h-5 text-[rgb(var(--accent))]" />
            </div>
            <span className="text-sm text-[rgb(var(--text-primary))] font-medium text-start">
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={onNext}
        className="w-full py-3.5 px-6 rounded-xl bg-[rgb(var(--accent))] text-white font-medium shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {t('onboarding.welcome.cta')}
        <ArrowRight className={cn("w-5 h-5", isRTL && "rtl-flip")} />
      </button>
    </div>
  )
}
