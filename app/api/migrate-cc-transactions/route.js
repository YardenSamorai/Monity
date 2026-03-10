import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCardDisplayName, getOrCreateCreditCategory } from '@/lib/auto-process'

// GET /api/migrate-cc-transactions
// One-time migration: fix existing credit card billing transactions
// Phase 1: Translates English descriptions to Hebrew & assigns "חיובי אשראי" category
// Phase 2: Fixes wrongly-dated transactions (date should match scheduled day, not processing day)
export async function GET() {
  try {
    const phase1Results = await migrateDescriptions()
    const phase2Results = await fixTransactionDates()

    return NextResponse.json({
      phase1_descriptions: phase1Results,
      phase2_dates: phase2Results,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}

async function migrateDescriptions() {
  const oldTransactions = await prisma.transaction.findMany({
    where: {
      description: { startsWith: 'Credit card charge' },
    },
  })

  if (oldTransactions.length === 0) {
    return { message: 'No transactions to migrate', found: 0, updated: 0 }
  }

  const creditCategoryCache = {}
  let updated = 0

  for (const tx of oldTransactions) {
    try {
      if (!creditCategoryCache[tx.userId]) {
        creditCategoryCache[tx.userId] = await getOrCreateCreditCategory(tx.userId)
      }
      const category = creditCategoryCache[tx.userId]

      const match = tx.description.match(/Credit card charge\s*[–-]\s*(\w+)\s*[•·]+(\d+)/)
      let newDescription = tx.description

      if (match) {
        const cardType = match[1]
        const lastFour = match[2]
        const displayName = getCardDisplayName(cardType)
        newDescription = `חיוב ${displayName} ••••${lastFour}`
      }

      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          description: newDescription,
          categoryId: category?.id || tx.categoryId,
          notes: tx.notes?.startsWith('Automatic charge')
            ? tx.notes.replace(/Automatic charge for (\d+) credit card transactions/, 'חיוב אוטומטי עבור $1 עסקאות אשראי')
            : tx.notes,
        },
      })

      updated++
    } catch (err) {
      console.error(`Failed to migrate transaction ${tx.id}:`, err)
    }
  }

  return { found: oldTransactions.length, updated }
}

async function fixTransactionDates() {
  let ccFixed = 0
  let incomeFixed = 0
  let recurringFixed = 0

  // Fix credit card billing transactions:
  // Find Hebrew billing transactions and match them to their card's billingDay
  const ccTransactions = await prisma.transaction.findMany({
    where: {
      description: { startsWith: 'חיוב ' },
      notes: { contains: 'עסקאות אשראי' },
    },
  })

  for (const tx of ccTransactions) {
    try {
      const txDate = new Date(tx.date)
      const txDay = txDate.getDate()
      const txMonth = txDate.getMonth()
      const txYear = txDate.getFullYear()

      // Correct date = last day of the previous month relative to the billing month.
      // The billing happens in month M; we want the last day of month M-1.
      // If the transaction is already on the last day of its month, check if the
      // NEXT day would be the 1st of the next month (meaning it's already correct).
      const lastDayOfCurrentMonth = new Date(txYear, txMonth + 1, 0).getDate()
      const isLastDayOfMonth = txDay === lastDayOfCurrentMonth

      // If the date is already the last day of a month, it's correct
      if (isLastDayOfMonth) continue

      // The transaction is in the wrong spot. Determine the billing month:
      // If the current date is on or after billingDay, the billing month is the current month.
      // Otherwise, billing month is the current month (the tx was placed near billingDay).
      // Either way, the correct date is the last day of the month BEFORE the billing month.
      // Since the tx was created around the billing event, the correct date is
      // the last day of the previous month from the tx date.
      const correctDate = new Date(txYear, txMonth, 0) // last day of previous month

      await prisma.transaction.update({
        where: { id: tx.id },
        data: { date: correctDate },
      })

      await prisma.creditCardTransaction.updateMany({
        where: { bankTransactionId: tx.id },
        data: { billedDate: correctDate },
      })

      ccFixed++
    } catch (err) {
      console.error(`Failed to fix CC transaction date ${tx.id}:`, err)
    }
  }

  // Fix recurring income transactions
  const incomeTransactions = await prisma.transaction.findMany({
    where: {
      recurringIncomeId: { not: null },
    },
    include: { recurringIncome: true },
  })

  for (const tx of incomeTransactions) {
    try {
      if (!tx.recurringIncome) continue
      const txDate = new Date(tx.date)
      const correctDay = tx.recurringIncome.dayOfMonth

      if (txDate.getDate() !== correctDay) {
        const correctDate = new Date(txDate.getFullYear(), txDate.getMonth(), correctDay)
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { date: correctDate },
        })
        incomeFixed++
      }
    } catch (err) {
      console.error(`Failed to fix income transaction date ${tx.id}:`, err)
    }
  }

  // Fix recurring transactions
  const recurringTransactions = await prisma.transaction.findMany({
    where: {
      recurringTransactionId: { not: null },
    },
    include: { recurringTransaction: true },
  })

  for (const tx of recurringTransactions) {
    try {
      if (!tx.recurringTransaction) continue
      const txDate = new Date(tx.date)
      const correctDay = tx.recurringTransaction.dayOfMonth

      if (txDate.getDate() !== correctDay) {
        const correctDate = new Date(txDate.getFullYear(), txDate.getMonth(), correctDay)
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { date: correctDate },
        })
        recurringFixed++
      }
    } catch (err) {
      console.error(`Failed to fix recurring transaction date ${tx.id}:`, err)
    }
  }

  return {
    creditCardBilling: ccFixed,
    recurringIncome: incomeFixed,
    recurringTransactions: recurringFixed,
    total: ccFixed + incomeFixed + recurringFixed,
  }
}
