'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Pusher from 'pusher-js'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'

const RealtimeContext = createContext(null)

// Event names (must match server)
export const EVENTS = {
  // Transaction events
  TRANSACTION_CREATED: 'transaction:created',
  TRANSACTION_UPDATED: 'transaction:updated',
  TRANSACTION_DELETED: 'transaction:deleted',
  
  // Credit card events
  CREDIT_CARD_CREATED: 'credit-card:created',
  CREDIT_CARD_UPDATED: 'credit-card:updated',
  CREDIT_CARD_DELETED: 'credit-card:deleted',
  CREDIT_CARD_TRANSACTION: 'credit-card:transaction',
  CREDIT_CARD_TRANSACTION_UPDATED: 'credit-card:transaction-updated',
  CREDIT_CARD_TRANSACTION_DELETED: 'credit-card:transaction-deleted',
  
  // Category events
  CATEGORY_CREATED: 'category:created',
  CATEGORY_UPDATED: 'category:updated',
  CATEGORY_DELETED: 'category:deleted',
  
  // Account events
  ACCOUNT_CREATED: 'account:created',
  ACCOUNT_UPDATED: 'account:updated',
  ACCOUNT_DELETED: 'account:deleted',
  
  // Budget events
  BUDGET_CREATED: 'budget:created',
  BUDGET_UPDATED: 'budget:updated',
  BUDGET_DELETED: 'budget:deleted',
  
  // Goal events
  GOAL_CREATED: 'goal:created',
  GOAL_UPDATED: 'goal:updated',
  GOAL_DELETED: 'goal:deleted',
  GOAL_CONTRIBUTION: 'goal:contribution',
  
  // Recurring events
  RECURRING_INCOME_CREATED: 'recurring-income:created',
  RECURRING_INCOME_UPDATED: 'recurring-income:updated',
  RECURRING_INCOME_DELETED: 'recurring-income:deleted',
  RECURRING_TRANSACTION_CREATED: 'recurring-transaction:created',
  RECURRING_TRANSACTION_UPDATED: 'recurring-transaction:updated',
  RECURRING_TRANSACTION_DELETED: 'recurring-transaction:deleted',
  
  // Family/Household events
  FAMILY_TRANSACTION: 'family:transaction',
  MEMBER_JOINED: 'family:member-joined',
  MEMBER_LEFT: 'family:member-left',
  MEMBER_UPDATED: 'family:member-updated',
  INVITE_SENT: 'family:invite-sent',
  INVITE_ACCEPTED: 'family:invite-accepted',
  
  // Notification events
  NOTIFICATION_CREATED: 'notification:created',
  NOTIFICATION_READ: 'notification:read',
  
  // Dashboard events
  DASHBOARD_UPDATE: 'dashboard:update',
  DATA_REFRESH: 'data:refresh',
}

export function RealtimeProvider({ children, userId, householdId }) {
  const [pusher, setPusher] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const listenersRef = useRef(new Map())
  const { toast } = useToast()
  const { t, currencySymbol } = useI18n()
  const router = useRouter()

  // Initialize Pusher
  useEffect(() => {
    if (!userId) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher credentials not found')
      return
    }

    // Helper to notify listeners
    const notifyAll = (event, data) => {
      const listeners = listenersRef.current.get(event) || []
      listeners.forEach(callback => callback(data))
    }

    // Helper to refresh page data
    const refreshData = () => {
      router.refresh()
    }

    // Initialize Pusher client
    const pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
    })

    // Connection state handlers
    pusherClient.connection.bind('connected', () => {
      setIsConnected(true)
      console.log('Pusher connected')
    })

    pusherClient.connection.bind('disconnected', () => {
      setIsConnected(false)
      console.log('Pusher disconnected')
    })

    pusherClient.connection.bind('error', (err) => {
      console.error('Pusher error:', err)
    })

    setPusher(pusherClient)

    // Subscribe to user's dashboard channel
    const dashboardChannel = pusherClient.subscribe(`dashboard-${userId}`)
    
    // Generic data refresh event - always triggers refresh
    dashboardChannel.bind(EVENTS.DATA_REFRESH, (data) => {
      console.log('Data refresh triggered:', data.source)
      refreshData()
      notifyAll(EVENTS.DATA_REFRESH, data)
    })
    
    // Dashboard update
    dashboardChannel.bind(EVENTS.DASHBOARD_UPDATE, (data) => {
      refreshData()
      notifyAll(EVENTS.DASHBOARD_UPDATE, data)
    })

    // Credit card transaction
    dashboardChannel.bind(EVENTS.CREDIT_CARD_TRANSACTION, (data) => {
      toast.info(
        t('realtime.creditCardTransaction'),
        `${data.cardName}: ${currencySymbol}${data.transaction.amount}`
      )
      refreshData()
      notifyAll(EVENTS.CREDIT_CARD_TRANSACTION, data)
    })

    // Transaction events
    dashboardChannel.bind(EVENTS.TRANSACTION_CREATED, (data) => {
      refreshData()
      notifyAll(EVENTS.TRANSACTION_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.TRANSACTION_UPDATED, (data) => {
      refreshData()
      notifyAll(EVENTS.TRANSACTION_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.TRANSACTION_DELETED, (data) => {
      refreshData()
      notifyAll(EVENTS.TRANSACTION_DELETED, data)
    })

    // Category events
    dashboardChannel.bind(EVENTS.CATEGORY_CREATED, (data) => {
      refreshData()
      notifyAll(EVENTS.CATEGORY_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.CATEGORY_UPDATED, (data) => {
      refreshData()
      notifyAll(EVENTS.CATEGORY_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.CATEGORY_DELETED, (data) => {
      refreshData()
      notifyAll(EVENTS.CATEGORY_DELETED, data)
    })

    // Account events
    dashboardChannel.bind(EVENTS.ACCOUNT_CREATED, (data) => {
      refreshData()
      notifyAll(EVENTS.ACCOUNT_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.ACCOUNT_UPDATED, (data) => {
      refreshData()
      notifyAll(EVENTS.ACCOUNT_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.ACCOUNT_DELETED, (data) => {
      refreshData()
      notifyAll(EVENTS.ACCOUNT_DELETED, data)
    })

    // Budget events
    dashboardChannel.bind(EVENTS.BUDGET_CREATED, (data) => {
      refreshData()
      notifyAll(EVENTS.BUDGET_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.BUDGET_UPDATED, (data) => {
      refreshData()
      notifyAll(EVENTS.BUDGET_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.BUDGET_DELETED, (data) => {
      refreshData()
      notifyAll(EVENTS.BUDGET_DELETED, data)
    })

    // Goal events
    dashboardChannel.bind(EVENTS.GOAL_CREATED, (data) => {
      toast.success(t('realtime.goalCreated'), data.goal?.name || '')
      refreshData()
      notifyAll(EVENTS.GOAL_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.GOAL_UPDATED, (data) => {
      refreshData()
      notifyAll(EVENTS.GOAL_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.GOAL_DELETED, (data) => {
      refreshData()
      notifyAll(EVENTS.GOAL_DELETED, data)
    })
    dashboardChannel.bind(EVENTS.GOAL_CONTRIBUTION, (data) => {
      toast.success(t('realtime.goalContribution'), `${currencySymbol}${data.goal?.amount || 0}`)
      refreshData()
      notifyAll(EVENTS.GOAL_CONTRIBUTION, data)
    })

    // Credit card CRUD events
    dashboardChannel.bind(EVENTS.CREDIT_CARD_CREATED, (data) => {
      refreshData()
      notifyAll(EVENTS.CREDIT_CARD_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.CREDIT_CARD_UPDATED, (data) => {
      refreshData()
      notifyAll(EVENTS.CREDIT_CARD_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.CREDIT_CARD_DELETED, (data) => {
      refreshData()
      notifyAll(EVENTS.CREDIT_CARD_DELETED, data)
    })

    // Recurring income events
    dashboardChannel.bind(EVENTS.RECURRING_INCOME_CREATED, (data) => {
      refreshData()
      notifyAll(EVENTS.RECURRING_INCOME_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.RECURRING_INCOME_UPDATED, (data) => {
      refreshData()
      notifyAll(EVENTS.RECURRING_INCOME_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.RECURRING_INCOME_DELETED, (data) => {
      refreshData()
      notifyAll(EVENTS.RECURRING_INCOME_DELETED, data)
    })

    // Recurring transaction events
    dashboardChannel.bind(EVENTS.RECURRING_TRANSACTION_CREATED, (data) => {
      refreshData()
      notifyAll(EVENTS.RECURRING_TRANSACTION_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.RECURRING_TRANSACTION_UPDATED, (data) => {
      refreshData()
      notifyAll(EVENTS.RECURRING_TRANSACTION_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.RECURRING_TRANSACTION_DELETED, (data) => {
      refreshData()
      notifyAll(EVENTS.RECURRING_TRANSACTION_DELETED, data)
    })

    // Notification events
    dashboardChannel.bind(EVENTS.NOTIFICATION_CREATED, (data) => {
      toast.info(t('realtime.newNotification'), data.notification?.title || '')
      notifyAll(EVENTS.NOTIFICATION_CREATED, data)
    })

    // Subscribe to household channel if in a family
    let householdChannel = null
    if (householdId) {
      householdChannel = pusherClient.subscribe(`household-${householdId}`)
      
      // Family transactions
      householdChannel.bind(EVENTS.FAMILY_TRANSACTION, (data) => {
        const isExpense = data.transaction.type === 'expense'
        toast.info(
          t('realtime.familyTransaction', { name: data.actor }),
          `${isExpense ? '-' : '+'}${currencySymbol}${data.transaction.amount} - ${data.transaction.description}`
        )
        refreshData()
        notifyAll(EVENTS.FAMILY_TRANSACTION, data)
      })

      // Transaction events from household
      householdChannel.bind(EVENTS.TRANSACTION_CREATED, (data) => {
        refreshData()
        notifyAll(EVENTS.TRANSACTION_CREATED, data)
      })
      householdChannel.bind(EVENTS.TRANSACTION_UPDATED, (data) => {
        refreshData()
        notifyAll(EVENTS.TRANSACTION_UPDATED, data)
      })
      householdChannel.bind(EVENTS.TRANSACTION_DELETED, (data) => {
        refreshData()
        notifyAll(EVENTS.TRANSACTION_DELETED, data)
      })

      // Member events
      householdChannel.bind(EVENTS.MEMBER_JOINED, (data) => {
        toast.success(t('realtime.memberJoined'), data.memberName)
        refreshData()
        notifyAll(EVENTS.MEMBER_JOINED, data)
      })
      householdChannel.bind(EVENTS.MEMBER_LEFT, (data) => {
        toast.info(t('realtime.memberLeft'), data.memberName)
        refreshData()
        notifyAll(EVENTS.MEMBER_LEFT, data)
      })
      householdChannel.bind(EVENTS.MEMBER_UPDATED, (data) => {
        refreshData()
        notifyAll(EVENTS.MEMBER_UPDATED, data)
      })

      // Invite events
      householdChannel.bind(EVENTS.INVITE_SENT, (data) => {
        refreshData()
        notifyAll(EVENTS.INVITE_SENT, data)
      })
      householdChannel.bind(EVENTS.INVITE_ACCEPTED, (data) => {
        toast.success(t('realtime.inviteAccepted'), data.memberName)
        refreshData()
        notifyAll(EVENTS.INVITE_ACCEPTED, data)
      })
    }

    // Cleanup
    return () => {
      if (dashboardChannel) {
        pusherClient.unsubscribe(`dashboard-${userId}`)
      }
      if (householdChannel && householdId) {
        pusherClient.unsubscribe(`household-${householdId}`)
      }
      pusherClient.disconnect()
    }
  }, [userId, householdId, toast, t, currencySymbol, router])

  // Notify all registered listeners
  const notifyListeners = useCallback((event, data) => {
    const listeners = listenersRef.current.get(event) || []
    listeners.forEach(callback => callback(data))
  }, [])

  // Subscribe to an event
  const subscribe = useCallback((event, callback) => {
    const listeners = listenersRef.current.get(event) || []
    listeners.push(callback)
    listenersRef.current.set(event, listeners)

    // Return unsubscribe function
    return () => {
      const currentListeners = listenersRef.current.get(event) || []
      listenersRef.current.set(
        event,
        currentListeners.filter(cb => cb !== callback)
      )
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ pusher, isConnected, subscribe, EVENTS }}>
      {children}
    </RealtimeContext.Provider>
  )
}

// Hook to use realtime features
export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    // Return a no-op version if not within provider
    return {
      isConnected: false,
      subscribe: () => () => {},
      EVENTS,
    }
  }
  return context
}

// Hook to refresh dashboard on realtime events
export function useDashboardRefresh(refreshCallback) {
  const { subscribe, EVENTS } = useRealtime()

  useEffect(() => {
    const unsubscribe = subscribe(EVENTS.DASHBOARD_UPDATE, () => {
      refreshCallback?.()
    })

    return unsubscribe
  }, [subscribe, refreshCallback, EVENTS])
}
