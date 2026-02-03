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

// Event names - Comprehensive list for all features
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

/**
 * Generic data change notification - triggers dashboard refresh
 */
export async function notifyDataChange(userId, eventType, data = {}) {
  const promises = [
    triggerEvent(
      CHANNELS.dashboard(userId),
      eventType,
      { timestamp: new Date().toISOString(), ...data }
    ),
    // Also trigger a generic refresh event
    triggerEvent(
      CHANNELS.dashboard(userId),
      EVENTS.DATA_REFRESH,
      { source: eventType, timestamp: new Date().toISOString() }
    ),
  ]
  await Promise.all(promises)
  return true
}

/**
 * Notify about category changes
 */
export async function notifyCategoryChange(userId, action, category) {
  const eventMap = {
    created: EVENTS.CATEGORY_CREATED,
    updated: EVENTS.CATEGORY_UPDATED,
    deleted: EVENTS.CATEGORY_DELETED,
  }
  return notifyDataChange(userId, eventMap[action], { category })
}

/**
 * Notify about account changes
 */
export async function notifyAccountChange(userId, action, account) {
  const eventMap = {
    created: EVENTS.ACCOUNT_CREATED,
    updated: EVENTS.ACCOUNT_UPDATED,
    deleted: EVENTS.ACCOUNT_DELETED,
  }
  return notifyDataChange(userId, eventMap[action], { account })
}

/**
 * Notify about budget changes
 */
export async function notifyBudgetChange(userId, action, budget) {
  const eventMap = {
    created: EVENTS.BUDGET_CREATED,
    updated: EVENTS.BUDGET_UPDATED,
    deleted: EVENTS.BUDGET_DELETED,
  }
  return notifyDataChange(userId, eventMap[action], { budget })
}

/**
 * Notify about goal changes
 */
export async function notifyGoalChange(userId, action, goal) {
  const eventMap = {
    created: EVENTS.GOAL_CREATED,
    updated: EVENTS.GOAL_UPDATED,
    deleted: EVENTS.GOAL_DELETED,
    contribution: EVENTS.GOAL_CONTRIBUTION,
  }
  return notifyDataChange(userId, eventMap[action], { goal })
}

/**
 * Notify about credit card changes (card itself, not transaction)
 */
export async function notifyCreditCardChange(userId, action, creditCard) {
  const eventMap = {
    created: EVENTS.CREDIT_CARD_CREATED,
    updated: EVENTS.CREDIT_CARD_UPDATED,
    deleted: EVENTS.CREDIT_CARD_DELETED,
  }
  return notifyDataChange(userId, eventMap[action], { creditCard })
}

/**
 * Notify about recurring income changes
 */
export async function notifyRecurringIncomeChange(userId, action, recurringIncome) {
  const eventMap = {
    created: EVENTS.RECURRING_INCOME_CREATED,
    updated: EVENTS.RECURRING_INCOME_UPDATED,
    deleted: EVENTS.RECURRING_INCOME_DELETED,
  }
  return notifyDataChange(userId, eventMap[action], { recurringIncome })
}

/**
 * Notify about recurring transaction changes
 */
export async function notifyRecurringTransactionChange(userId, action, recurringTransaction) {
  const eventMap = {
    created: EVENTS.RECURRING_TRANSACTION_CREATED,
    updated: EVENTS.RECURRING_TRANSACTION_UPDATED,
    deleted: EVENTS.RECURRING_TRANSACTION_DELETED,
  }
  return notifyDataChange(userId, eventMap[action], { recurringTransaction })
}

/**
 * Notify about transaction update/delete
 */
export async function notifyTransactionChange(userId, action, transaction, householdId = null) {
  const eventMap = {
    created: EVENTS.TRANSACTION_CREATED,
    updated: EVENTS.TRANSACTION_UPDATED,
    deleted: EVENTS.TRANSACTION_DELETED,
  }
  
  // Notify user's dashboard
  await notifyDataChange(userId, eventMap[action], { transaction })
  
  // If shared, also notify household
  if (householdId) {
    await triggerEvent(
      CHANNELS.household(householdId),
      eventMap[action],
      { transaction, timestamp: new Date().toISOString() }
    )
  }
  return true
}

/**
 * Notify household members about family events
 */
export async function notifyHouseholdEvent(householdId, event, data) {
  return triggerEvent(
    CHANNELS.household(householdId),
    event,
    { timestamp: new Date().toISOString(), ...data }
  )
}

/**
 * Notify user about a new notification
 */
export async function notifyNewNotification(userId, notification) {
  return triggerEvent(
    CHANNELS.dashboard(userId),
    EVENTS.NOTIFICATION_CREATED,
    { notification, timestamp: new Date().toISOString() }
  )
}

export default pusherServer
