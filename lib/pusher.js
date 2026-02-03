// Server-side Pusher utility
import Pusher from 'pusher'

// Initialize Pusher server instance
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
})

// Channel names
export const CHANNELS = {
  // User-specific channel
  user: (userId) => `private-user-${userId}`,
  // Household channel for family updates
  household: (householdId) => `private-household-${householdId}`,
  // Public dashboard channel (for personal updates)
  dashboard: (userId) => `dashboard-${userId}`,
}

// Event names
export const EVENTS = {
  // Transaction events
  TRANSACTION_CREATED: 'transaction:created',
  TRANSACTION_UPDATED: 'transaction:updated',
  TRANSACTION_DELETED: 'transaction:deleted',
  // Credit card events
  CREDIT_CARD_TRANSACTION: 'credit-card:transaction',
  // Dashboard events
  DASHBOARD_UPDATE: 'dashboard:update',
  // Family events
  FAMILY_TRANSACTION: 'family:transaction',
  MEMBER_JOINED: 'family:member-joined',
}

/**
 * Trigger an event to a specific channel
 */
export async function triggerEvent(channel, event, data) {
  try {
    await pusherServer.trigger(channel, event, data)
    return true
  } catch (error) {
    console.error('Pusher trigger error:', error)
    return false
  }
}

/**
 * Notify user's dashboard to refresh
 */
export async function notifyDashboardUpdate(userId, data = {}) {
  return triggerEvent(
    CHANNELS.dashboard(userId),
    EVENTS.DASHBOARD_UPDATE,
    { timestamp: new Date().toISOString(), ...data }
  )
}

/**
 * Notify household members about a new transaction
 */
export async function notifyHouseholdTransaction(householdId, transaction, actorName) {
  return triggerEvent(
    CHANNELS.household(householdId),
    EVENTS.FAMILY_TRANSACTION,
    {
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        description: transaction.description,
        category: transaction.category?.name || null,
      },
      actor: actorName,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Notify about a new credit card transaction
 */
export async function notifyCreditCardTransaction(userId, transaction, cardName) {
  return triggerEvent(
    CHANNELS.dashboard(userId),
    EVENTS.CREDIT_CARD_TRANSACTION,
    {
      transaction: {
        id: transaction.id,
        amount: Number(transaction.amount),
        description: transaction.description,
        status: transaction.status,
      },
      cardName,
      timestamp: new Date().toISOString(),
    }
  )
}

export default pusherServer
