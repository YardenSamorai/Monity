'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import Pusher from 'pusher-js'
import { useToast } from '@/lib/toast-context'
import { useI18n } from '@/lib/i18n-context'

const RealtimeContext = createContext(null)

// Event names (must match server)
export const EVENTS = {
  TRANSACTION_CREATED: 'transaction:created',
  TRANSACTION_UPDATED: 'transaction:updated',
  TRANSACTION_DELETED: 'transaction:deleted',
  CREDIT_CARD_TRANSACTION: 'credit-card:transaction',
  DASHBOARD_UPDATE: 'dashboard:update',
  FAMILY_TRANSACTION: 'family:transaction',
  MEMBER_JOINED: 'family:member-joined',
}

export function RealtimeProvider({ children, userId, householdId }) {
  const [pusher, setPusher] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const listenersRef = useRef(new Map())
  const { toast } = useToast()
  const { t, currencySymbol } = useI18n()

  // Initialize Pusher
  useEffect(() => {
    if (!userId) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher credentials not found')
      return
    }

    // Initialize Pusher client
    const pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      // Disable logging in production
      // enabledTransports: ['ws', 'wss'],
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
    
    // Listen for dashboard updates
    dashboardChannel.bind(EVENTS.DASHBOARD_UPDATE, (data) => {
      // Notify all listeners
      notifyListeners(EVENTS.DASHBOARD_UPDATE, data)
    })

    // Listen for credit card transactions
    dashboardChannel.bind(EVENTS.CREDIT_CARD_TRANSACTION, (data) => {
      toast.info(
        t('realtime.creditCardTransaction'),
        `${data.cardName}: ${currencySymbol}${data.transaction.amount}`
      )
      notifyListeners(EVENTS.CREDIT_CARD_TRANSACTION, data)
      notifyListeners(EVENTS.DASHBOARD_UPDATE, data)
    })

    // Subscribe to household channel if in a family
    let householdChannel = null
    if (householdId) {
      householdChannel = pusherClient.subscribe(`household-${householdId}`)
      
      // Listen for family transactions
      householdChannel.bind(EVENTS.FAMILY_TRANSACTION, (data) => {
        // Show toast notification
        const isExpense = data.transaction.type === 'expense'
        toast.info(
          t('realtime.familyTransaction', { name: data.actor }),
          `${isExpense ? '-' : '+'}${currencySymbol}${data.transaction.amount} - ${data.transaction.description}`
        )
        notifyListeners(EVENTS.FAMILY_TRANSACTION, data)
        notifyListeners(EVENTS.DASHBOARD_UPDATE, data)
      })

      // Listen for new members
      householdChannel.bind(EVENTS.MEMBER_JOINED, (data) => {
        toast.success(
          t('realtime.memberJoined'),
          data.memberName
        )
        notifyListeners(EVENTS.MEMBER_JOINED, data)
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
  }, [userId, householdId, toast, t, currencySymbol])

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
