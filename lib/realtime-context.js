'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  
  // Visibility event (internal)
  VISIBILITY_RESTORED: 'visibility:restored',
}

// Routes that depend on SSR (server-side rendering) and need router.refresh()
const SSR_DEPENDENT_ROUTES = ['/analytics', '/insights', '/dashboard']

// Debounce utility
function debounce(fn, ms) {
  let timeoutId = null
  const debounced = (...args) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      fn(...args)
    }, ms)
  }
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  return debounced
}

export function RealtimeProvider({ children, userId, householdId }) {
  const [pusher, setPusher] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const listenersRef = useRef(new Map())
  const { toast } = useToast()
  const { t, currencySymbol } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  
  // Keep pathname ref up to date
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Visibility change listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      setIsVisible(visible)
      if (visible) {
        // Notify all listeners that visibility was restored
        const listeners = listenersRef.current.get(EVENTS.VISIBILITY_RESTORED) || []
        listeners.forEach(callback => callback({}))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [])

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

    // Conditional refresh - only for SSR-dependent routes
    const conditionalRefresh = debounce(() => {
      const currentPath = pathnameRef.current
      if (SSR_DEPENDENT_ROUTES.some(route => currentPath?.startsWith(route))) {
        console.log('[RealtimeContext] Refreshing SSR route:', currentPath)
        router.refresh()
      }
    }, 500)

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
    
    // Generic data refresh event
    dashboardChannel.bind(EVENTS.DATA_REFRESH, (data) => {
      console.log('[RealtimeContext] Data refresh triggered:', data.source)
      conditionalRefresh()
      notifyAll(EVENTS.DATA_REFRESH, data)
    })
    
    // Dashboard update
    dashboardChannel.bind(EVENTS.DASHBOARD_UPDATE, (data) => {
      console.log('[RealtimeContext] Received DASHBOARD_UPDATE:', data)
      conditionalRefresh()
      notifyAll(EVENTS.DASHBOARD_UPDATE, data)
    })

    // Credit card transaction
    dashboardChannel.bind(EVENTS.CREDIT_CARD_TRANSACTION, (data) => {
      console.log('[RealtimeContext] Received CREDIT_CARD_TRANSACTION:', data)
      toast.info(
        t('realtime.creditCardTransaction'),
        `${data.cardName}: ${currencySymbol}${data.transaction.amount}`
      )
      conditionalRefresh()
      notifyAll(EVENTS.CREDIT_CARD_TRANSACTION, data)
    })

    // Transaction events
    dashboardChannel.bind(EVENTS.TRANSACTION_CREATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.TRANSACTION_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.TRANSACTION_UPDATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.TRANSACTION_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.TRANSACTION_DELETED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.TRANSACTION_DELETED, data)
    })

    // Category events
    dashboardChannel.bind(EVENTS.CATEGORY_CREATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.CATEGORY_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.CATEGORY_UPDATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.CATEGORY_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.CATEGORY_DELETED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.CATEGORY_DELETED, data)
    })

    // Account events
    dashboardChannel.bind(EVENTS.ACCOUNT_CREATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.ACCOUNT_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.ACCOUNT_UPDATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.ACCOUNT_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.ACCOUNT_DELETED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.ACCOUNT_DELETED, data)
    })

    // Budget events
    dashboardChannel.bind(EVENTS.BUDGET_CREATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.BUDGET_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.BUDGET_UPDATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.BUDGET_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.BUDGET_DELETED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.BUDGET_DELETED, data)
    })

    // Goal events
    dashboardChannel.bind(EVENTS.GOAL_CREATED, (data) => {
      toast.success(t('realtime.goalCreated'), data.goal?.name || '')
      conditionalRefresh()
      notifyAll(EVENTS.GOAL_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.GOAL_UPDATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.GOAL_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.GOAL_DELETED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.GOAL_DELETED, data)
    })
    dashboardChannel.bind(EVENTS.GOAL_CONTRIBUTION, (data) => {
      toast.success(t('realtime.goalContribution'), `${currencySymbol}${data.goal?.amount || 0}`)
      conditionalRefresh()
      notifyAll(EVENTS.GOAL_CONTRIBUTION, data)
    })

    // Credit card CRUD events
    dashboardChannel.bind(EVENTS.CREDIT_CARD_CREATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.CREDIT_CARD_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.CREDIT_CARD_UPDATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.CREDIT_CARD_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.CREDIT_CARD_DELETED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.CREDIT_CARD_DELETED, data)
    })
    dashboardChannel.bind(EVENTS.CREDIT_CARD_TRANSACTION_UPDATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.CREDIT_CARD_TRANSACTION_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.CREDIT_CARD_TRANSACTION_DELETED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.CREDIT_CARD_TRANSACTION_DELETED, data)
    })

    // Recurring income events
    dashboardChannel.bind(EVENTS.RECURRING_INCOME_CREATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.RECURRING_INCOME_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.RECURRING_INCOME_UPDATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.RECURRING_INCOME_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.RECURRING_INCOME_DELETED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.RECURRING_INCOME_DELETED, data)
    })

    // Recurring transaction events
    dashboardChannel.bind(EVENTS.RECURRING_TRANSACTION_CREATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.RECURRING_TRANSACTION_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.RECURRING_TRANSACTION_UPDATED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.RECURRING_TRANSACTION_UPDATED, data)
    })
    dashboardChannel.bind(EVENTS.RECURRING_TRANSACTION_DELETED, (data) => {
      conditionalRefresh()
      notifyAll(EVENTS.RECURRING_TRANSACTION_DELETED, data)
    })

    // Notification events
    dashboardChannel.bind(EVENTS.NOTIFICATION_CREATED, (data) => {
      toast.info(t('realtime.newNotification'), data.notification?.title || '')
      notifyAll(EVENTS.NOTIFICATION_CREATED, data)
    })
    dashboardChannel.bind(EVENTS.NOTIFICATION_READ, (data) => {
      notifyAll(EVENTS.NOTIFICATION_READ, data)
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
        conditionalRefresh()
        notifyAll(EVENTS.FAMILY_TRANSACTION, data)
      })

      // Transaction events from household
      householdChannel.bind(EVENTS.TRANSACTION_CREATED, (data) => {
        conditionalRefresh()
        notifyAll(EVENTS.TRANSACTION_CREATED, data)
      })
      householdChannel.bind(EVENTS.TRANSACTION_UPDATED, (data) => {
        conditionalRefresh()
        notifyAll(EVENTS.TRANSACTION_UPDATED, data)
      })
      householdChannel.bind(EVENTS.TRANSACTION_DELETED, (data) => {
        conditionalRefresh()
        notifyAll(EVENTS.TRANSACTION_DELETED, data)
      })

      // Member events
      householdChannel.bind(EVENTS.MEMBER_JOINED, (data) => {
        toast.success(t('realtime.memberJoined'), data.memberName)
        conditionalRefresh()
        notifyAll(EVENTS.MEMBER_JOINED, data)
      })
      householdChannel.bind(EVENTS.MEMBER_LEFT, (data) => {
        toast.info(t('realtime.memberLeft'), data.memberName)
        conditionalRefresh()
        notifyAll(EVENTS.MEMBER_LEFT, data)
      })
      householdChannel.bind(EVENTS.MEMBER_UPDATED, (data) => {
        conditionalRefresh()
        notifyAll(EVENTS.MEMBER_UPDATED, data)
      })

      // Invite events
      householdChannel.bind(EVENTS.INVITE_SENT, (data) => {
        conditionalRefresh()
        notifyAll(EVENTS.INVITE_SENT, data)
      })
      householdChannel.bind(EVENTS.INVITE_ACCEPTED, (data) => {
        toast.success(t('realtime.inviteAccepted'), data.memberName)
        conditionalRefresh()
        notifyAll(EVENTS.INVITE_ACCEPTED, data)
      })
    }

    // Cleanup
    return () => {
      conditionalRefresh.cancel()
      if (dashboardChannel) {
        pusherClient.unsubscribe(`dashboard-${userId}`)
      }
      if (householdChannel && householdId) {
        pusherClient.unsubscribe(`household-${householdId}`)
      }
      pusherClient.disconnect()
    }
  }, [userId, householdId, toast, t, currencySymbol, router])

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
    <RealtimeContext.Provider value={{ pusher, isConnected, isVisible, subscribe, EVENTS }}>
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
      isVisible: true,
      subscribe: () => () => {},
      EVENTS,
    }
  }
  return context
}

/**
 * Hook for data refresh with realtime events and visibility support.
 * 
 * Features:
 * - Debounced refresh (500ms default) - single mechanism, no duplicates
 * - Stable subscriptions - events array normalized internally
 * - Overlap protection - skips if already refreshing, queues one pending
 * - Visibility refresh - refreshes when tab becomes visible
 * 
 * @param {Object} options
 * @param {string} options.key - Unique identifier for this data
 * @param {Function} options.fetchFn - Async function to fetch data
 * @param {string[]} options.events - Array of EVENTS to listen to
 * @param {number} options.debounceMs - Debounce delay (default 500ms)
 * @param {boolean} options.refreshOnFocus - Refresh on visibility change (default true)
 */
export function useDataRefresh({ 
  key, 
  fetchFn, 
  events = [], 
  debounceMs = 500, 
  refreshOnFocus = true 
}) {
  const { subscribe, isVisible } = useRealtime()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pendingRefreshRef = useRef(false)
  const isRefreshingRef = useRef(false)
  const mountedRef = useRef(true)
  
  // Normalize events array to stable key to prevent re-subscriptions
  // Use slice() to avoid mutating original array, sort() for stability
  const eventsKey = useMemo(() => events.slice().sort().join('|'), [events])
  
  // Stable fetch function with overlap protection
  const executeRefresh = useCallback(async () => {
    // If already refreshing, mark as pending and return
    if (isRefreshingRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useDataRefresh:${key}] Skipped (already refreshing), queued pending`)
      }
      pendingRefreshRef.current = true
      return
    }
    
    isRefreshingRef.current = true
    if (mountedRef.current) setIsRefreshing(true)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useDataRefresh:${key}] fetchFn triggered`)
    }
    
    try {
      await fetchFn()
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useDataRefresh:${key}] fetchFn completed`)
      }
    } catch (error) {
      console.error(`[useDataRefresh:${key}] Fetch error:`, error)
    } finally {
      isRefreshingRef.current = false
      if (mountedRef.current) setIsRefreshing(false)
      
      // If there was a pending refresh, execute it
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false
        if (process.env.NODE_ENV === 'development') {
          console.log(`[useDataRefresh:${key}] Executing pending refresh`)
        }
        // Small delay before next refresh
        setTimeout(() => {
          if (mountedRef.current) executeRefresh()
        }, 100)
      }
    }
  }, [fetchFn, key])
  
  // Create debounced version
  const debouncedRefresh = useMemo(
    () => debounce(executeRefresh, debounceMs),
    [executeRefresh, debounceMs]
  )
  
  // Subscribe to events - use eventsKey for stability
  useEffect(() => {
    if (!eventsKey) return
    
    const eventsList = eventsKey.split('|').filter(Boolean)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useDataRefresh:${key}] Subscribing to events:`, eventsList.length)
    }
    
    const unsubscribers = eventsList.map(event => 
      subscribe(event, (data) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[useDataRefresh:${key}] Event received:`, event, data?.action || '')
        }
        debouncedRefresh()
      })
    )
    
    return () => {
      unsubscribers.forEach(unsub => unsub?.())
      debouncedRefresh.cancel()
    }
  }, [subscribe, eventsKey, debouncedRefresh, key])
  
  // Refresh on visibility restored
  useEffect(() => {
    if (!refreshOnFocus) return
    
    const unsub = subscribe(EVENTS.VISIBILITY_RESTORED, () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useDataRefresh:${key}] Visibility restored, refreshing...`)
      }
      debouncedRefresh()
    })
    
    return unsub
  }, [subscribe, refreshOnFocus, debouncedRefresh, key])
  
  // Also trigger on isVisible change (backup for visibility)
  const prevVisibleRef = useRef(isVisible)
  useEffect(() => {
    if (refreshOnFocus && isVisible && !prevVisibleRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useDataRefresh:${key}] Tab focused, refreshing...`)
      }
      debouncedRefresh()
    }
    prevVisibleRef.current = isVisible
  }, [isVisible, refreshOnFocus, debouncedRefresh, key])
  
  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      debouncedRefresh.cancel()
    }
  }, [debouncedRefresh])
  
  return { 
    refresh: debouncedRefresh, 
    isRefreshing,
    forceRefresh: executeRefresh 
  }
}

// Hook to refresh dashboard on realtime events (backward compatible)
export function useDashboardRefresh(refreshCallback) {
  const { subscribe } = useRealtime()

  useEffect(() => {
    const unsubscribe = subscribe(EVENTS.DASHBOARD_UPDATE, () => {
      refreshCallback?.()
    })

    return unsubscribe
  }, [subscribe, refreshCallback])
}
