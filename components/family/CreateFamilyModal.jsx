'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n-context'
import { Users, Sparkles } from 'lucide-react'

const FAMILY_ICONS = ['👨‍👩‍👧‍👦', '👨‍👩‍👦', '👨‍👩‍👧', '🏠', '💕', '❤️', '🏡', '👪']

export function CreateFamilyModal({ isOpen, onClose, onCreate }) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('👨‍👩‍👧‍👦')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onCreate({ name: name.trim(), icon: selectedIcon })
      setName('')
      setSelectedIcon('👨‍👩‍👧‍👦')
      onClose()
    } catch (error) {
      console.error('Error creating family:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setName('')
      setSelectedIcon('👨‍👩‍👧‍👦')
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('family.createHousehold')}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Icon with preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-4xl">
            {selectedIcon}
          </div>
          
          {/* Icon selector */}
          <div className="flex flex-wrap gap-2 justify-center">
            {FAMILY_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setSelectedIcon(icon)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                  selectedIcon === icon
                    ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 scale-110'
                    : 'bg-[rgb(var(--bg-secondary))] hover:bg-[rgb(var(--bg-tertiary))]'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Family name input */}
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            {t('family.familyName')}
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('family.familyNamePlaceholder')}
            className="w-full"
            autoFocus
          />
          <p className="mt-2 text-xs text-[rgb(var(--text-tertiary))]">
            {t('family.familyNameHint')}
          </p>
        </div>

        {/* Features preview */}
        <div className="bg-[rgb(var(--bg-secondary))] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-primary))]">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {t('family.whatYouGet')}
          </div>
          <ul className="space-y-2 text-sm text-[rgb(var(--text-secondary))]">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {t('family.featureSharedExpenses')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {t('family.featureInviteMembers')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {t('family.featureTrackIncome')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {t('family.featureInsights')}
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('common.loading')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('family.create')}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
