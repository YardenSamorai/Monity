'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { useLoading } from '@/lib/loading-context'
import { Users, Check, X, Loader2 } from 'lucide-react'

export function AcceptInvitationClient({ token }) {
  const { t } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const router = useRouter()
  const [status, setStatus] = useState('loading') // loading, pending, accepted, error
  const [household, setHousehold] = useState(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    // Try to accept the invitation
    handleAccept()
  }, [token])

  const handleAccept = async () => {
    if (!token) return

    showLoading()
    try {
      const response = await fetch('/api/households/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to accept invitation')
      }

      const data = await response.json()
      setHousehold(data.household)
      setStatus('accepted')
      toast.success(t('family.inviteAccepted'), t('family.inviteAcceptedSuccess'))

      // Redirect to family page after 2 seconds
      setTimeout(() => {
        router.push('/family')
      }, 2000)
    } catch (error) {
      setStatus('error')
      toast.error(t('family.inviteAcceptFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  const handleReject = async () => {
    router.push('/family')
  }

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4">
        <Card className="p-6 sm:p-8 text-center">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-light-accent dark:text-dark-accent animate-spin" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">
            {t('family.processingInvitation')}
          </h1>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4">
        <Card className="p-6 sm:p-8 text-center">
          <X className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-light-danger dark:text-dark-danger" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">
            {t('family.invitationError')}
          </h1>
          <p className="text-sm sm:text-base text-light-text-secondary dark:text-dark-text-secondary mb-6">
            {t('family.invitationErrorDescription')}
          </p>
          <Button onClick={() => router.push('/family')} className="w-full sm:w-auto">
            {t('family.goToFamily')}
          </Button>
        </Card>
      </div>
    )
  }

  if (status === 'accepted') {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4">
        <Card className="p-6 sm:p-8 text-center">
          <Check className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-light-success dark:text-dark-success" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-light-text-primary dark:text-dark-text-primary">
            {t('family.inviteAccepted')}
          </h1>
          <p className="text-sm sm:text-base text-light-text-secondary dark:text-dark-text-secondary mb-6">
            {t('family.inviteAcceptedSuccess')}
          </p>
          {household && (
            <div className="mb-6">
              <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-2">
                {t('family.joinedHousehold')}
              </p>
              <p className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                {household.name}
              </p>
            </div>
          )}
          <Button onClick={() => router.push('/family')} className="w-full sm:w-auto">
            {t('family.goToFamily')}
          </Button>
        </Card>
      </div>
    )
  }

  return null
}
