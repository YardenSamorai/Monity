'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { useLoading } from '@/lib/loading-context'
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Copy,
  Check,
  UserPlus,
  Link as LinkIcon
} from 'lucide-react'

const STATUS_CONFIG = {
  pending: {
    label: 'family.statusPending',
    icon: Clock,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  accepted: {
    label: 'family.statusAccepted',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  expired: {
    label: 'family.statusExpired',
    icon: XCircle,
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
}

export function InvitesCard({ 
  household, 
  onInvite, 
  onCancelInvitation,
  onResendInvitation 
}) {
  const { t, localeString } = useI18n()
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)

  const invitations = household.invitations || []
  const pendingInvites = invitations.filter(inv => inv.status === 'pending')

  const handleCopyLink = () => {
    const link = `${window.location.origin}/family/accept?token=${household.inviteToken}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t('common.copied'))
  }

  const handleSendInvite = async () => {
    if (!inviteEmail) return

    setSending(true)
    try {
      const response = await fetch('/api/households/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inviteEmail,
          locale: localeString?.split('-')[0] || 'en',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send invitation')
      }

      toast.success(t('family.inviteSent'), t('family.emailSentTo', { email: inviteEmail }))
      setIsInviteModalOpen(false)
      setInviteEmail('')
      onInvite?.()
    } catch (error) {
      toast.error(t('family.inviteFailed'), error.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {t('family.invitations')}
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <UserPlus className="w-4 h-4 me-1" />
              {t('family.invite')}
            </Button>
          </div>
        </div>

        {/* Content */}
        {pendingInvites.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Mail className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              {t('family.noPendingInvites')}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
              {t('family.inviteFirstMember')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgb(var(--border-primary))]">
            {pendingInvites.map((invitation) => {
              const status = STATUS_CONFIG[invitation.status] || STATUS_CONFIG.pending
              const StatusIcon = status.icon

              return (
                <div key={invitation.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[rgb(var(--text-primary))] truncate">
                          {invitation.email || t('family.linkInvitation')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {t(status.label)}
                          </span>
                          {invitation.expiresAt && (
                            <span className="text-xs text-[rgb(var(--text-tertiary))]">
                              {t('family.expiresOn')} {new Date(invitation.expiresAt).toLocaleDateString(localeString)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onCancelInvitation(invitation.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        title={t('family.cancelInvite')}
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false)
          setInviteEmail('')
        }}
        title={t('family.inviteMember')}
      >
        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <Input
              label={t('family.inviteByEmail')}
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          {/* Or Share Link */}
          <div className="pt-4 border-t border-[rgb(var(--border-primary))]">
            <p className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
              {t('family.orShareLink')}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 h-11 px-3 flex items-center rounded-xl bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-primary))]">
                <LinkIcon className="w-4 h-4 text-[rgb(var(--text-tertiary))] me-2 flex-shrink-0" />
                <p className="text-sm text-[rgb(var(--text-primary))] truncate">
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/family/accept?token=...`}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleCopyLink}
                className="flex-shrink-0 w-11 h-11 !p-0"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setIsInviteModalOpen(false)
                setInviteEmail('')
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSendInvite}
              disabled={!inviteEmail || sending}
            >
              {sending ? t('common.sending') : t('family.sendInvite')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
