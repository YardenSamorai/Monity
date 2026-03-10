import { prisma } from '@/lib/prisma'

const CARD_TYPE_DISPLAY = {
  visa: 'ויזה',
  mastercard: 'מאסטרקארד',
  amex: 'אמריקן אקספרס',
  diners: 'דיינרס',
  discover: 'דיסקבר',
  isracard: 'ישראכרט',
  cal: 'כאל',
  max: 'מקס',
  other: 'כרטיס',
}

export function getCardDisplayName(cardName) {
  return CARD_TYPE_DISPLAY[cardName] || cardName
}

export async function getOrCreateCreditCategory(userId) {
  let category = await prisma.category.findFirst({
    where: { userId, name: 'חיובי אשראי' },
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        userId,
        name: 'חיובי אשראי',
        type: 'expense',
        icon: '💳',
        color: '#6366F1',
        isDefault: true,
      },
    })
  }

  return category
}

/**
 * Processes all pending recurring income, recurring transactions, and credit card billing
 * for a specific user. Called on dashboard load to ensure data is up-to-date.
 * Only processes items whose date has already passed — safe to call multiple times.
 */
export async function processUserPendingItems(userId) {
  const now = new Date()
  const results = { recurringIncome: 0, recurringTransactions: 0, creditCardBilling: 0 }

  try {
    // --- 1. Recurring income ---
    const pendingIncomes = await prisma.recurringIncome.findMany({
      where: { userId, isActive: true, nextRunDate: { lte: now } },
    })

    for (const income of pendingIncomes) {
      try {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const exists = await prisma.transaction.findFirst({
          where: {
            userId: income.userId,
            recurringIncomeId: income.id,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
        })

        if (exists) {
          const nextRunDate = new Date(now)
          nextRunDate.setMonth(nextRunDate.getMonth() + 1)
          nextRunDate.setDate(income.dayOfMonth)
          await prisma.recurringIncome.update({
            where: { id: income.id },
            data: { lastRunDate: now, nextRunDate },
          })
          continue
        }

        const scheduledDate = new Date(now.getFullYear(), now.getMonth(), income.dayOfMonth)

        await prisma.transaction.create({
          data: {
            userId: income.userId,
            accountId: income.accountId,
            categoryId: income.categoryId,
            type: 'income',
            amount: income.amount,
            description: income.description,
            date: scheduledDate,
            notes: 'Automatic recurring income',
            recurringIncomeId: income.id,
            householdId: income.householdId,
            isShared: income.isShared,
          },
        })

        await prisma.account.update({
          where: { id: income.accountId },
          data: { balance: { increment: income.amount } },
        })

        const nextRunDate = new Date(now)
        nextRunDate.setMonth(nextRunDate.getMonth() + 1)
        nextRunDate.setDate(income.dayOfMonth)

        await prisma.recurringIncome.update({
          where: { id: income.id },
          data: { lastRunDate: now, nextRunDate },
        })

        results.recurringIncome++
      } catch (err) {
        console.error(`Auto-process recurring income ${income.id}:`, err)
      }
    }

    // --- 2. Recurring transactions ---
    const pendingRecurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextRunDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    })

    for (const recurring of pendingRecurring) {
      try {
        if (recurring.endDate && new Date(recurring.endDate) < now) {
          await prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: { isActive: false },
          })
          continue
        }

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const exists = await prisma.transaction.findFirst({
          where: {
            userId: recurring.userId,
            recurringTransactionId: recurring.id,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
        })

        if (exists) {
          const nextRunDate = new Date(now)
          nextRunDate.setMonth(nextRunDate.getMonth() + 1)
          nextRunDate.setDate(recurring.dayOfMonth)

          if (recurring.endDate && nextRunDate > new Date(recurring.endDate)) {
            await prisma.recurringTransaction.update({
              where: { id: recurring.id },
              data: { lastRunDate: now, isActive: false },
            })
          } else {
            await prisma.recurringTransaction.update({
              where: { id: recurring.id },
              data: { lastRunDate: now, nextRunDate },
            })
          }
          continue
        }

        const scheduledDate = new Date(now.getFullYear(), now.getMonth(), recurring.dayOfMonth)

        await prisma.transaction.create({
          data: {
            userId: recurring.userId,
            accountId: recurring.accountId,
            categoryId: recurring.categoryId,
            type: recurring.type,
            amount: recurring.amount,
            description: recurring.description,
            date: scheduledDate,
            notes: `Automatic recurring ${recurring.type}`,
            recurringTransactionId: recurring.id,
            householdId: recurring.householdId,
            isShared: recurring.isShared,
          },
        })

        const balanceChange = recurring.type === 'income' ? recurring.amount : -recurring.amount
        await prisma.account.update({
          where: { id: recurring.accountId },
          data: { balance: { increment: balanceChange } },
        })

        const nextRunDate = new Date(now)
        nextRunDate.setMonth(nextRunDate.getMonth() + 1)
        nextRunDate.setDate(recurring.dayOfMonth)

        if (recurring.endDate && nextRunDate > new Date(recurring.endDate)) {
          await prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: { lastRunDate: now, isActive: false },
          })
        } else {
          await prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: { lastRunDate: now, nextRunDate },
          })
        }

        results.recurringTransactions++
      } catch (err) {
        console.error(`Auto-process recurring transaction ${recurring.id}:`, err)
      }
    }

    // --- 3. Credit card billing ---
    const currentDay = now.getDate()
    const userCards = await prisma.creditCard.findMany({
      where: { userId, isActive: true, billingDay: { lte: currentDay } },
      include: { linkedAccount: true },
    })

    let creditCategory = null
    if (userCards.length > 0) {
      creditCategory = await getOrCreateCreditCategory(userId)
    }

    for (const card of userCards) {
      try {
        const pendingTransactions = await prisma.creditCardTransaction.findMany({
          where: {
            creditCardId: card.id,
            status: 'pending',
            date: {
              lt: new Date(now.getFullYear(), now.getMonth(), card.billingDay + 1),
            },
          },
        })

        if (pendingTransactions.length === 0) continue

        const totalAmount = pendingTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
        const displayName = getCardDisplayName(card.name)
        const billingDate = new Date(now.getFullYear(), now.getMonth(), card.billingDay)

        const bankTransaction = await prisma.transaction.create({
          data: {
            userId: card.userId,
            accountId: card.linkedAccountId,
            categoryId: creditCategory?.id || null,
            type: 'expense',
            amount: totalAmount,
            description: `חיוב ${displayName} ••••${card.lastFourDigits}`,
            date: billingDate,
            notes: `חיוב אוטומטי עבור ${pendingTransactions.length} עסקאות אשראי`,
          },
        })

        await prisma.account.update({
          where: { id: card.linkedAccountId },
          data: { balance: { decrement: totalAmount } },
        })

        await prisma.creditCardTransaction.updateMany({
          where: { id: { in: pendingTransactions.map(t => t.id) } },
          data: {
            status: 'billed',
            billedDate: billingDate,
            bankTransactionId: bankTransaction.id,
          },
        })

        await prisma.notification.create({
          data: {
            userId: card.userId,
            type: 'credit_card_billed',
            title: 'חיוב כרטיס אשראי',
            message: `כרטיס ${displayName} ••••${card.lastFourDigits} חויב ב-${totalAmount.toFixed(2)} עבור ${pendingTransactions.length} עסקאות.`,
            metadata: JSON.stringify({
              cardId: card.id,
              cardName: card.name,
              amount: totalAmount,
              transactionCount: pendingTransactions.length,
              bankTransactionId: bankTransaction.id,
            }),
          },
        })

        results.creditCardBilling++
      } catch (err) {
        console.error(`Auto-process credit card ${card.id}:`, err)
      }
    }
  } catch (error) {
    console.error('Auto-process error for user', userId, error)
  }

  return results
}
