'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { useLoading } from '@/lib/loading-context'
import { Users, UserPlus } from 'lucide-react'

// Import family components
import { FamilyHeader } from '@/components/family/FamilyHeader'
import { FamilyOverview } from '@/components/family/FamilyOverview'
import { MembersCard } from '@/components/family/MembersCard'
import { InvitesCard } from '@/components/family/InvitesCard'
import { InsightsCard } from '@/components/family/InsightsCard'
import { RolesCard } from '@/components/family/RolesCard'
import { ActionsCard } from '@/components/family/ActionsCard'
import { TransactionsCard } from '@/components/family/TransactionsCard'

export function FamilyClient() {
  const { t } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const [household, setHousehold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  useEffect(() => {
    fetchHousehold()
  }, [])

  const fetchHousehold = async () => {
    try {
      const response = await fetch('/api/households')
      if (!response.ok) {
        if (response.status === 401) {
          setHousehold(null)
          return
        }
        setHousehold(null)
        return
      }
      const data = await response.json()
      setHousehold(data.household)
    } catch (error) {
      console.error('Error fetching household:', error)
      setHousehold(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHousehold = async () => {
    showLoading()
    try {
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: t('family.household') }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create household')
      }

      const data = await response.json()
      setHousehold(data.household)
      toast.success(t('family.created'), t('family.createdSuccess'))
    } catch (error) {
      toast.error(t('family.createFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  const handleLeaveHousehold = async () => {
    if (!confirm(t('family.confirmLeave'))) return

    showLoading()
    try {
      const response = await fetch('/api/households/leave', { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to leave household')
      }
      setHousehold(null)
      toast.success(t('family.left'), t('family.leftSuccess'))
    } catch (error) {
      toast.error(t('family.leaveFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm(t('family.confirmCancelInvitation'))) return

    showLoading()
    try {
      const response = await fetch(`/api/households/invite/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel invitation')
      }

      toast.success(t('family.invitationCancelled'))
      fetchHousehold()
    } catch (error) {
      toast.error(t('family.cancelInvitationFailed'), error.message)
    } finally {
      hideLoading()
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  // No household - Empty state
  if (!household) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
            {t('family.welcome')}
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            {t('family.welcomeDescription')}
          </p>
          <Button onClick={handleCreateHousehold} className="w-full h-12">
            <UserPlus className="w-5 h-5 me-2" />
            {t('family.createHousehold')}
          </Button>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-4">
            {t('family.createHouseholdHint')}
          </p>
        </Card>
      </div>
    )
  }

  // Determine current user's role
  const currentMember = household.members.find(m => m.isCurrentUser)
  const isOwner = currentMember?.role === 'owner'
  const isAdmin = currentMember?.role === 'admin' || isOwner

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <FamilyHeader 
        household={household}
        onInvite={() => setIsInviteModalOpen(true)}
      />

      {/* Overview Cards */}
      <FamilyOverview household={household} />

      {/* Recent Transactions */}
      <TransactionsCard household={household} />

      {/* Main Content - 2 Column on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members */}
          <MembersCard 
            household={household}
            onUpdate={fetchHousehold}
          />

          {/* Invitations */}
          <InvitesCard 
            household={household}
            onInvite={fetchHousehold}
            onCancelInvitation={handleCancelInvitation}
            isInviteModalOpen={isInviteModalOpen}
            setIsInviteModalOpen={setIsInviteModalOpen}
          />

          {/* Insights - Show on mobile, hide on desktop (shown in sidebar) */}
          <div className="lg:hidden">
            <InsightsCard household={household} />
          </div>
        </div>

        {/* Sidebar (1/3) - Desktop only */}
        <div className="hidden lg:block space-y-6">
          {/* Insights */}
          <InsightsCard household={household} />

          {/* Roles & Permissions */}
          <RolesCard />

          {/* Quick Actions */}
          <ActionsCard 
            household={household}
            onLeave={handleLeaveHousehold}
            isOwner={isOwner}
          />
        </div>

        {/* Mobile-only: Roles & Actions */}
        <div className="lg:hidden space-y-6">
          <RolesCard />
          <ActionsCard 
            household={household}
            onLeave={handleLeaveHousehold}
            isOwner={isOwner}
          />
        </div>
      </div>
    </div>
  )
}
