'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Target,
  Calendar,
  TrendingUp,
  Check
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useToast } from '@/lib/toast-context'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function NotificationsClient() {
  const { t, localeString } = useI18n()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error(t('notifications.loadFailed'), 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark as read')
      }

      // Update local state
      setNotifications(notifications.map(n => 
        notificationIds.includes(n.id) ? { ...n, isRead: true, readAt: new Date() } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - notificationIds.length))
    } catch (error) {
      toast.error(t('notifications.markReadFailed'), error.message)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all as read')
      }

      setNotifications(notifications.map(n => ({ ...n, isRead: true, readAt: new Date() })))
      setUnreadCount(0)
      toast.success(t('notifications.allMarkedRead'))
    } catch (error) {
      toast.error(t('notifications.markReadFailed'), error.message)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'budget_alert':
        return <AlertTriangle className="w-5 h-5 text-light-warning dark:text-dark-warning" />
      case 'bill_reminder':
        return <Calendar className="w-5 h-5 text-light-accent dark:text-dark-accent" />
      case 'goal_milestone':
        return <Target className="w-5 h-5 text-light-success dark:text-dark-success" />
      case 'anomaly':
        return <TrendingUp className="w-5 h-5 text-light-danger dark:text-dark-danger" />
      default:
        return <Bell className="w-5 h-5 text-light-text-tertiary dark:text-dark-text-tertiary" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'budget_alert':
        return 'warning'
      case 'bill_reminder':
        return 'default'
      case 'goal_milestone':
        return 'success'
      case 'anomaly':
        return 'danger'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 lg:mb-2">
            {t('notifications.title')}
          </h1>
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
            {unreadCount > 0 
              ? t('notifications.unreadCount', { count: unreadCount })
              : t('notifications.allRead')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
          >
            <Check className="w-4 h-4 mr-2" />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title={t('notifications.noNotifications')}
          description={t('notifications.noNotificationsDesc')}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                'p-4 cursor-pointer transition-all hover:shadow-soft',
                !notification.isRead && 'border-l-4 border-l-light-accent dark:border-l-dark-accent bg-light-accent/5 dark:bg-dark-accent/10'
              )}
              onClick={() => !notification.isRead && markAsRead([notification.id])}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                          'text-base font-semibold',
                          !notification.isRead 
                            ? 'text-light-text-primary dark:text-dark-text-primary' 
                            : 'text-light-text-secondary dark:text-dark-text-secondary'
                        )}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-light-accent dark:bg-dark-accent" />
                        )}
                      </div>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {notification.message}
                      </p>
                    </div>
                    <Badge variant={getTypeColor(notification.type)} className="text-xs flex-shrink-0">
                      {t(`notifications.types.${notification.type}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                      {formatDate(notification.createdAt, 'relative', { locale: localeString })}
                    </span>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead([notification.id])
                        }}
                        className="text-xs text-light-accent dark:text-dark-accent hover:underline"
                      >
                        {t('notifications.markAsRead')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

