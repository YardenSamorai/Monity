import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCardDisplayName, getOrCreateCreditCategory } from '@/lib/auto-process'

// Processes all pending recurring income, recurring transactions, and credit card billing
// Called by cron as a safety net, and by dashboard page load for immediate catch-up
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const results = {
      recurringIncome: [],
      recurringTransactions: [],
      creditCardBilling: [],
      processedAt: now.toISOString(),
    }

    // --- 1. Process recurring income ---
    const pendingIncomes = await prisma.recurringIncome.findMany({
      where: {
        isActive: true,
        nextRunDate: { lte: now },
      },
      include: { account: true, category: true },
    })

    for (const income of pendingIncomes) {
      try {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            userId: income.userId,
            recurringIncomeId: income.id,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
        })

        if (existingTransaction) {
          const nextRunDate = new Date(now)
          nextRunDate.setMonth(nextRunDate.getMonth() + 1)
          nextRunDate.setDate(income.dayOfMonth)
          await prisma.recurringIncome.update({
            where: { id: income.id },
            data: { lastRunDate: now, nextRunDate },
          })
          results.recurringIncome.push({ id: income.id, status: 'skipped_duplicate' })
          continue
        }

        const scheduledDate = new Date(now.getFullYear(), now.getMonth(), income.dayOfMonth)

        const transaction = await prisma.transaction.create({
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

        results.recurringIncome.push({ id: income.id, transactionId: transaction.id, status: 'success' })
      } catch (err) {
        console.error(`Auto-process recurring income ${income.id}:`, err)
        results.recurringIncome.push({ id: income.id, status: 'error', error: err.message })
      }
    }

    // --- 2. Process recurring transactions ---
    const pendingRecurring = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextRunDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: { account: true, category: true },
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

        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            userId: recurring.userId,
            recurringTransactionId: recurring.id,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
        })

        if (existingTransaction) {
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
          results.recurringTransactions.push({ id: recurring.id, status: 'skipped_duplicate' })
          continue
        }

        const scheduledDate = new Date(now.getFullYear(), now.getMonth(), recurring.dayOfMonth)

        const transaction = await prisma.transaction.create({
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

        results.recurringTransactions.push({ id: recurring.id, transactionId: transaction.id, status: 'success' })
      } catch (err) {
        console.error(`Auto-process recurring transaction ${recurring.id}:`, err)
        results.recurringTransactions.push({ id: recurring.id, status: 'error', error: err.message })
      }
    }

    // --- 3. Process credit card billing ---
    const currentDay = now.getDate()

    const allActiveCards = await prisma.creditCard.findMany({
      where: { isActive: true },
      include: {
        linkedAccount: true,
        user: { select: { id: true, preferredCurrency: true } },
      },
    })

    const cardsToProcess = allActiveCards.filter(card => card.billingDay <= currentDay)
    const processedCardIds = new Set()
    const creditCategoryCache = {}

    for (const card of cardsToProcess) {
      if (processedCardIds.has(card.id)) continue
      processedCardIds.add(card.id)

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

        if (pendingTransactions.length === 0) {
          results.creditCardBilling.push({ cardId: card.id, cardName: card.name, status: 'skipped_no_pending' })
          continue
        }

        if (!creditCategoryCache[card.userId]) {
          creditCategoryCache[card.userId] = await getOrCreateCreditCategory(card.userId)
        }
        const creditCategory = creditCategoryCache[card.userId]

        const totalAmount = pendingTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
        const displayName = getCardDisplayName(card.name)
        const billingDate = new Date(now.getFullYear(), now.getMonth(), 0)

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
          where: {
            id: { in: pendingTransactions.map(t => t.id) },
          },
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

        results.creditCardBilling.push({
          cardId: card.id,
          cardName: card.name,
          status: 'success',
          amount: totalAmount,
          transactionCount: pendingTransactions.length,
        })
      } catch (err) {
        console.error(`Auto-process credit card ${card.id}:`, err)
        results.creditCardBilling.push({ cardId: card.id, status: 'error', error: err.message })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Auto-process error:', error)
    return NextResponse.json(
      { error: 'Failed to auto-process', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/auto-process - Called by Vercel cron as safety net
export async function GET(request) {
  const fakePostRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
  })
  return POST(fakePostRequest)
}
