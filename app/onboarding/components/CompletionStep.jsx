'use client'

import { useEffect, useState } from 'react'
import { Check, ArrowRight, Wallet, TrendingUp, Target, Calendar, Smartphone, ExternalLink } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const Confetti = dynamic(() => import('react-confetti'), { ssr: false })

export function CompletionStep({ onComplete, isLoading, data, currencySymbol }) {
  const { t, isRTL } = useI18n()
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  const nextSteps = [
    { icon: Wallet, text: t('onboarding.completion.nextStep1') },
    { icon: Target, text: t('onboarding.completion.nextStep2') },
    { icon: Calendar, text: t('onboarding.completion.nextStep3') },
  ]

  return (
    <div className="relative">
      {/* Confetti - Using brand colors */}
      {showConfetti && windowSize.width > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={100}
            gravity={0.12}
            colors={['#3B82F6', '#22C55E', '#6366F1', '#64748B']}
            style={{ position: 'fixed', top: 0, left: 0 }}
          />
        </div>
      )}

      <div className="text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-[rgb(var(--positive))] flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
          {t('onboarding.completion.title')}
        </h2>

        <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">
          {t('onboarding.completion.subtitle')}
        </p>

        {/* Summary Card */}
        <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] mb-6 text-start">
          <h3 className="font-semibold text-sm text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[rgb(var(--accent))]" />
            {t('onboarding.completion.summary')}
          </h3>
          
          <div className="space-y-2">
            {/* Account */}
            {data.account && (
              <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-secondary))]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[rgb(var(--accent))]/10 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5 text-[rgb(var(--accent))]" />
                  </div>
                  <span className="text-sm text-[rgb(var(--text-primary))]">
                    {data.account.name}
                  </span>
                </div>
                <span className="font-semibold text-sm text-[rgb(var(--text-primary))]" dir="ltr">
                  {currencySymbol}{Number(data.account.balance).toLocaleString()}
                </span>
              </div>
            )}

            {/* Recurring Income */}
            {data.recurringIncome && (
              <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-secondary))]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[rgb(var(--positive))]/10 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[rgb(var(--positive))]" />
                  </div>
                  <span className="text-sm text-[rgb(var(--text-primary))]">
                    {data.recurringIncome.description}
                  </span>
                </div>
                <span className="font-semibold text-sm text-[rgb(var(--positive))]" dir="ltr">
                  +{currencySymbol}{Number(data.recurringIncome.amount).toLocaleString()}
                </span>
              </div>
            )}

            {/* Recurring Expenses */}
            {data.recurringExpenses?.map((expense, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-secondary))] last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[rgb(var(--negative))]/10 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[rgb(var(--negative))]" />
                  </div>
                  <span className="text-sm text-[rgb(var(--text-primary))]">
                    {expense.description}
                  </span>
                </div>
                <span className="font-semibold text-sm text-[rgb(var(--negative))]" dir="ltr">
                  -{currencySymbol}{Number(expense.amount).toLocaleString()}
                </span>
              </div>
            ))}

            {/* Empty state if skipped */}
            {!data.recurringIncome && (!data.recurringExpenses || data.recurringExpenses.length === 0) && (
              <p className="text-xs text-[rgb(var(--text-tertiary))] py-2">
                {t('onboarding.completion.noRecurring')}
              </p>
            )}
          </div>
        </div>

        {/* What's Next */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] mb-3">
            {t('onboarding.completion.whatsNext')}
          </h4>
          <div className="space-y-2">
            {nextSteps.map((step, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--bg-secondary))] text-start"
              >
                <step.icon className="w-4 h-4 text-[rgb(var(--accent))] flex-shrink-0" />
                <span className="text-xs text-[rgb(var(--text-secondary))]">
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* iPhone Shortcuts Tip */}
        <div className="p-4 rounded-xl bg-[rgb(var(--info))]/5 border border-[rgb(var(--info))]/20 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--info))] flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-start">
              <h4 className="font-semibold text-sm text-[rgb(var(--text-primary))] mb-1">
                {t('onboarding.completion.iphoneShortcuts')}
              </h4>
              <p className="text-xs text-[rgb(var(--text-secondary))] mb-2">
                {t('onboarding.completion.iphoneShortcutsDesc')}
              </p>
              <button
                onClick={() => router.push('/settings?tab=api')}
                className="text-xs font-medium text-[rgb(var(--info))] flex items-center gap-1.5"
              >
                {t('onboarding.completion.setupShortcuts')}
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onComplete}
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-[rgb(var(--accent))] text-white font-medium shadow-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {t('onboarding.completion.cta')}
              <ArrowRight className={cn("w-5 h-5", isRTL && "rtl-flip")} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
