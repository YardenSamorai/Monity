'use client'

import { Card } from '@/components/ui/Card'
import { useI18n } from '@/lib/i18n-context'
import { Crown, Shield, User, Eye } from 'lucide-react'

const ROLES = [
  {
    id: 'owner',
    icon: Crown,
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    labelKey: 'family.roleOwner',
    descKey: 'family.roleOwnerDesc',
  },
  {
    id: 'admin',
    icon: Shield,
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    labelKey: 'family.roleAdmin',
    descKey: 'family.roleAdminDesc',
  },
  {
    id: 'member',
    icon: User,
    iconBg: 'bg-slate-50 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
    labelKey: 'family.roleMember',
    descKey: 'family.roleMemberDesc',
  },
  {
    id: 'viewer',
    icon: Eye,
    iconBg: 'bg-slate-50 dark:bg-slate-800',
    iconColor: 'text-slate-500 dark:text-slate-500',
    labelKey: 'family.roleViewer',
    descKey: 'family.roleViewerDesc',
  },
]

export function RolesCard() {
  const { t } = useI18n()

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[rgb(var(--border-primary))]">
        <h3 className="font-semibold text-[rgb(var(--text-primary))]">
          {t('family.rolesPermissions')}
        </h3>
      </div>

      {/* Roles List */}
      <div className="divide-y divide-[rgb(var(--border-primary))]">
        {ROLES.map((role) => {
          const Icon = role.icon
          return (
            <div key={role.id} className="p-3 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${role.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${role.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {t(role.labelKey)}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                  {t(role.descKey)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
